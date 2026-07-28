import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotificationsStore, InAppBanner } from '../state/notificationsStore';
import { useTheme } from '../state/themeStore';

type Props = {
  onPressBanner?: (banner: InAppBanner) => void;
};

function bannerIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'post_like':
      return 'heart';
    case 'post_comment':
    case 'post_reply':
      return 'chatbubble';
    case 'habit_invite':
    case 'habit_invite_accepted':
      return 'people';
    case 'habit_nudge':
      return 'hand-left';
    case 'follow':
      return 'person-add';
    default:
      return 'notifications';
  }
}

export default function InAppNotificationBanner({ onPressBanner }: Props) {
  const banner = useNotificationsStore((s) => s.banner);
  const hideBanner = useNotificationsStore((s) => s.hideBanner);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (banner) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      translateY.value = withTiming(-140, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [banner?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY < -40 || e.velocityY < -500) {
        translateY.value = withTiming(-140, { duration: 180 });
        opacity.value = withTiming(0, { duration: 160 }, () => {
          runOnJS(hideBanner)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  if (!banner) return null;

  const topOffset = Math.max(insets.top, Platform.OS === 'ios' ? 54 : 12) + 6;

  return (
    <GestureHandlerRootView pointerEvents="box-none" style={styles.overlay}>
      <GestureDetector gesture={pan}>
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { paddingTop: topOffset }, animatedStyle]}
        >
          <Pressable
            onPress={() => {
              const current = banner;
              hideBanner();
              if (current && onPressBanner) onPressBanner(current);
            }}
            style={[
              styles.card,
              {
                backgroundColor: '#FFFFFF',
                borderColor: theme.border,
              },
            ]}
          >
            {banner.avatarUrl ? (
              <Image source={{ uri: banner.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primary + '22' }]}>
                <Ionicons
                  name={bannerIcon(banner.type)}
                  size={18}
                  color={theme.primary}
                />
              </View>
            )}
            <View style={styles.textCol}>
              <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={2}>
                {banner.body}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  wrap: {
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 17,
  },
});
