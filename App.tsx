import React, { useEffect, useState, Suspense, lazy } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';

import { useAuthStore } from './state/authStore';
import { useTheme } from './state/themeStore';
import { supabase } from './lib/supabase';
import { stripeService } from './lib/stripeService';
import CustomBackground from './components/CustomBackground';
import CustomTabBar from './components/CustomTabBar';

// Core screens (loaded immediately)
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import GoalsScreen from './screens/GoalsScreen';
import WorkoutSplitScreen from './screens/WorkoutSplitScreen';
import CreateCustomSplitScreen from './screens/CreateCustomSplitScreen';
import WorkoutHistoryScreen from './screens/WorkoutHistoryScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import FollowersScreen from './screens/FollowersScreen';
import FollowingScreen from './screens/FollowingScreen';
import ChallengeDetailScreen from './screens/ChallengeDetailScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import WalletScreen from './screens/WalletScreen';
import CompeteScreen from './screens/CompeteScreen';
import StoreScreen from './screens/StoreScreen';
import InventoryScreen from './screens/InventoryScreen';
import RaffleScreen from './screens/RaffleScreen';

// Lazy-loaded screens (loaded on demand)
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ProfileSettingsScreen = lazy(() => import('./screens/ProfileSettingsScreen'));
const ProfileCardScreen = lazy(() => import('./screens/ProfileCardScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const GoalDetailScreen = lazy(() => import('./screens/GoalDetailScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const ActionScreen = lazy(() => import('./screens/ActionScreen'));
const InsightsScreen = lazy(() => import('./screens/InsightsScreen'));
const MeditationScreen = lazy(() => import('./screens/MeditationScreen'));
const MicrolearningScreen = lazy(() => import('./screens/MicrolearningScreen'));
const FocusScreen = lazy(() => import('./screens/FocusScreen'));
const InformationDetailScreen = lazy(() => import('./screens/InformationDetailScreen'));
const DMScreen = lazy(() => import('./screens/DMScreen'));
const ChatWindowScreen = lazy(() => import('./screens/ChatWindowScreen'));

import { GoalsStackParamList } from './screens/GoalDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading component for Suspense fallback
function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: '#FFFFFF' }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textPrimary }]}>Loading...</Text>
    </View>
  );
}

// Goals Stack
function GoalsStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false
      }}
    >
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen as any}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'vertical'
        }}
      />
      <Stack.Screen 
        name="WorkoutSplit" 
        component={WorkoutSplitScreen}
      />
      <Stack.Screen 
        name="CreateCustomSplit" 
        component={CreateCustomSplitScreen}
      />
      <Stack.Screen 
        name="WorkoutHistory" 
        component={WorkoutHistoryScreen}
      />
    </Stack.Navigator>
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
        <Stack.Screen 
          name="GoalDetail" 
          component={GoalDetailScreen as any}
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 200,
            gestureEnabled: true,
            gestureDirection: 'vertical'
          }}
        />
      </Stack.Navigator>
    </Suspense>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}
    >
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen 
          name="ProfileSettings" 
          component={ProfileSettingsScreen}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
        <Stack.Screen 
          name="ProfileCard" 
          component={ProfileCardScreen}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
        <Stack.Screen 
          name="UserProfile" 
          component={UserProfileScreen as any}
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 200,
            gestureEnabled: true,
            gestureDirection: 'vertical',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="Followers" 
          component={FollowersScreen as any}
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 200,
            gestureEnabled: true,
            gestureDirection: 'vertical',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="Following" 
          component={FollowingScreen as any}
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 200,
            gestureEnabled: true,
            gestureDirection: 'vertical',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen as any}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
        <Stack.Screen 
          name="DM" 
          component={DMScreen as any}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
        <Stack.Screen 
          name="ChatWindow" 
          component={ChatWindowScreen as any}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
        {/* <Stack.Screen name="Test" component={TestScreen as any} /> */}
        <Stack.Screen 
          name="GoalDetail" 
          component={GoalDetailScreen as any}
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 200,
            gestureEnabled: true,
            gestureDirection: 'vertical'
          }}
        />
      </Stack.Navigator>
  );
}

// Main Tab Navigator (only visible tabs)
function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute', // Required for custom floating tab bar to sit on top
          backgroundColor: 'transparent',
          elevation: 0,
          borderTopWidth: 0,
        }
      }}
    >
      <Tab.Screen name="Action" component={ActionStack} options={{ tabBarLabel: 'Action' }} />
      <Tab.Screen 
        name="Discover"
        options={{ tabBarLabel: 'Compete' }}>
        {({ navigation }) => (
            <CompeteScreen navigation={navigation} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Goals" component={GoalsStack} />
      <Tab.Screen 
        name="Insights" 
        options={{ tabBarLabel: 'Insights' }}>
        {({ navigation }) => (
          <Suspense fallback={<LoadingScreen />}>
            <InsightsScreen navigation={navigation} />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Home" 
        options={{ tabBarLabel: 'Community' }}>
        {({ navigation }) => (
          <Suspense fallback={<LoadingScreen />}>
            <HomeScreen navigation={navigation} />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// Onboarding Stack Navigator
function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
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
        name="Focus" 
        component={FocusScreen}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
          gestureEnabled: false,
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
      <Stack.Screen 
        name="ChallengeDetail" 
        component={ChallengeDetailScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Store" 
        component={StoreScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Raffle" 
        component={RaffleScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'vertical'
        }}
      />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      />
      <Stack.Screen 
        name="ProfileSetup" 
        component={ProfileSetupScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
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
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
          gestureEnabled: true,
          presentation: 'modal',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const { theme } = useTheme();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_last_step')
          .eq('id', user.id)
          .single();
        
        console.log('🔍 Checking onboarding status for user:', user.id);
        console.log('📊 Profile data:', data);
        console.log('❌ Error:', error);
        
        // If onboarding is completed, or if user has progressed past step 1 (has exited), show main app
        const isComplete = data?.onboarding_completed || false;
        const hasPartialProgress = data?.onboarding_last_step && data.onboarding_last_step > 1;
        
        // Show main app if completed OR if user has partial progress (exited onboarding)
        const shouldShowMainApp = isComplete || hasPartialProgress;
        
        console.log('✅ Onboarding complete:', isComplete);
        console.log('📍 Has partial progress:', hasPartialProgress);
        console.log('🏠 Show main app:', shouldShowMainApp);
        
        // Add small delay to prevent navigation stack conflicts
        // Longer delay for new sign-ups to ensure SignUpScreen can be seen
        setTimeout(() => {
          setOnboardingComplete(shouldShowMainApp);
        }, 500);
      } else {
        setOnboardingComplete(null);
      }
    };
    
    checkOnboarding();
  }, [user]);

  if (loading || (user && onboardingComplete === null)) {
    return (
      <CustomBackground>
        <View style={[styles.loadingContainer, { backgroundColor: '#FFFFFF' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>Loading...</Text>
        </View>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <StripeProvider publishableKey={stripeService.getPublishableKey()}>
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
          {user && onboardingComplete === true ? <AppStack /> : 
           user && onboardingComplete === false ? <OnboardingStack /> : 
           <AuthStack />}
        </NavigationContainer>
      </SafeAreaProvider>
      </StripeProvider>
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
