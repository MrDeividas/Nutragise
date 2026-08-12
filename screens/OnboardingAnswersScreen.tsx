import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { supabase } from '../lib/supabase';

const DARK = '#1f2937';
const CARD_BORDER = '#EEF0F3';

const LIFE_DESCRIPTION_OPTIONS: Record<string, { label: string; text: string }> = {
  chaotic: { label: 'Chaotic', text: "I feel like I'm just trying to keep up" },
  stuck: { label: 'Stuck', text: "I know I can do more but I'm not sure where to start" },
  balanced: { label: 'Balanced', text: "Some days I'm on track, others I lose focus" },
  purposeful: { label: 'Purposeful', text: "I'm actively working on myself and my habits" },
  thriving: { label: 'Thriving', text: "I'm living with energy, focus, and direction" },
};

const CHANGE_REASON_OPTIONS: Record<string, { label: string; text: string }> = {
  confident: { label: 'Confidence', text: 'To feel stronger, healthier, and more confident' },
  discipline: { label: 'Discipline', text: 'To overcome procrastination and build discipline' },
  happiness: { label: 'Happiness', text: 'To feel happier and more at peace' },
  purpose: { label: 'Purpose', text: 'To find clarity, purpose, and direction' },
  growth: { label: 'Growth', text: 'To grow into the best version of myself' },
  inspire: { label: 'Impact', text: 'To set an example and inspire others' },
};

const PROUD_MOMENT_OPTIONS: Record<string, { label: string; text: string }> = {
  consistent: { label: 'Consistency', text: 'When I stayed consistent with a goal or habit' },
  persevered: { label: 'Perseverance', text: 'When I pushed through something difficult' },
  helped: { label: 'Support', text: 'When I helped or supported someone else' },
  learned: { label: 'Learning', text: 'When I learned or accomplished something new' },
  seeking: { label: 'Seeking', text: "It's been a while — I want to feel that again" },
  regular: { label: 'Momentum', text: 'I feel proud regularly and want to keep that energy' },
};

const MORNING_MOTIVATION_OPTIONS: Record<string, { label: string; text: string }> = {
  goals: { label: 'Goals', text: 'My goals and dreams — building a better future' },
  improvement: { label: 'Drive', text: 'The drive to improve and become stronger each day' },
  relationships: { label: 'People', text: 'Family, friends, or people I care about' },
  growth: { label: 'Growth', text: 'The chance to learn, grow, and experience something new' },
  responsibility: { label: 'Duty', text: 'My responsibilities — I get up because I have to' },
  searching: { label: 'Searching', text: "Honestly, I'm still trying to find that reason" },
};

const CURRENT_STATE_OPTIONS: Record<string, { label: string; text: string }> = {
  determined: { label: 'Determined', text: 'Focused and ready to make progress' },
  evolving: { label: 'Evolving', text: 'Growing and learning each day' },
  curious: { label: 'Curious', text: 'Open to new ideas and self-improvement' },
  disciplined: { label: 'Disciplined', text: 'Staying consistent and accountable' },
  distracted: { label: 'Distracted', text: 'Struggling to stay focused or on track' },
  doubting: { label: 'Doubting', text: 'Doubting myself but wanting change' },
  underachieving: { label: 'Underachieving', text: 'Not reaching my potential yet' },
  hopeful: { label: 'Hopeful', text: 'Believing things can get better' },
};

type AnswerItem = {
  id: string;
  step: number;
  question: string;
  label: string | null;
  text: string | null;
};

