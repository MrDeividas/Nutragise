import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import PillOptionList, { PillOption } from '../ui/PillOptionList';
import AffirmationStep from '../AffirmationStep';
import HabitPickStep from './HabitPickStep';

const QUIZ: Record<
  string,
  { number: number; question: string; field: string; options: PillOption[] }
> = {
  quizLife: {
    number: 1,
    question: 'How would you describe your current life?',
    field: 'lifeDescription',
    options: [
      { value: 'chaotic', emoji: '🌪️', label: "Chaotic and overwhelming — I'm just trying to keep up" },
      { value: 'stuck', emoji: '😐', label: "Stuck or unmotivated — I know I can do more" },
      { value: 'balanced', emoji: '⚖️', label: "Balanced but inconsistent — some days I'm on track" },
      { value: 'purposeful', emoji: '🌿', label: "Purposeful and improving — actively working on myself" },
      { value: 'thriving', emoji: '🔥', label: "Fulfilled and thriving — energy, focus, direction" },
    ],
  },
  quizReason: {
    number: 2,
    question: "What's the biggest reason you want to change?",
    field: 'changeReason',
    options: [
      { value: 'confident', emoji: '💪', label: 'Feel stronger, healthier, and more confident' },
      { value: 'discipline', emoji: '🧠', label: 'Overcome procrastination and build discipline' },
      { value: 'happiness', emoji: '❤️', label: 'Feel happier and more at peace' },
      { value: 'purpose', emoji: '🎯', label: 'Find clarity, purpose, and direction' },
      { value: 'growth', emoji: '🌿', label: 'Grow into the best version of myself' },
      { value: 'inspire', emoji: '🤝', label: 'Set an example and inspire others' },
    ],
  },
  quizProud: {
    number: 3,
    question: "What's the last time you felt proud of yourself?",
    field: 'proudMoment',
    options: [
      { value: 'consistent', emoji: '🎯', label: 'When I stayed consistent with a goal or habit' },
      { value: 'persevered', emoji: '💪', label: 'When I pushed through something difficult' },
      { value: 'helped', emoji: '❤️', label: 'When I helped or supported someone else' },
      { value: 'learned', emoji: '🧠', label: 'When I learned or accomplished something new' },
      { value: 'seeking', emoji: '🌿', label: "It's been a while — I want to feel that again" },
      { value: 'regular', emoji: '🔥', label: 'I feel proud regularly and want to keep going' },
    ],
  },
  quizMorning: {
    number: 4,
    question: 'What gets you out of bed every morning?',
    field: 'morningMotivation',
    options: [
      { value: 'goals', emoji: '🎯', label: 'My goals and dreams — building a better future' },
      { value: 'improvement', emoji: '💪', label: 'The drive to improve and become stronger' },
      { value: 'relationships', emoji: '❤️', label: 'My family, friends, or people I care about' },
      { value: 'growth', emoji: '🧠', label: 'The chance to learn, grow, and experience new things' },
      { value: 'responsibility', emoji: '💼', label: 'My responsibilities — I get up because I have to' },
      { value: 'searching', emoji: '🌅', label: "Honestly, I'm still trying to find that reason" },
    ],
  },
  quizState: {
    number: 5,
    question: 'Which word best describes you right now?',
    field: 'currentState',
    options: [
      { value: 'determined', emoji: '🔥', label: 'Determined — focused and ready to make progress' },
      { value: 'evolving', emoji: '🌱', label: 'Evolving — growing and learning each day' },
      { value: 'curious', emoji: '🧠', label: 'Curious — open to new ideas and self-improvement' },
      { value: 'disciplined', emoji: '💪', label: 'Disciplined — staying consistent and accountable' },
      { value: 'distracted', emoji: '😓', label: 'Distracted — struggling to stay focused' },
      { value: 'doubting', emoji: '😔', label: 'Lacking confidence — wanting change' },
      { value: 'underachieving', emoji: '😩', label: 'Underachieving — not reaching my potential yet' },
      { value: 'hopeful', emoji: '🌅', label: 'Hopeful — believing things can get better' },
    ],
  },
};

interface QuizProps {
  phase: keyof typeof QUIZ;
  value: string;
  progress: number;
  onSelect: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function QuizQuestionStep({ phase, value, progress, onSelect, onBack, onSkip }: QuizProps) {
  const cfg = QUIZ[phase];
  return (
    <OnboardingShell onBack={onBack} onSkip={onSkip} skipLabel="Skip" progress={progress}>
      <PillOptionList
        questionNumber={cfg.number}
        question={cfg.question}
        options={cfg.options}
        value={value}
        onSelect={onSelect}
      />
    </OnboardingShell>
  );
}

export function getQuizField(phase: string): string | null {
  return QUIZ[phase as keyof typeof QUIZ]?.field ?? null;
}

interface HabitProps {
  selectedHabits: string[];
  onChange: (data: {
    selectedHabits: string[];
    habitFrequencies: Record<string, boolean[]>;
    isPremium: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function HabitSelectionFlowStep({
  selectedHabits,
  onChange,
  onNext,
  onBack,
}: HabitProps) {
  return (
    <HabitPickStep
      selectedHabits={selectedHabits}
      onChange={onChange}
      onNext={onNext}
      onBack={onBack}
    />
  );
}

interface AffirmProps {
  value: boolean;
  onChange: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AffirmationFlowStep({ value, onChange, onNext, onBack }: AffirmProps) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <PrimaryButton label="I commit" onPress={onNext} disabled={!value} />
      }
    >
      <View style={styles.affirmWrap}>
        <AffirmationStep value={value} onChange={onChange} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  affirmWrap: {
    flex: 1,
  },
});
