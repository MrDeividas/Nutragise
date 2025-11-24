import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
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
    <View style={[styles.container, { paddingBottom: insets.bottom || 20 }]}>
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
            if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
            else if (route.name === 'Action') iconName = isFocused ? 'flash' : 'flash-outline';
            else if (route.name === 'Goals') iconName = isFocused ? 'walk' : 'walk-outline';
            else if (route.name === 'Discover') iconName = isFocused ? 'podium' : 'podium-outline';
            else if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';

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
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? theme.primary : '#9CA3AF'} 
                />
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
          <View style={[
            styles.circleContent,
            isInsightsFocused && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
          ]}>
            <Ionicons 
              name="trending-up" 
              size={28} 
              color={isInsightsFocused ? theme.primary : theme.textPrimary} 
            />
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
    borderRadius: 32,
    paddingHorizontal: 16,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  }
});