function mapOption(
  value: string | null | undefined,
  options: Record<string, { label: string; text: string }>
): { label: string; text: string } | null {
  if (!value?.trim()) return null;
  return options[value] ?? { label: 'Answer', text: value };
}

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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('life_description, change_reason, proud_moment, morning_motivation, current_state')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setOnboardingData(profile);

      const { data: goalsData } = await supabase
        .from('goals')
        .select('title, description, category, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(10);
      if (goalsData) setGoals(goalsData);
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const answers: AnswerItem[] = useMemo(() => {
    const life = mapOption(onboardingData?.life_description, LIFE_DESCRIPTION_OPTIONS);
    const reason = mapOption(onboardingData?.change_reason, CHANGE_REASON_OPTIONS);
    const proud = mapOption(onboardingData?.proud_moment, PROUD_MOMENT_OPTIONS);
    const morning = mapOption(onboardingData?.morning_motivation, MORNING_MOTIVATION_OPTIONS);
    const state = mapOption(onboardingData?.current_state, CURRENT_STATE_OPTIONS);

    return [
      {
        id: 'life',
        step: 1,
        question: 'How would you describe your current life?',
        label: life?.label ?? null,
        text: life?.text ?? null,
      },
      {
        id: 'reason',
        step: 2,
        question: 'Why do you want to change?',
        label: reason?.label ?? null,
        text: reason?.text ?? null,
      },
      {
        id: 'proud',
        step: 3,
        question: 'When did you last feel proud?',
        label: proud?.label ?? null,
        text: proud?.text ?? null,
      },
      {
        id: 'morning',
        step: 4,
        question: 'What gets you out of bed?',
        label: morning?.label ?? null,
        text: morning?.text ?? null,
      },
      {
        id: 'state',
        step: 5,
        question: 'Which word describes you now?',
        label: state?.label ?? null,
        text: state?.text ?? null,
      },
    ].filter((a) => a.text);
  }, [onboardingData]);

  const answeredCount = answers.length + (goals.length > 0 ? 1 : 0) + (onboardingData ? 1 : 0);

  if (loading) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Your answers</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DARK} />
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Your answers</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 28 + bottomNavPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Onboarding</Text>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              The commitments that started your journey
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              {answeredCount > 0
                ? `${answeredCount} saved ${answeredCount === 1 ? 'reflection' : 'reflections'}`
                : 'No answers saved yet'}
            </Text>
          </View>

          {answers.map((answer, index) => (
            <View key={answer.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                {index < answers.length - 1 || goals.length > 0 || onboardingData ? (
                  <View style={styles.timelineLine} />
                ) : null}
              </View>
              <View style={styles.answerCard}>
                <Text style={[styles.question, { color: theme.textSecondary }]}>{answer.question}</Text>
                {answer.label ? <Text style={styles.answerLabel}>{answer.label}</Text> : null}
                <Text style={[styles.answerText, { color: theme.textPrimary }]}>{answer.text}</Text>
              </View>
            </View>
          ))}

          {goals.length > 0 && (
            <View style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={styles.stepBadge}>
                  <Ionicons name="flag" size={14} color="#FFFFFF" />
                </View>
                {onboardingData ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.answerCard}>
                <Text style={[styles.question, { color: theme.textSecondary }]}>First goals</Text>
                {goals.map((goal, index) => (
                  <View
                    key={`${goal.title}-${index}`}
                    style={[
                      styles.goalRow,
                      index < goals.length - 1 && styles.goalRowDivider,
                    ]}
                  >
                    <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
                    {goal.description ? (
                      <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                        {goal.description}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {onboardingData && (
            <View style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.stepBadge, styles.stepBadgeDone]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.answerCard}>
                <Text style={[styles.question, { color: theme.textSecondary }]}>Commitment</Text>
                <Text style={styles.answerLabel}>Locked in</Text>
                <Text style={[styles.answerText, { color: theme.textPrimary }]}>
                  You committed to showing up for your habits and finishing what you start.
                </Text>
              </View>
            </View>
          )}

          {!onboardingData && goals.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={28} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No answers yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Complete onboarding to see your reflections here.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: { padding: 8, width: 40 },
  headerSpacer: { width: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 20,
    marginBottom: 18,
  },
  heroEyebrow: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  timelineRow: { flexDirection: 'row', gap: 14, minHeight: 88 },
  timelineRail: { width: 28, alignItems: 'center' },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeDone: { backgroundColor: '#059669' },
  stepBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
    borderRadius: 1,
  },
  answerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  question: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  goalRow: { paddingVertical: 10 },
  goalRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  goalTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  goalDescription: { fontSize: 13, lineHeight: 18 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
