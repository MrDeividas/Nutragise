import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useOnboardingStore } from '../state/onboardingStore';
import { useAuthStore } from '../state/authStore';
import { onboardingService } from '../lib/onboardingService';
import { supabase } from '../lib/supabase';
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
    reset
  } = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  const canGoNext = () => {
    switch (currentStep) {
      case 2: return !!data.dateOfBirth;
      case 3: return !!data.lifeDescription;
      case 4: return !!data.changeReason;
      case 5: return !!data.proudMoment;
      case 6: return !!data.morningMotivation;
      case 7: return !!data.currentState;
      case 8: {
        // Must have at least 6 habits and ALL selected habits must have frequencies
        const hasMinHabits = data.selectedHabits.length >= 6;
        const allHaveFrequencies = data.selectedHabits.every(habitId => {
          const freq = data.habitFrequencies[habitId];
          return freq && freq.some(day => day);
        });
        return hasMinHabits && allHaveFrequencies;
      }
      case 10: return data.goals.length > 0;
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

      // Navigate to profile setup to complete profile
      navigation.navigate('ProfileSetup');
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
          <DateOfBirthStep
            value={data.dateOfBirth || ''}
            onChange={(v) => updateField('dateOfBirth', v)}
          />
        );
      case 3:
        return (
          <LifeDescriptionStep
            value={data.lifeDescription || ''}
            onChange={(v) => updateField('lifeDescription', v)}
          />
        );
      case 4:
        return (
          <ChangeReasonStep
            value={data.changeReason || ''}
            onChange={(v) => updateField('changeReason', v)}
          />
        );
      case 5:
        return (
          <ProudMomentStep
            value={data.proudMoment || ''}
            onChange={(v) => updateField('proudMoment', v)}
          />
        );
      case 6:
        return (
          <MorningMotivationStep
            value={data.morningMotivation || ''}
            onChange={(v) => updateField('morningMotivation', v)}
          />
        );
      case 7:
        return (
          <CurrentStateStep
            value={data.currentState || ''}
            onChange={(v) => updateField('currentState', v)}
          />
        );
      case 8:
        return (
          <HabitSelectionStep
            selectedHabits={data.selectedHabits}
            habitFrequencies={data.habitFrequencies}
            isPremium={data.isPremium}
            onChange={(updates) => updateData(updates)}
          />
        );
      case 9:
        return <PremiumFeaturesStep />;
      case 10:
        return (
          <GoalCreationStep
            value={data.goals}
            onChange={(v) => updateField('goals', v)}
          />
        );
      case 11:
        return (
          <RatingsStep
            value={data.initialRatings}
            onChange={(ratings) => updateData(ratings)}
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
          <View style={styles.placeholder} />
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
  nextButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

