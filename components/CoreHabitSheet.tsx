import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type CoreHabitSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Wrap children in a ScrollView (default true). Set false for custom layouts. */
  scrollable?: boolean;
  /**
   * When true, sheet height follows content (capped below the status bar)
   * instead of filling the screen. Useful for short lists like Update Goal.
   */
  fitContent?: boolean;
};

/**
 * Shared chrome for core habit logging modals:
 * fade dim + slide sheet, tucked below the Dynamic Island / status bar.
 * Lifts above the keyboard so inputs stay visible.
 */
export default function CoreHabitSheet({
  visible,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  footer,
  scrollable = true,
  fitContent = false,
}: CoreHabitSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);
  const sheetHeightRef = useRef(0);
  const topGap = Math.max(insets.top, 12);
  const maxSheetHeight = screenHeight - topGap;

  const resetKeyboardOffset = (duration = 200) => {
    Animated.timing(keyboardOffset, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setMounted(true);
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(screenHeight);
      keyboardOffset.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
      return;
    }

    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    Keyboard.dismiss();
    keyboardOffset.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: screenHeight,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
      closingRef.current = false;
    });
  }, [visible, screenHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const kbHeight = e?.endCoordinates?.height ?? 0;
      const duration = Platform.OS === 'ios' ? e?.duration ?? 250 : 220;
      const measured = sheetHeightRef.current || sheetHeight;
      // Keep sheet bottom above keyboard, without pushing past the top safe area
      const maxLift = measured > 0 ? Math.max(0, screenHeight - topGap - measured) : kbHeight;
      const lift = Math.min(kbHeight, maxLift || kbHeight);

      Animated.timing(keyboardOffset, {
        toValue: -lift,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    };

    const onHide = (e: any) => {
      const duration = Platform.OS === 'ios' ? e?.duration ?? 250 : 200;
      resetKeyboardOffset(duration);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [mounted, screenHeight, topGap, sheetHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const combinedTranslateY = Animated.add(sheetTranslateY, keyboardOffset);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.dim, { opacity: overlayOpacity }]}
        />
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - sheetHeightRef.current) > 1) {
              sheetHeightRef.current = h;
              setSheetHeight(h);
            }
          }}
          style={[
            fitContent ? styles.slideFit : styles.slide,
            {
              marginTop: fitContent ? 0 : topGap,
              maxHeight: maxSheetHeight,
              transform: [{ translateY: combinedTranslateY }],
            },
          ]}
        >
          <SafeAreaView
            style={[styles.sheet, fitContent && styles.sheetFit]}
            edges={['left', 'right', 'bottom']}
          >
            <View style={styles.header}>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <View style={styles.headerActions}>
                {headerRight}
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={20} color="#1f2937" />
                </TouchableOpacity>
              </View>
            </View>

            <KeyboardAvoidingView
              style={fitContent ? undefined : { flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}
            >
              {scrollable ? (
                <ScrollView
                  style={fitContent ? styles.scrollFit : styles.scroll}
                  contentContainerStyle={[
                    styles.scrollContent,
                    fitContent && styles.scrollContentFit,
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  nestedScrollEnabled
                  bounces={!fitContent}
                >
                  {children}
                </ScrollView>
              ) : (
                <View style={[styles.body, fitContent && styles.bodyFit]}>{children}</View>
              )}
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export const coreHabitStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  /** Equal-width 2-column option tiles (workout training types, etc.) */
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  tileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
  },
  tileTextSelected: {
    color: '#FFFFFF',
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  suggestionBtnSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  suggestionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  suggestionEyebrowSelected: {
    color: 'rgba(255,255,255,0.65)',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  suggestionTitleSelected: {
    color: '#FFFFFF',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
  },
  secondaryBtnText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '700',
  },
  durationCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  slide: {
    flex: 1,
  },
  slideFit: {
    width: '100%',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  sheetFit: {
    flex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollFit: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  scrollContentFit: {
    flexGrow: 0,
    paddingBottom: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  bodyFit: {
    flex: 0,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
