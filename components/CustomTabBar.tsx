import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useNotificationsStore } from '../state/notificationsStore';

const TAB_BAR_HEIGHT = 56;
const PILL_PADDING = 4;
const INDICATOR_INSET = 1;
const SIDE_INSET = 28;

/** Left-to-right order the tabs appear in, independent of navigator registration order. */
const DISPLAY_ORDER = ['Action', 'Discover', 'Goals', 'Community', 'Insights', 'Profile'];

export const useBottomNavPadding = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = (insets.bottom || 20) - 8;
  return TAB_BAR_HEIGHT + bottomPadding + 10;
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuthStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const hasPositioned = useRef(false);

  const focusedOptions = descriptors[state.routes[state.index]?.key]?.options ?? {};
  const tabBarStyle = focusedOptions.tabBarStyle as { display?: string } | undefined;
  const hideTabBar = authLoading || tabBarStyle?.display === 'none';

  const orderedRoutes = [...state.routes].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.name);
    const bi = DISPLAY_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(
    0,
    orderedRoutes.findIndex((r) => r.key === activeRouteKey)
  );

  const tabCount = orderedRoutes.length;
  const tabWidth = barWidth > 0 ? barWidth / tabCount : 0;

  const bounceNavBar = () => {
    pillScale.stopAnimation();
    pillScale.setValue(1);
    Animated.sequence([
      Animated.timing(pillScale, {
        toValue: 1.0225,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(pillScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 170,
      }),
    ]).start();
  };

  // Slide the glass highlight from the previous tab to the newly selected one
  useEffect(() => {
    if (hideTabBar || tabWidth <= 0) return;
    const toValue = activeIndex * tabWidth;

    // Place it instantly the first time so it doesn't slide in on app launch
    if (!hasPositioned.current) {
      hasPositioned.current = true;
      indicatorX.setValue(toValue);
      return;
    }

    Animated.spring(indicatorX, {
      toValue,
      useNativeDriver: true,
      stiffness: 230,
      damping: 24,
      mass: 0.9,
    }).start();
  }, [activeIndex, tabWidth, indicatorX, hideTabBar]);

  if (hideTabBar) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: (insets.bottom || 20) - 8 }]}>
      {/* Outer wrapper keeps shadow (overflow:hidden on glass would clip it) */}
      <Animated.View style={[styles.pillShadow, { transform: [{ scale: pillScale }] }]}>
        <View
          style={styles.pillGlass}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width - PILL_PADDING * 2)}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidGlassFallback]} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.glassSheen}
            pointerEvents="none"
          />

          {/* Sliding glass highlight */}
          {tabWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  width: tabWidth - INDICATOR_INSET * 2,
                  transform: [{ translateX: indicatorX }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(31, 41, 55, 0.16)', 'rgba(31, 41, 55, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.indicatorSheen}
              />
            </Animated.View>
          )}

          {orderedRoutes.map((route) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            const isFocused = route.key === activeRouteKey;

            const onPress = () => {
              bounceNavBar();

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            let iconName: any = 'home-outline';
            if (route.name === 'Community') iconName = isFocused ? 'people' : 'people-outline';
            else if (route.name === 'Action') iconName = isFocused ? 'flash' : 'flash-outline';
            else if (route.name === 'Goals') iconName = isFocused ? 'trending-up' : 'trending-up-outline';
            else if (route.name === 'Discover') iconName = isFocused ? 'podium' : 'podium-outline';

            const label = String(
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name
            );

            const tint = isFocused ? theme.textPrimary : '#9CA3AF';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                testID={(options as any).tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={1}
              >
                {route.name === 'Profile' ? (
                  <View style={styles.profileAvatarContainer}>
                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
                    ) : (
                      <View
                        style={[
                          styles.profileAvatarPlaceholder,
                          { backgroundColor: isFocused ? theme.textPrimary : '#9CA3AF' },
                        ]}
                      >
                        <Text style={styles.profileAvatarInitial}>
                          {user?.username?.charAt(0)?.toUpperCase() ||
                            user?.email?.charAt(0)?.toUpperCase() ||
                            'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : route.name === 'Insights' ? (
                  <Image
                    source={require('../assets/robot-icon.png')}
                    style={[styles.robotIcon, { opacity: isFocused ? 1 : 0.55 }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View>
                    <Ionicons name={iconName} size={28} color={tint} />
                    {route.name === 'Action' && unreadCount > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIDE_INSET,
    backgroundColor: 'transparent',
  },
  pillShadow: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  pillGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: PILL_PADDING,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  androidGlassFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  glassTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  indicator: {
    position: 'absolute',
    left: PILL_PADDING + INDICATOR_INSET,
    top: PILL_PADDING,
    bottom: PILL_PADDING,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  indicatorSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.9)',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarInitial: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  robotIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
