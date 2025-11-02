import { create } from 'zustand';

export interface OnboardingData {
  // Auth
  authMethod?: 'google' | 'apple' | 'email';
  
  // Step 1: Referral
  referralCode?: string;
  
  // Step 2: DOB
  dateOfBirth?: string;
  
  // Step 3: Life Description
  lifeDescription?: string;
  
  // Step 4: Change Reason
  changeReason?: string;
  
  // Step 5: Proud Moment
  proudMoment?: string;
  
  // Step 6: Morning Motivation
  morningMotivation?: string;
  
  // Step 7: Current State
  currentState?: string;
  
  // Step 8: Habit Selection
  selectedHabits: string[];
  habitFrequencies: Record<string, boolean[]>; // habitId -> [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  isPremium: boolean;
  
  // Step 10: Goals
  goals: any[];
  
  // Step 11: Ratings
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
  
  // Step 13: Affirmation
  affirmationSigned: boolean;
  selectedAffirmation?: string;
}

interface OnboardingStore {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  
  // Actions
  setStep: (step: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  updateField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  updateData: (updates: Partial<OnboardingData>) => void;
  loadSavedData: (data: Partial<OnboardingData>, step: number) => void;
  reset: () => void;
}

const initialData: OnboardingData = {
  selectedHabits: [],
  habitFrequencies: {},
  isPremium: false,
  goals: [],
  affirmationSigned: false,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  currentStep: 1,
  totalSteps: 13,
  data: initialData,
  
  setStep: (step) => set({ currentStep: step }),
  
  goNext: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps)
  })),
  
  goPrevious: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1)
  })),
  
  updateField: (field, value) => set((state) => ({
    data: { ...state.data, [field]: value }
  })),
  
  updateData: (updates) => set((state) => ({
    data: { ...state.data, ...updates }
  })),
  
  loadSavedData: (savedData, step) => set({
    currentStep: step,
    data: { ...initialData, ...savedData }
  }),
  
  reset: () => set({
    currentStep: 1,
    data: initialData
  }),
}));

