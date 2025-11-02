import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useOnboardingStore } from '../state/onboardingStore';
import { useAuthStore } from '../state/authStore';
import { onboardingService } from '../lib/onboardingService';
import { supabase } from '../lib/supabase';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import CustomBackground from '../components/CustomBackground';

// Import step components
import ReferralCodeStep from '../components/onboarding/ReferralCodeStep';
import DateOfBirthStep from '../components/onboarding/DateOfBirthStep';
import LifeDescriptionStep from '../components/onboarding/LifeDescriptionStep';
import ChangeReasonStep from '../components/onboarding/ChangeReasonStep';
import ProudMomentStep from '../components/onboarding/ProudMomentStep';
import MorningMotivationStep from '../components/onboarding/MorningMotivationStep';
import CurrentStateStep from '../components/onboarding/CurrentStateStep';
import HabitSelectionStep from '../components/onboarding/HabitSelectionStep';
import PremiumFeaturesStep from '../components/onboarding/PremiumFeaturesStep';
import GoalCreationStep from '../components/onboarding/GoalCreationStep';
import RatingsStep from '../components/onboarding/RatingsStep';
import CalendarPreviewStep from '../components/onboarding/CalendarPreviewStep';
import AffirmationStep from '../components/onboarding/AffirmationStep';

