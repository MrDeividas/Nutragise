import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useNotificationsStore } from '../state/notificationsStore';

const TAB_BAR_HEIGHT = 64;
const PILL_PADDING = 6;
const INDICATOR_INSET = 4;

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
  const { user } = useAuthStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const [barWidth, setBarWidth] = useState(0);

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

  const indicatorX = useRef(new Animated.Value(0)).current;
  const scales = useRef(DISPLAY_ORDER.map(() => new Animated.Value(1))).current;
  const hasPositioned = useRef(false);

  // Slide the glass highlight from the previous tab to the newly selected one
  useEffect(() => {
    if (tabWidth <= 0) return;
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
  }, [activeIndex, tabWidth, indicatorX]);

  // Pop the active icon slightly as it becomes selected
  useEffect(() => {
    scales.forEach((scale, i) => {
      Animated.spring(scale, {
        toValue: i === activeIndex ? 1.14 : 1,
        useNativeDriver: true,
        stiffness: 260,
        damping: 18,
        mass: 0.7,
      }).start();
    });
  }, [activeIndex, scales]);

  return (
    <View style={[styles.container, { paddingBottom: (insets.bottom || 20) - 8 }]}>
      <View
        style={styles.pillContainer}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width - PILL_PADDING * 2)}
      >
        {/* Sliding glass highlight */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: tabWidth - INDICATOR_INSET * 2,
                transform: [{ translateX: Animated.add(indicatorX, INDICATOR_INSET) }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.22)', 'rgba(16, 185, 129, 0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Top sheen for the frosted-glass feel */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.indicatorSheen}
            />
          </Animated.View>
        )}

        {orderedRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = route.key === activeRouteKey;
          const orderIndex = DISPLAY_ORDER.indexOf(route.name);
          const scale = scales[orderIndex === -1 ? 0 : orderIndex];

          const onPress = () => {
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

          // Icons are unlabelled, so surface the tab name to screen readers instead
          const label = String(
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name
          );

          const tint = isFocused ? theme.primary : '#9CA3AF';

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
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                {route.name === 'Profile' ? (
                  <View
                    style={[
                      styles.profileAvatarContainer,
                      isFocused && { borderColor: theme.primary, borderWidth: 2 },
                    ]}
                  >
                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
                    ) : (
                      <View
                        style={[
                          styles.profileAvatarPlaceholder,
                          { backgroundColor: isFocused ? theme.primary : '#9CA3AF' },
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
                    <Ionicons name={iconName} size={25} color={tint} />
                    {route.name === 'Action' && unreadCount > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    borderRadius: 20,
    paddingHorizontal: PILL_PADDING,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  indicator: {
    position: 'absolute',
    left: PILL_PADDING,
    top: PILL_PADDING,
    bottom: PILL_PADDING,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    width: 27,
    height: 27,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  robotIcon: {
    width: 27,
    height: 27,
    borderRadius: 7,
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
