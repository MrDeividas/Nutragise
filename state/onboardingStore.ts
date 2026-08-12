import { create } from 'zustand';

export interface OnboardingData {
  authMethod?: 'google' | 'apple' | 'email';
  /** Friend's code entered during onboarding (not this user's own shareable code). */
  referralCode?: string;
  dateOfBirth?: string;
  displayName?: string;
  ageGroup?: string;
  lifeDescription?: string;
  changeReason?: string;
  proudMoment?: string;
  morningMotivation?: string;
  currentState?: string;
  selectedHabits: string[];
  habitFrequencies: Record<string, boolean[]>;
  isPremium: boolean;
  goals: any[];
  habitBarriers: string[];
  initialRatings?: {
    physical: number;
    mental: number;
    social: number;
    emotional: number;
  };
  potentialRatings?: {
    physical: number;
    mental: number;
    social: number;
    emotional: number;
  };
  affirmationSigned: boolean;
  selectedAffirmation?: string;
  choseFreePlan?: boolean;
}

export const ONBOARDING_PHASES = [
  'welcome',
  'memberCard',
  'quizLife',
  'quizReason',
  'quizProud',
  'quizMorning',
  'quizState',
  'dob',
  'calculating',
  'analysis',
  'barriers',
  'education',
  'scienceDays',
  'sciencePlan',
  'product',
  'testimonials',
  'pathChart',
  'chooseGoals',
  'habitSelection',
  'referral',
  'rating',
  'notifications',
  'greeting',
  'programStart',
  'planReveal',
  'journey',
  'affirmation',
  'paywall',
  'missedBenefits',
] as const;

export type OnboardingPhaseId = (typeof ONBOARDING_PHASES)[number];

interface OnboardingStore {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  setStep: (step: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  goToPhase: (phase: OnboardingPhaseId) => void;
  updateField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  updateData: (updates: Partial<OnboardingData>) => void;
  loadSavedData: (data: Partial<OnboardingData>, step: number) => void;
  reset: () => void;
  getPhaseId: () => OnboardingPhaseId;
}

const initialData: OnboardingData = {
  selectedHabits: [],
  habitFrequencies: {},
  isPremium: false,
  goals: [],
  habitBarriers: [],
  affirmationSigned: false,
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 1,
  totalSteps: ONBOARDING_PHASES.length,
  data: initialData,

  setStep: (step) =>
    set({
      currentStep: Math.max(1, Math.min(step, ONBOARDING_PHASES.length)),
    }),

  goNext: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    })),

  goPrevious: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  goToPhase: (phase) => {
    const idx = ONBOARDING_PHASES.indexOf(phase);
    if (idx >= 0) set({ currentStep: idx + 1 });
  },

  updateField: (field, value) =>
    set((state) => ({
      data: { ...state.data, [field]: value },
    })),

  updateData: (updates) =>
    set((state) => ({
      data: { ...state.data, ...updates },
    })),

  loadSavedData: (savedData, step) =>
    set({
      currentStep: Math.max(1, Math.min(step, ONBOARDING_PHASES.length)),
      data: { ...initialData, ...savedData },
    }),

  reset: () =>
    set({
      currentStep: 1,
      data: initialData,
    }),

  getPhaseId: () => {
    const { currentStep } = get();
    return ONBOARDING_PHASES[currentStep - 1] ?? 'welcome';
  },
}));
