import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { ErrorUtils, ScrollView, Text, View, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';

/**
 * Capture fatal JS errors BEFORE App loads, and do not forward them to
 * expo-updates ErrorRecovery (which SIGABRTs TestFlight builds with no message).
 * Instead show the error on screen so we can fix the real cause.
 */
type ErrorListener = (message: string) => void;
const errorListeners = new Set<ErrorListener>();
let capturedStartupError: string | null = null;

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ''}`;
  }
  return String(error);
}

function publishError(message: string) {
  capturedStartupError = message;
  errorListeners.forEach((listener) => listener(message));
  console.error('🚨 Startup/fatal error:\n', message);
}

const previousHandler = ErrorUtils.getGlobalHandler?.();

function installFatalErrorHandler() {
  ErrorUtils.setGlobalHandler?.((error, isFatal) => {
    const message = formatError(error);
    publishError(message);
    // Intentionally do NOT call previousHandler for fatal errors — that path is
    // expo-updates ErrorRecovery.crash() which aborts the process on TestFlight.
    if (!isFatal && typeof previousHandler === 'function') {
      previousHandler(error, isFatal);
    }
  });
}

installFatalErrorHandler();

let AppComponent: React.ComponentType;
try {
  // Load App after the handler is installed so import-time throws are caught.
  AppComponent = require('./App').default;
} catch (error) {
  publishError(formatError(error));
  AppComponent = function FailedImport() {
    return null;
  };
}

// expo-updates (and other native modules) may replace the global handler while
// App is importing — put ours back so TestFlight does not SIGABRT.
installFatalErrorHandler();
setTimeout(installFatalErrorHandler, 0);
setTimeout(installFatalErrorHandler, 500);

function StartupErrorScreen({ message }: { message: string }) {
  return React.createElement(
    View,
    { style: styles.errorRoot },
    React.createElement(
      ScrollView,
      { contentContainerStyle: styles.errorContent },
      React.createElement(Text, { style: styles.errorTitle }, 'App failed to start'),
      React.createElement(
        Text,
        { style: styles.errorHint },
        'Screenshot this and send it — this is the real error behind the TestFlight crash.'
      ),
      React.createElement(Text, { style: styles.errorBody, selectable: true }, message)
    )
  );
}

function Root() {
  const [error, setError] = useState<string | null>(capturedStartupError);

  useEffect(() => {
    const listener: ErrorListener = (message) => setError(message);
    errorListeners.add(listener);
    if (capturedStartupError) setError(capturedStartupError);
    return () => {
      errorListeners.delete(listener);
    };
  }, []);

  if (error) {
    return React.createElement(StartupErrorScreen, { message: error });
  }

  return React.createElement(AppComponent);
}

registerRootComponent(Root);

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContent: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  errorBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#B91C1C',
    fontFamily: 'Courier',
  },
});
