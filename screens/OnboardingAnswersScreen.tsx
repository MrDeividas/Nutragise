import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { supabase } from '../lib/supabase';

// Option mappings for display
const LIFE_DESCRIPTION_OPTIONS: Record<string, { emoji: string; text: string }> = {
  chaotic: { emoji: '🌪️', text: "Chaotic and overwhelming — I feel like I'm just trying to keep up" },
  stuck: { emoji: '😐', text: "Stuck or unmotivated — I know I can do more but I'm not sure where to start" },
  balanced: { emoji: '⚖️', text: "Balanced but inconsistent — Some days I'm on track, others I lose focus" },
  purposeful: { emoji: '🌿', text: "Purposeful and improving — I'm actively working on myself and my habits" },
  thriving: { emoji: '🔥', text: "Fulfilled and thriving — I'm living with energy, focus, and direction" },
};

const CHANGE_REASON_OPTIONS: Record<string, { emoji: string; text: string }> = {
  confident: { emoji: '💪', text: 'To feel stronger, healthier, and more confident in myself' },
  discipline: { emoji: '🧠', text: 'To overcome procrastination and build discipline' },
  happiness: { emoji: '❤️', text: 'To feel happier and more at peace' },
  purpose: { emoji: '🎯', text: 'To find clarity, purpose, and direction' },
  growth: { emoji: '🌿', text: 'To grow into the best version of myself' },
  inspire: { emoji: '🤝', text: 'To set an example and inspire others around me' },
};

const PROUD_MOMENT_OPTIONS: Record<string, { emoji: string; text: string }> = {
  consistent: { emoji: '🎯', text: 'When I stayed consistent with a goal or habit' },
  persevered: { emoji: '💪', text: 'When I pushed through something difficult' },
  helped: { emoji: '❤️', text: 'When I helped or supported someone else' },
  learned: { emoji: '🧠', text: 'When I learned or accomplished something new' },
  seeking: { emoji: '🌿', text: "It's been a while — I want to feel that again" },
  regular: { emoji: '🔥', text: 'I feel proud of myself regularly and want to keep that energy going' },
};

const MORNING_MOTIVATION_OPTIONS: Record<string, { emoji: string; text: string }> = {
  goals: { emoji: '🎯', text: 'My goals and dreams — I want to build a better future' },
  improvement: { emoji: '💪', text: 'The drive to improve and become stronger each day' },
  relationships: { emoji: '❤️', text: 'My family, friends, or people I care about' },
  growth: { emoji: '🧠', text: 'The chance to learn, grow, and experience something new' },
  responsibility: { emoji: '💼', text: 'My responsibilities — I get up because I have to' },
  searching: { emoji: '🌅', text: "Honestly, I'm still trying to find that reason" },
};

const CURRENT_STATE_OPTIONS: Record<string, { emoji: string; text: string }> = {
  determined: { emoji: '🔥', text: 'Determined — focused and ready to make progress' },
  evolving: { emoji: '🌱', text: 'Evolving — growing and learning each day' },
  curious: { emoji: '🧠', text: 'Curious — open to new ideas and self-improvement' },
  disciplined: { emoji: '💪', text: 'Disciplined — staying consistent and accountable' },
  distracted: { emoji: '😓', text: 'Distracted — struggling to stay focused or on track' },
  doubting: { emoji: '😔', text: 'Lacking confidence — doubting myself but wanting change' },
  underachieving: { emoji: '😩', text: 'Underachieving — not reaching my potential (yet)' },
  hopeful: { emoji: '🌅', text: 'Hopeful — believing things can get better' },
};

export default function OnboardingAnswersScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    if (!user) return;

    try {
      // Load onboarding data from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('life_description, change_reason, proud_moment, morning_motivation, current_state')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }

      console.log('📊 Loaded onboarding data:', profile);
      setOnboardingData(profile);

      // Load goals from goals table
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('title, description, category, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(10); // Get first 10 goals

      if (!goalsError && goalsData) {
        console.log('📊 Loaded goals:', goalsData);
        setGoals(goalsData);
      } else if (goalsError) {
        console.error('Error loading goals:', goalsError);
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOptionDisplay = (value: string | null | undefined, options: Record<string, { emoji: string; text: string }>) => {
    if (!value || value.trim() === '') return null;
    const option = options[value];
    if (option) {
      return `${option.emoji} ${option.text}`;
    }
    // If no mapping found, return the raw value (for debugging)
    console.warn(`No option mapping found for value: "${value}"`);
    return value;
  };

  const renderAnswerCard = (title: string, content: string | null, stepNumber: number) => {
    if (!content) return null;

    return (
      <View key={stepNumber} style={[styles.answerCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.stepNumber, { color: theme.primary }]}>Step {stepNumber}</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{title}</Text>
        </View>
        <Text style={[styles.answerText, { color: theme.textSecondary }]}>{content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Onboarding Answers</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Onboarding Answers</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 24 + bottomNavPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 6: Life Description */}
          {renderAnswerCard(
            "How would you describe your current life?",
            getOptionDisplay(onboardingData?.life_description, LIFE_DESCRIPTION_OPTIONS),
            6
          )}

          {/* Step 7: Change Reason */}
          {renderAnswerCard(
            "What's the biggest reason why you want to start making a change and improving your life?",
            getOptionDisplay(onboardingData?.change_reason, CHANGE_REASON_OPTIONS),
            7
          )}

          {/* Step 8: Proud Moment */}
          {renderAnswerCard(
            "What's the last time you felt proud of yourself?",
            getOptionDisplay(onboardingData?.proud_moment, PROUD_MOMENT_OPTIONS),
            8
          )}

          {/* Step 9: Morning Motivation */}
          {renderAnswerCard(
            "What gets you out of bed every morning?",
            getOptionDisplay(onboardingData?.morning_motivation, MORNING_MOTIVATION_OPTIONS),
            9
          )}

          {/* Step 10: Current State */}
          {renderAnswerCard(
            "Which of these words best describes you right now?",
            getOptionDisplay(onboardingData?.current_state, CURRENT_STATE_OPTIONS),
            10
          )}

          {/* Step 11: Goals */}
          {goals.length > 0 && (
            <View style={[styles.answerCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.stepNumber, { color: theme.primary }]}>Step 11</Text>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Set Your First Goal 🎯</Text>
              </View>
              {goals.map((goal, index) => (
                <View key={index} style={[styles.goalItem, { borderColor: theme.borderSecondary }]}>
                  <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
                  {goal.description && (
                    <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>{goal.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Step 13: Affirmation Signature */}
          {/* Check if user completed onboarding to show commitment */}
          {onboardingData && (
            <View style={[styles.answerCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.stepNumber, { color: theme.primary }]}>Step 13</Text>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Your Commitment</Text>
              </View>
              <View style={[styles.signatureIndicator, { backgroundColor: 'rgba(46, 213, 115, 0.1)', borderColor: '#2ED573' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#2ED573" />
                <Text style={[styles.signatureText, { color: '#2ED573' }]}>You committed to your journey</Text>
              </View>
            </View>
          )}

          {/* Debug: Show raw data if available */}
          {__DEV__ && onboardingData && (
            <View style={[styles.answerCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: 12 }]}>Debug Info</Text>
              <Text style={[styles.answerText, { color: theme.textSecondary, fontSize: 12 }]}>
                {JSON.stringify(onboardingData, null, 2)}
              </Text>
            </View>
          )}

          {!onboardingData && goals.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No onboarding answers found. Complete onboarding to see your answers here.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  answerCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  cardHeader: {
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
  goalItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  signatureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  signatureText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