export default function OnboardingScreen({ navigation }: any) {
  const { theme } = useTheme();
  const {
    currentStep,
    totalSteps,
    data,
    setStep,
    goNext,
    goPrevious,
    updateField,
    updateData,
    reset,
    loadSavedData
  } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Check for saved onboarding data on mount
  useEffect(() => {
    const loadSavedOnboarding = async () => {
      const { user: currentUser } = useAuthStore.getState();
      if (!currentUser) return;

      try {
        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_last_step, referral_code, is_premium')
          .eq('id', currentUser.id)
          .single();

        if (profileData && !profileData.onboarding_completed && profileData.onboarding_last_step) {
          // Restore saved step and data
          const savedData: any = {};
          
          if (profileData.referral_code) savedData.referralCode = profileData.referral_code;
          if (profileData.is_premium !== null && profileData.is_premium !== undefined) {
            savedData.isPremium = profileData.is_premium;
          }
          
          // Don't load saved habits when resuming onboarding
          // Step 2 should always start fresh with no habits selected
          // User will need to select habits again when they reach step 2

          if (Object.keys(savedData).length > 0 || profileData.onboarding_last_step) {
            loadSavedData(savedData, profileData.onboarding_last_step || 1);
          }
        }
      } catch (error) {
        console.error('Error loading saved onboarding data:', error);
      }
    };

    loadSavedOnboarding();
  }, []);

  const canGoNext = () => {
    switch (currentStep) {
      case 2: {
        // Step 2: Habit Selection - Must have at least 6 habits and ALL selected habits must have frequencies
        // Compulsory habits: sleep, water (auto-selected), update_goal and reflect (must be selected manually)
        // For fixed habits (sleep, water), they should have all 7 days
        // For update_goal: needs at least 1 day per week
        // For reflect: needs at least 2 days per week
        // For other habits, they need at least 3 days per week
        
        // Check if compulsory habits are selected
        const hasUpdateGoal = data.selectedHabits.includes('update_goal');
        const hasReflect = data.selectedHabits.includes('reflect');
        if (!hasUpdateGoal) {
          console.log('❌ update_goal (compulsory) not selected');
          return false;
        }
        if (!hasReflect) {
          console.log('❌ reflect (compulsory) not selected');
          return false;
        }
        
        const hasMinHabits = data.selectedHabits.length >= 6;
        
        if (!hasMinHabits) {
          console.log('❌ Not enough habits:', data.selectedHabits.length);
          return false;
        }
        
        // Check that every selected habit has a valid frequency
        const invalidHabits: string[] = [];
        const allHaveValidFrequencies = data.selectedHabits.every(habitId => {
          const freq = data.habitFrequencies[habitId];
          
          // If no frequency array exists, it's invalid
          if (!freq || !Array.isArray(freq) || freq.length !== 7) {
            invalidHabits.push(`${habitId}: no frequency array`);
            return false;
          }
          
          // Check if at least one day is selected
          if (!freq.some(day => day === true)) {
            invalidHabits.push(`${habitId}: no days selected`);
            return false;
          }
          
          const dayCount = freq.filter(day => day === true).length;
          const isFixed = ['sleep', 'water'].includes(habitId);
          
          // Fixed habits must have all 7 days selected
          if (isFixed) {
            if (dayCount !== 7) {
              invalidHabits.push(`${habitId}: fixed habit should have 7 days, has ${dayCount}`);
              return false;
            }
            return true;
          }
          
          // update_goal needs at least 1 day
          if (habitId === 'update_goal') {
            if (dayCount < 1) {
              invalidHabits.push(`${habitId}: needs at least 1 day, has ${dayCount}`);
              return false;
            }
            return true;
          }
          
          // reflect needs at least 2 days
          if (habitId === 'reflect') {
            if (dayCount < 2) {
              invalidHabits.push(`${habitId}: needs at least 2 days, has ${dayCount}`);
              return false;
            }
            return true;
          }
          
          // Other habits need at least 3 days
          if (dayCount < 3) {
            invalidHabits.push(`${habitId}: needs at least 3 days, has ${dayCount}`);
            return false;
          }
          return true;
        });
        
        if (!allHaveValidFrequencies && invalidHabits.length > 0) {
          console.log('❌ Invalid habits:', invalidHabits);
          console.log('📊 Selected habits:', data.selectedHabits);
          console.log('📊 Frequencies:', JSON.stringify(data.habitFrequencies, null, 2));
        }
        
        const result = allHaveValidFrequencies;
        console.log('✅ Validation result:', result, '| Habits:', data.selectedHabits.length, '| All valid:', result);
        
        return result;
      }
      case 5: return !!data.dateOfBirth;
      case 6: return !!data.lifeDescription;
      case 7: return !!data.changeReason;
      case 8: return !!data.proudMoment;
      case 9: return !!data.morningMotivation;
      case 10: return !!data.currentState;
      case 11: return data.goals.length > 0;
      case 13: return data.affirmationSigned;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) {
      Alert.alert('Required', 'Please complete this step before continuing');
      return;
    }

    if (currentStep === totalSteps) {
      handleComplete();
    } else {
      goNext();
    }
  };

  const handleExitOnboarding = async () => {
    setExiting(true);
    try {
      const { user: currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        Alert.alert('Error', 'Session expired. Please sign in again.');
        setExiting(false);
        return;
      }

      // Prepare partial data with only entered fields
      const partialData: any = {};
      if (data.referralCode) partialData.referralCode = data.referralCode;
      if (data.selectedHabits && data.selectedHabits.length > 0) {
        partialData.selectedHabits = data.selectedHabits;
      }
      if (data.habitFrequencies && Object.keys(data.habitFrequencies).length > 0) {
        partialData.habitFrequencies = data.habitFrequencies;
      }
      if (data.isPremium !== undefined && data.isPremium !== null) {
        partialData.isPremium = data.isPremium;
      }

      // Save partial data
      const success = await onboardingService.savePartialOnboardingData(
        currentUser.id, 
        partialData, 
        currentStep
      );

      if (!success) {
        Alert.alert('Error', 'Failed to save your progress. Please try again.');
        setExiting(false);
        return;
      }

      // Save habits if they exist
      if (data.selectedHabits && data.selectedHabits.length > 0) {
        await dailyHabitsService.updateSelectedHabits(currentUser.id, data.selectedHabits);
      }

      // Save habit frequencies
      if (data.habitFrequencies && Object.keys(data.habitFrequencies).length > 0) {
        for (const [habitId, schedule] of Object.entries(data.habitFrequencies)) {
          await dailyHabitsService.updateHabitSchedule(currentUser.id, habitId, schedule);
        }
      }

      setExiting(false);
      
      // Check if user already has a username/profile set up
      // Check both profiles and users tables
      const [profileResult, userResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', currentUser.id)
          .single(),
        supabase
          .from('users')
          .select('username')
          .eq('id', currentUser.id)
          .single()
      ]);

      const profileData = profileResult.data;
      const userData = userResult.data;
      const username = profileData?.username || userData?.username;

      // Check if username exists and is not just a UUID or email prefix (default placeholders)
      // If username matches the user ID (UUID format) or email prefix, it's a placeholder
      const hasRealUsername = username && 
                             username !== currentUser.id &&
                             username !== currentUser.email?.split('@')[0];

      if (hasRealUsername) {
        // User already has a profile set up, just go back to main app
        console.log('✅ Profile already set up, navigating back to main app');
        navigation.goBack();
      } else {
        // User doesn't have a profile yet, navigate to ProfileSetup
        console.log('ℹ️ Profile not set up, navigating to ProfileSetup');
        navigation.navigate('ProfileSetup');
      }
    } catch (error) {
      console.error('Error exiting onboarding:', error);
      Alert.alert('Error', 'Failed to exit onboarding');
      setExiting(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Get current user from auth store
      const { user: currentUser } = useAuthStore.getState();
      
      if (!currentUser) {
        console.error('No user found in auth store');
        Alert.alert('Error', 'Session expired. Please sign in again.');
        setSaving(false);
        return;
      }

      // Save onboarding data
      const success = await onboardingService.saveOnboardingData(currentUser.id, data);

      if (!success) {
        Alert.alert(
          'Database Error', 
          'Failed to save your onboarding data. This may be due to missing database columns. Please check the terminal logs and run the database migration in Supabase. See ONBOARDING_SETUP_INSTRUCTIONS.md for details.'
        );
        setSaving(false);
        return;
      }

      // Ensure user exists in users table before creating goals
      await supabase.from('users').upsert({
        id: currentUser.id,
        email: currentUser.email
      });

      // Create initial goals
      for (const goal of data.goals) {
        await onboardingService.createInitialGoal(currentUser.id, goal);
      }

      // If premium selected and not signed, show paywall (placeholder)
      if (data.isPremium) {
        Alert.alert('Premium Selected', 'Paywall coming soon! Continuing to app...');
      }

      // Reset onboarding state
      reset();
      setSaving(false);

      // Check if user already has a username/profile set up
      const [profileResult, userResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', currentUser.id)
          .single(),
        supabase
          .from('users')
          .select('username')
          .eq('id', currentUser.id)
          .single()
      ]);

      const profileData = profileResult.data;
      const userData = userResult.data;
      const username = profileData?.username || userData?.username;

      // Check if username exists and is not just a UUID or email prefix (default placeholders)
      const hasRealUsername = username && 
                             username !== currentUser.id &&
                             username !== currentUser.email?.split('@')[0];

      if (hasRealUsername) {
        // User already has a profile set up, let App.tsx handle navigation to main app
        console.log('✅ Profile already set up, onboarding complete');
        // Don't navigate - App.tsx will detect onboarding_completed: true and show main app
      } else {
        // User doesn't have a profile yet, navigate to ProfileSetup
        console.log('ℹ️ Profile not set up, navigating to ProfileSetup');
        navigation.navigate('ProfileSetup');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding');
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ReferralCodeStep
            value={data.referralCode || ''}
            onChange={(v) => updateField('referralCode', v)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <HabitSelectionStep
            selectedHabits={data.selectedHabits}
            habitFrequencies={data.habitFrequencies}
            isPremium={data.isPremium}
            onChange={(updates) => updateData(updates)}
          />
        );
      case 3:
        return <PremiumFeaturesStep />;
      case 4:
        return (
          <RatingsStep
            value={data.initialRatings}
            onChange={(ratings) => updateData(ratings)}
          />
        );
      case 5:
        return (
          <DateOfBirthStep
            value={data.dateOfBirth || ''}
            onChange={(v) => updateField('dateOfBirth', v)}
          />
        );
      case 6:
        return (
          <LifeDescriptionStep
            value={data.lifeDescription || ''}
            onChange={(v) => updateField('lifeDescription', v)}
          />
        );
      case 7:
        return (
          <ChangeReasonStep
            value={data.changeReason || ''}
            onChange={(v) => updateField('changeReason', v)}
          />
        );
      case 8:
        return (
          <ProudMomentStep
            value={data.proudMoment || ''}
            onChange={(v) => updateField('proudMoment', v)}
          />
        );
      case 9:
        return (
          <MorningMotivationStep
            value={data.morningMotivation || ''}
            onChange={(v) => updateField('morningMotivation', v)}
          />
        );
      case 10:
        return (
          <CurrentStateStep
            value={data.currentState || ''}
            onChange={(v) => updateField('currentState', v)}
          />
        );
      case 11:
        return (
          <GoalCreationStep
            value={data.goals}
            onChange={(v) => updateField('goals', v)}
          />
        );
      case 12:
        return (
          <CalendarPreviewStep selectedHabits={data.selectedHabits} />
        );
      case 13:
        return (
          <AffirmationStep
            value={data.affirmationSigned}
            onChange={(v) => updateField('affirmationSigned', v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={goPrevious}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.stepIndicator, { color: theme.textSecondary }]}>
            Step {currentStep} of {totalSteps}
          </Text>
          {currentStep >= 3 ? (
            <TouchableOpacity 
              style={styles.exitButtonTop} 
              onPress={handleExitOnboarding}
              disabled={exiting}
            >
              {exiting ? (
                <ActivityIndicator size="small" color={theme.textPrimary} />
              ) : (
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}>
          <View
            style={[styles.progressBar, { width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: theme.primary }]}
          />
        </View>

        {/* Step Content */}
        <View style={styles.content}>{renderStep()}</View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: canGoNext() ? theme.primary : 'rgba(128, 128, 128, 0.3)',
                }
              ]}
              onPress={handleNext}
              disabled={!canGoNext() || saving}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === totalSteps ? (saving ? 'Saving...' : "I'm Committed") : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  exitButtonTop: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 4,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  footerButtons: {
    flexDirection: 'row',
  },
  nextButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

