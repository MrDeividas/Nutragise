import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  useOnboardingStore,
  OnboardingPhaseId,
} from '../state/onboardingStore';
import { useAuthStore } from '../state/authStore';
import { onboardingService } from '../lib/onboardingService';
import { supabase } from '../lib/supabase';
import { dailyHabitsService } from '../lib/dailyHabitsService';

import WelcomeStep from '../components/onboarding/flow/WelcomeStep';
import MemberCardStep from '../components/onboarding/flow/MemberCardStep';
import CalculatingStep from '../components/onboarding/flow/CalculatingStep';
import AnalysisStep from '../components/onboarding/flow/AnalysisStep';
import BarriersStep from '../components/onboarding/flow/BarriersStep';
import { EducationCarouselStep, ProductCarouselStep } from '../components/onboarding/flow/CarouselSteps';
import {
  ScienceDaysStep,
  SciencePlanStep,
  ProgramStartStep,
} from '../components/onboarding/flow/ScienceSteps';
import { TestimonialsStep, PathChartStep } from '../components/onboarding/flow/SocialProofSteps';
import ChooseGoalsStep from '../components/onboarding/flow/ChooseGoalsStep';
import {
  DobFinallyStep,
  ReferralFlowStep,
  RatingPromptStep,
  NotificationsFlowStep,
} from '../components/onboarding/flow/MetaSteps';
import {
  GreetingStep,
  PlanRevealStep,
  JourneyStep,
} from '../components/onboarding/flow/PlanRevealSteps';
import { PaywallStep, MissedBenefitsStep } from '../components/onboarding/flow/PaywallSteps';
import {
  QuizQuestionStep,
  getQuizField,
  HabitSelectionFlowStep,
  AffirmationFlowStep,
} from '../components/onboarding/flow/QuizAndCoreSteps';

const QUIZ_PHASES = ['quizLife', 'quizReason', 'quizProud', 'quizMorning', 'quizState'] as const;

function computeRatings(_data: {
  lifeDescription?: string;
  currentState?: string;
}) {
  const initial = {
    physical: 35,
    mental: 35,
    social: 35,
    emotional: 35,
  };
  const potential = {
    physical: 93,
    mental: 93,
    social: 93,
    emotional: 93,
  };
  return { initialRatings: initial, potentialRatings: potential };
}

