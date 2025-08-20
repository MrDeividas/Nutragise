import React, { useEffect, Suspense, lazy } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from './state/authStore';
import { useTheme } from './state/themeStore';
import CustomBackground from './components/CustomBackground';

// Core screens (loaded immediately)
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import NewGoalScreen from './screens/NewGoalScreen';

// Lazy-loaded screens (loaded on demand)
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ProfileSettingsScreen = lazy(() => import('./screens/ProfileSettingsScreen'));
const ProfileCardScreen = lazy(() => import('./screens/ProfileCardScreen'));
const GoalsScreen = lazy(() => import('./screens/GoalsScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const GoalDetailScreen = lazy(() => import('./screens/GoalDetailScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const ActionScreen = lazy(() => import('./screens/ActionScreen'));
const UserProfileScreen = lazy(() => import('./screens/UserProfileScreen'));
const FollowersScreen = lazy(() => import('./screens/FollowersScreen'));
const FollowingScreen = lazy(() => import('./screens/FollowingScreen'));
const CompetitionsScreen = lazy(() => import('./screens/CompetitionsScreen'));
const InsightsScreen = lazy(() => import('./screens/InsightsScreen'));
const MeditationScreen = lazy(() => import('./screens/MeditationScreen'));
const MicrolearningScreen = lazy(() => import('./screens/MicrolearningScreen'));
const InformationDetailScreen = lazy(() => import('./screens/InformationDetailScreen'));

import { GoalsStackParamList } from './screens/GoalDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading component for Suspense fallback
function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: 'rgba(20, 19, 19, 0.8)' }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
    </View>
  );
}

// Goals Stack with Suspense wrapper
function GoalsStack() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false
        }}
      >
        <Stack.Screen name="GoalsList" component={GoalsScreen} />
        <Stack.Screen name="NewGoal" component={NewGoalScreen} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen as any} />
      </Stack.Navigator>
    </Suspense>
  );
}

// Action Stack
function ActionStack() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false
        }}
      >
        <Stack.Screen name="ActionMain" component={ActionScreen} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen as any} />
      </Stack.Navigator>
    </Suspense>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false
        }}
      >
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="ProfileCard" component={ProfileCardScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen as any} />
        <Stack.Screen name="Followers" component={FollowersScreen as any} />
        <Stack.Screen name="Following" component={FollowingScreen as any} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen as any} />
      </Stack.Navigator>
    </Suspense>
  );
}

// Main Tab Navigator (only visible tabs)
function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: 'rgba(128, 128, 128, 0.15)',
          borderTopColor: 'rgba(128, 128, 128, 0.2)',
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          borderTopWidth: 0,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }: any) => {
          let iconName: any = 'home-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Action') iconName = 'flash-outline';
          else if (route.name === 'Insights') iconName = 'trending-up';
          else if (route.name === 'Goals') iconName = 'walk-outline';
          else if (route.name === 'Discover') iconName = 'trophy-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Action" component={ActionStack} options={{ tabBarLabel: 'Action' }} />
      <Tab.Screen 
        name="Insights" 
        options={{ tabBarLabel: 'Insights' }}>
        {() => (
          <Suspense fallback={<LoadingScreen />}>
            <InsightsScreen />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Home" 
        options={{ tabBarLabel: 'Feed' }}>
        {() => (
          <Suspense fallback={<LoadingScreen />}>
            <HomeScreen />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="Goals" component={GoalsStack} />
      <Tab.Screen 
        name="Discover" 
        options={{ tabBarLabel: 'Competitions' }}>
        {() => (
          <Suspense fallback={<LoadingScreen />}>
            <CompetitionsScreen />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// Root App Stack Navigator
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250, // Reduced from default 300ms for snappier feel
        gestureEnabled: true
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="Meditation" 
        component={MeditationScreen}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'vertical'
        }}
      />
      <Stack.Screen 
        name="Microlearning" 
        component={MicrolearningScreen}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'vertical'
        }}
      />
      <Stack.Screen 
        name="InformationDetail" 
        component={InformationDetailScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Insights" 
        component={InsightsScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false
        // Use default navigation behavior like Tab.Navigator
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const { theme } = useTheme();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <CustomBackground>
        <View style={[styles.loadingContainer, { backgroundColor: 'rgba(20, 19, 19, 0.8)' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </CustomBackground>
    );
  }

  // Check if user needs to complete profile setup
  const needsProfileSetup = user && (!user.username || !user.bio);

  return (
    <CustomBackground>
      <SafeAreaProvider>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: '#129490',
              background: 'transparent',
              card: 'transparent',
              text: '#1f2937',
              border: '#e5e7eb',
              notification: '#ff3b30',
            },
            fonts: {
              regular: {
                fontFamily: 'System',
                fontWeight: '400',
              },
              medium: {
                fontFamily: 'System',
                fontWeight: '500',
              },
              bold: {
                fontFamily: 'System',
                fontWeight: '700',
              },
              heavy: {
                fontFamily: 'System',
                fontWeight: '900',
              },
            },
          }}
        >
          {user ? (
            needsProfileSetup ? <ProfileSetupScreen /> : <AppStack />
          ) : (
            <AuthStack />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
