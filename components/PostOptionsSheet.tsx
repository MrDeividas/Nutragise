import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DARK = '#1f2937';

export type PostOptionsAction =
  | 'report_photo'
  | 'flag_user'
  | 'block_account';

type PostOptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAction: (action: PostOptionsAction) => void;
};

/**
 * iOS-style action sheet for community post moderation.
 * Matches Nutrapp styling (white cards, dark text) rather than branded purple.
 */
export default function PostOptionsSheet({
  visible,
  onClose,
  onAction,
}: PostOptionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(320)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setMounted(true);
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(320);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else if (mounted) {
      closingRef.current = true;
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 320,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    if (closingRef.current) return;
    onClose();
  };

  const handleAction = (action: PostOptionsAction) => {
    onClose();
    // Let close animation start before parent alerts fire
    setTimeout(() => onAction(action), 80);
  };

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.dim, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.group}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleAction('report_photo')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>Report photo as inappropriate</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleAction('flag_user')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>Flag user for inappropriate content</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleAction('block_account')}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, styles.destructiveText]}>
                Remove/block this account
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelGroup} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  sheet: {
    paddingHorizontal: 12,
    gap: 10,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    textAlign: 'center',
  },
  destructiveText: {
    color: '#DC2626',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
  cancelGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
});