export default function OnboardingScreen({ navigation, route }: any) {
  const {
    currentStep,
    totalSteps,
    data,
    goNext,
    goPrevious,
    goToPhase,
    updateField,
    updateData,
    reset,
    loadSavedData,
    getPhaseId,
  } = useOnboardingStore();

  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const phase = getPhaseId();
  const isPreview = !!route?.params?.preview;
  /** Blocks step resets / partial saves while finishing → ProfileSetup */
  const finishingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (finishingRef.current) return;
      const { user } = useAuthStore.getState();
      if (!user) return;
      try {
        const [{ data: profileData }, { data: authData }] = await Promise.all([
          supabase
            .from('profiles')
            .select('onboarding_completed, onboarding_last_step, display_name, username, referred_by')
            .eq('id', user.id)
            .single(),
          supabase.auth.getUser(),
        ]);

        if (finishingRef.current) return;

        // Already finished — don't bounce the wizard back to Let's Go
        if (profileData?.onboarding_completed) {
          const username = profileData.username;
          const hasRealUsername =
            username && username !== user.id && username !== user.email?.split('@')[0];
          if (!hasRealUsername) {
            navigation.replace('ProfileSetup');
          } else {
            useAuthStore.getState().notifyOnboardingFinished();
          }
          return;
        }

        if (profileData?.display_name || profileData?.username) {
          setDisplayName(profileData.display_name || profileData.username);
        }

        if (isPreview) {
          reset();
          return;
        }

        // Prefer Apple / auth given name for the “What should we call you?” field
        const meta = authData?.user?.user_metadata || {};
        const appleGiven =
          (typeof meta.given_name === 'string' && meta.given_name.trim()) ||
          (typeof meta.full_name === 'string' && meta.full_name.trim().split(/\s+/)[0]) ||
          '';
        const profileName =
          profileData?.display_name &&
          profileData.display_name !== 'User' &&
          profileData.display_name !== user.id &&
          profileData.display_name !== user.email?.split('@')[0]
            ? profileData.display_name.trim()
            : '';
        const seededName = appleGiven || profileName || user.display_name || '';

        const seedOnboardingFields = (extra: Record<string, unknown> = {}) => {
          const saved: any = { ...extra };
          if (seededName) saved.displayName = seededName;
          return saved;
        };

        if (profileData && !profileData.onboarding_completed && profileData.onboarding_last_step) {
          let step = profileData.onboarding_last_step > totalSteps ? 1 : profileData.onboarding_last_step;
          if (step <= 1) step = 2;
          loadSavedData(seedOnboardingFields(), step);
        } else {
          if (seededName) {
            updateField('displayName', seededName);
          }
          goToPhase('memberCard');
        }
      } catch (e) {
        console.error('Error loading saved onboarding:', e);
      }
    };
    load();
  }, []);

  // Welcome is the auth landing — skip it once the user is signed in
  useEffect(() => {
    if (finishingRef.current || isPreview) return;
    if (phase === 'welcome') {
      goToPhase('memberCard');
    }
  }, [isPreview, phase, goToPhase]);

  const persistProgress = useCallback(async () => {
    if (isPreview || finishingRef.current || saving) return;
    const { user } = useAuthStore.getState();
    if (!user) return;
    try {
      await onboardingService.savePartialOnboardingData(user.id, data, currentStep);
    } catch {
      /* non-blocking */
    }
  }, [data, currentStep, isPreview, saving]);

  useEffect(() => {
    if (finishingRef.current || saving) return;
    if (currentStep > 1) persistProgress();
  }, [currentStep, persistProgress, saving]);

  const advance = () => {
    goNext();
  };

  const selectQuiz = (field: string, value: string) => {
    updateField(field as any, value);
    setTimeout(() => goNext(), 220);
  };

  const finishOnboarding = async (asPremium: boolean) => {
    if (isPreview) {
      Alert.alert('Preview complete', 'Onboarding preview finished — nothing was saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      reset();
      return;
    }
    if (finishingRef.current) return;
    finishingRef.current = true;
    setSaving(true);
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        finishingRef.current = false;
        Alert.alert('Error', 'Session expired. Please sign in again.');
        setSaving(false);
        return;
      }

      // Always read latest store values (avoid stale closure from paywall → miss screens)
      const latest = useOnboardingStore.getState().data;
      const payload = {
        ...latest,
        isPremium: asPremium || latest.isPremium,
        choseFreePlan: asPremium ? false : true,
      };

      const success = await onboardingService.saveOnboardingData(user.id, payload);
      if (!success) {
        finishingRef.current = false;
        Alert.alert('Error', 'Failed to save onboarding data. Please try again.');
        setSaving(false);
        return;
      }

      if (payload.displayName?.trim()) {
        useAuthStore.setState({
          user: { ...user, display_name: payload.displayName.trim() },
        });
      }

      await supabase.from('users').upsert({ id: user.id, email: user.email });

      for (const goal of payload.goals || []) {
        await onboardingService.createInitialGoal(user.id, goal);
      }

      if (payload.selectedHabits?.length) {
        try {
          await dailyHabitsService.updateSelectedHabits(user.id, payload.selectedHabits);
          for (const [habitId, schedule] of Object.entries(payload.habitFrequencies || {})) {
            await dailyHabitsService.updateHabitSchedule(user.id, habitId, schedule as boolean[]);
          }
        } catch (e) {
          console.error('Habit save error:', e);
        }
      }

      try {
        const { pillarProgressService } = await import('../lib/pillarProgressService');
        await pillarProgressService.initializeUserPillars(user.id);
      } catch (e) {
        console.warn('Pillar init after onboarding failed (non-blocking):', e);
      }

      const [profileResult, userResult] = await Promise.all([
        supabase.from('profiles').select('username, display_name').eq('id', user.id).single(),
        supabase.from('users').select('username').eq('id', user.id).single(),
      ]);
      const username = profileResult.data?.username || userResult.data?.username;
      const hasRealUsername =
        username && username !== user.id && username !== user.email?.split('@')[0];

      // Keep the loading screen up and DO NOT reset() before leaving this screen —
      // reset() was sending users back to "Let's Go!" via the welcome→memberCard effect.
      if (!hasRealUsername) {
        navigation.replace('ProfileSetup');
        // Leave saving=true briefly; ProfileSetup unmounts this screen
        return;
      }

      reset();
      setSaving(false);
      useAuthStore.getState().notifyOnboardingFinished();
    } catch (e) {
      console.error(e);
      finishingRef.current = false;
      Alert.alert('Error', 'Failed to complete onboarding');
      setSaving(false);
    }
  };

  const handleExit = async () => {
    if (isPreview) {
      reset();
      navigation.goBack();
      return;
    }
    const { user } = useAuthStore.getState();
    if (!user) return;
    await onboardingService.savePartialOnboardingData(user.id, data, currentStep);
    navigation.goBack();
  };

  const quizProgress = (QUIZ_PHASES.indexOf(phase as any) + 1) / QUIZ_PHASES.length;

  if (saving) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  switch (phase as OnboardingPhaseId) {
    case 'welcome':
      if (!isPreview) {
        return (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        );
      }
      return <WelcomeStep onStart={advance} ctaLabel="Start quiz" />;

    case 'memberCard':
      return (
        <MemberCardStep
          onNext={advance}
          onBack={isPreview ? goPrevious : undefined}
        />
      );

    case 'quizLife':
    case 'quizReason':
    case 'quizProud':
    case 'quizMorning':
    case 'quizState': {
      const field = getQuizField(phase)!;
      return (
        <QuizQuestionStep
          phase={phase as any}
          value={(data as any)[field] || ''}
          progress={quizProgress}
          onBack={goPrevious}
          onSkip={handleExit}
          onSelect={(v) => selectQuiz(field, v)}
        />
      );
    }

    case 'dob':
      return (
        <DobFinallyStep
          name={data.displayName || ''}
          ageGroup={data.ageGroup || ''}
          onChangeName={(v) => updateField('displayName', v)}
          onChangeAgeGroup={(v) => updateField('ageGroup', v)}
          onBack={goPrevious}
          onNext={() => {
            const ratings = computeRatings(data);
            updateData(ratings);
            advance();
          }}
        />
      );

    case 'calculating':
      return <CalculatingStep onBack={goPrevious} onDone={advance} />;

    case 'analysis':
      return (
        <AnalysisStep
          initial={data.initialRatings || { physical: 35, mental: 35, social: 35, emotional: 35 }}
          potential={data.potentialRatings || { physical: 93, mental: 93, social: 93, emotional: 93 }}
          onBack={goPrevious}
          onNext={advance}
          onReady={() => {}}
        />
      );

    case 'barriers':
      return (
        <BarriersStep
          value={data.habitBarriers || []}
          onChange={(v) => updateField('habitBarriers', v)}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'education':
      return <EducationCarouselStep onBack={goPrevious} onDone={advance} />;

    case 'scienceDays':
      return <ScienceDaysStep onBack={goPrevious} onNext={advance} />;

    case 'sciencePlan':
      return <SciencePlanStep onBack={goPrevious} onNext={advance} />;

    case 'product':
      return <ProductCarouselStep onBack={goPrevious} onDone={advance} />;

    case 'testimonials':
      return <TestimonialsStep onBack={goPrevious} onNext={advance} />;

    case 'pathChart':
      return <PathChartStep onBack={goPrevious} onNext={advance} />;

    case 'chooseGoals':
      return (
        <ChooseGoalsStep
          value={data.goals}
          onChange={(v) => updateField('goals', v)}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'habitSelection':
      return (
        <HabitSelectionFlowStep
          selectedHabits={data.selectedHabits}
          onChange={(updates) => updateData(updates)}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'referral':
      return (
        <ReferralFlowStep
          value={data.referralCode || ''}
          onChange={(v) => updateField('referralCode', v)}
          onBack={goPrevious}
          onNext={advance}
          onSkip={advance}
          preview={isPreview}
        />
      );

    case 'rating':
      return (
        <RatingPromptStep
          onBack={goPrevious}
          onNext={advance}
          onRate={() => {
            Alert.alert(
              'Thank you!',
              'Your support means a lot. You can leave a rating anytime from the App Store.',
              [{ text: 'Continue', onPress: advance }]
            );
          }}
        />
      );

    case 'notifications':
      return (
        <NotificationsFlowStep
          onBack={goPrevious}
          onSkip={advance}
          onEnable={async () => {
            try {
              await Notifications.requestPermissionsAsync();
            } catch {
              /* ignore */
            }
            advance();
          }}
        />
      );

    case 'greeting':
      return (
        <GreetingStep
          name={data.displayName || displayName}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'programStart':
      return (
        <ProgramStartStep
          name={data.displayName || displayName}
          selectedHabits={data.selectedHabits}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'planReveal':
      return (
        <PlanRevealStep
          habitCount={data.selectedHabits.length}
          goalCount={data.goals.length}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'journey':
      return <JourneyStep onBack={goPrevious} onNext={advance} />;

    case 'affirmation':
      return (
        <AffirmationFlowStep
          value={data.affirmationSigned}
          onChange={(v) => updateField('affirmationSigned', v)}
          onBack={goPrevious}
          onNext={advance}
        />
      );

    case 'paywall':
      return (
        <PaywallStep
          onBack={goPrevious}
          onPurchased={() => {
            updateField('isPremium', true);
            finishOnboarding(true);
          }}
          onContinueFree={() => {
            updateField('choseFreePlan', true);
            goToPhase('missedBenefits');
          }}
        />
      );

    case 'missedBenefits':
      return (
        <MissedBenefitsStep
          onBack={() => goToPhase('paywall')}
          onUnlock={() => goToPhase('paywall')}
          onContinueFree={() => finishOnboarding(false)}
        />
      );

    default:
      return <WelcomeStep onStart={advance} />;
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFAF9',
  },
});
