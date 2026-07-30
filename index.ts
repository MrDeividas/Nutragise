import 'react-native-gesture-handler';

import React, { Component, useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Image } from 'react-native';
import { registerRootComponent } from 'expo';

/**
 * Capture fatal JS errors and React render failures.
 * Do NOT import ErrorUtils from 'react-native' — in Expo Go / early Hermes
 * boot it is undefined and crashes with:
 *   TypeError: Cannot read property 'getGlobalHandler' of undefined
 */
type ErrorListener = (message: string) => void;
const errorListeners = new Set<ErrorListener>();
let capturedStartupError: string | null = null;
let previousHandler: ((error: any, isFatal?: boolean) => void) | null = null;

type RNErrorUtils = {
  getGlobalHandler?: () => ((error: any, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: any, isFatal?: boolean) => void) => void;
};

function getErrorUtils(): RNErrorUtils | null {
  const g = globalThis as typeof globalThis & { ErrorUtils?: RNErrorUtils };
  return g.ErrorUtils ?? null;
}

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

function installFatalErrorHandler() {
  const errorUtils = getErrorUtils();
  if (!errorUtils?.setGlobalHandler) return;

  if (!previousHandler && typeof errorUtils.getGlobalHandler === 'function') {
    previousHandler = errorUtils.getGlobalHandler() ?? null;
  }

  errorUtils.setGlobalHandler((error, isFatal) => {
    const message = formatError(error);
    publishError(message);
    if (!isFatal && typeof previousHandler === 'function') {
      previousHandler(error, isFatal);
    }
  });
}

let AppComponent: React.ComponentType;
try {
  // Install after gesture-handler / RN imports so ErrorUtils exists when possible
  installFatalErrorHandler();
  AppComponent = require('./App').default;
} catch (error) {
  publishError(formatError(error));
  AppComponent = function FailedImport() {
    return React.createElement(StartupErrorScreen, {
      message: capturedStartupError || 'Failed to load App module',
    });
  };
}

// Re-install after App load / next ticks — native may replace the handler
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
      React.createElement(Text, { style: styles.errorBanner }, 'STARTUP ERROR'),
      React.createElement(Text, { style: styles.errorTitle }, 'App failed to start'),
      React.createElement(
        Text,
        { style: styles.errorHint },
        'Screenshot this screen and send it — this is the real error.'
      ),
      React.createElement(Text, { style: styles.errorBody, selectable: true }, message)
    )
  );
}

class AppErrorBoundary extends Component<
  { children: React.ReactNode },
  { errorMessage: string | null }
> {
  state = { errorMessage: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return { errorMessage: formatError(error) };
  }

  componentDidCatch(error: unknown) {
    publishError(formatError(error));
  }

  render() {
    if (this.state.errorMessage) {
      return React.createElement(StartupErrorScreen, {
        message: this.state.errorMessage,
      });
    }
    return this.props.children;
  }
}

function Root() {
  const [error, setError] = useState<string | null>(capturedStartupError);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    installFatalErrorHandler();
    setBooted(true);
    const listener: ErrorListener = (message) => setError(message);
    errorListeners.add(listener);
    if (capturedStartupError) setError(capturedStartupError);
    return () => {
      errorListeners.delete(listener);
    };
  }, []);

  const displayError = error || capturedStartupError;
  if (displayError) {
    return React.createElement(StartupErrorScreen, { message: displayError });
  }

  if (!booted) {
    return React.createElement(
      View,
      { style: styles.bootRoot },
      React.createElement(Text, { style: styles.bootBrand }, 'nutragise'),
      React.createElement(Image, {
        source: require('./assets/icon.png'),
        style: styles.bootLogo,
        resizeMode: 'contain',
      }),
      React.createElement(
        Text,
        { style: styles.bootTagline },
        'helping you become 1% better each day'
      )
    );
  }

  return React.createElement(
    AppErrorBoundary,
    null,
    React.createElement(AppComponent)
  );
}

registerRootComponent(Root);

const styles = StyleSheet.create({
  bootRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bootBrand: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 20,
  },
  bootLogo: {
    width: 112,
    height: 112,
    borderRadius: 24,
  },
  bootTagline: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
  },
  errorRoot: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  errorContent: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  errorBanner: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
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
    color: '#991B1B',
    fontFamily: 'Courier',
  },
});
