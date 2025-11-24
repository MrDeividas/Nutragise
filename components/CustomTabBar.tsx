import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { width } = Dimensions.get('window');

  // Separate "Insights" from other tabs
  const insightsRoute = state.routes.find(route => route.name === 'Insights');
  const otherRoutes = state.routes.filter(route => route.name !== 'Insights');

  // If Insights tab is not present (shouldn't happen based on App.tsx), fallback
  if (!insightsRoute) return null;

  const insightsIndex = state.routes.indexOf(insightsRoute);
  const isInsightsFocused = state.index === insightsIndex;

  const onInsightsPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: insightsRoute.key,
      canPreventDefault: true,
    });

    if (!isInsightsFocused && !event.defaultPrevented) {
      navigation.navigate(insightsRoute.name);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: (insets.bottom || 20) - 8 }]}>
      <View style={styles.contentContainer}>
        {/* Left Pill Container */}
        <View style={[styles.pillContainer, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          {otherRoutes.map((route, index) => {
            const originalIndex = state.routes.indexOf(route);
            const { options } = descriptors[route.key];
            const isFocused = state.index === originalIndex;

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
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Get icon name based on route name
            let iconName: any = 'home-outline';
            if (route.name === 'Home') iconName = isFocused ? 'people' : 'people-outline'; // Community icon
            else if (route.name === 'Action') iconName = isFocused ? 'flash' : 'flash-outline';
            else if (route.name === 'Goals') iconName = isFocused ? 'walk' : 'walk-outline';
            else if (route.name === 'Discover') iconName = isFocused ? 'podium' : 'podium-outline';
            // Profile uses avatar image instead of icon

            // Get label
            const label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={(options as any).tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                {route.name === 'Profile' ? (
                  <View style={[
                    styles.profileAvatarContainer,
                    isFocused && styles.profileAvatarContainerFocused
                  ]}>
                    {user?.avatar_url ? (
                      <Image 
                        source={{ uri: user.avatar_url }} 
                        style={styles.profileAvatar}
                      />
                    ) : (
                      <View style={[styles.profileAvatarPlaceholder, { backgroundColor: isFocused ? theme.primary : '#9CA3AF' }]}>
                        <Text style={styles.profileAvatarInitial}>
                          {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={isFocused ? theme.primary : '#9CA3AF'} 
                  />
                )}
                <Text style={[
                  styles.tabLabel, 
                  { color: isFocused ? theme.primary : '#9CA3AF' }
                ]}>
                  {label as string}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Circle Button (Insights) */}
        <TouchableOpacity
          onPress={onInsightsPress}
          style={[
            styles.circleButton, 
            { 
              backgroundColor: '#FFFFFF', // White background as requested
              borderColor: isInsightsFocused ? theme.primary : '#E5E7EB',
              borderWidth: isInsightsFocused ? 2 : 1,
            }
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.circleContent}>
            <Ionicons 
              name="trending-up" 
              size={24} 
              color={isInsightsFocused ? theme.primary : '#9CA3AF'} 
            />
            <Text style={[
              styles.tabLabel, 
              { color: isInsightsFocused ? theme.primary : '#9CA3AF' }
            ]}>
              Insights
            </Text>
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  pillContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1, // Distribute space equally
    height: '100%', // Full height to bottom
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  circleContent: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightsText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  profileAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  profileAvatarContainerFocused: {
    borderColor: '#10B981',
    borderWidth: 2,
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
  }
});

