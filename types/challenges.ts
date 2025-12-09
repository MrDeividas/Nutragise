// TypeScript types for the challenges feature

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_weeks: number;
  entry_fee: number;
  verification_type: 'photo' | 'manual' | 'automatic';
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  max_participants?: number;
  image_url?: string;
  is_recurring?: boolean;
  recurring_schedule?: 'weekly' | 'monthly' | 'daily';
  next_recurrence?: string;
  // Computed fields
  participant_count?: number;
  is_joined?: boolean;
  progress_percentage?: number;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  status: 'active' | 'completed' | 'failed' | 'left';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  completion_percentage: number;
  // Joined user data
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  photo_url: string;
  submitted_at: string;
  week_number: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  submission_notes?: string;
}

export interface ChallengeRequirement {
  id: string;
  challenge_id: string;
  requirement_text: string;
  frequency: 'daily' | 'weekly';
  target_count: number;
  requirement_order: number;
  max_submissions_per_period?: number; // Max photos per day/week
}

export interface ChallengeWithDetails extends Challenge {
  requirements: ChallengeRequirement[];
  participants: ChallengeParticipant[];
  user_submissions: ChallengeSubmission[];
  creator?: {
    id: string;
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
}

export interface ChallengeProgress {
  challenge_id: string;
  user_id: string;
  total_weeks: number;
  completed_weeks: number;
  completion_percentage: number;
  submissions_by_week: { [week: number]: ChallengeSubmission[] };
  is_on_track: boolean;
  days_remaining: number;
}

export interface CreateChallengeData {
  title: string;
  description: string;
  category: string;
  duration_weeks: number;
  entry_fee?: number;
  verification_type?: 'photo' | 'manual' | 'automatic';
  start_date: string;
  end_date: string;
  max_participants?: number;
  image_url?: string;
  requirements: {
    requirement_text: string;
    frequency: 'daily' | 'weekly';
    target_count: number;
  }[];
}

export interface JoinChallengeData {
  challenge_id: string;
  user_id: string;
}

export interface SubmitChallengeProofData {
  challenge_id: string;
  user_id: string;
  photo_url: string;
  week_number: number;
  submission_notes?: string;
}

// UI-specific types
export interface ChallengeCardProps {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
  isJoined?: boolean;
}

export interface ChallengeDetailScreenProps {
  navigation: any;
  route: {
    params: {
      challengeId: string;
    };
  };
}

export interface ChallengeSubmissionModalProps {
  visible: boolean;
  challenge: Challenge;
  weekNumber: number;
  onClose: () => void;
  onSubmit: (photoUrl: string, notes?: string) => void;
  existingSubmission?: ChallengeSubmission;
}

// Challenge categories for UI
export const CHALLENGE_CATEGORIES = {
  FITNESS: 'Fitness',
  WELLNESS: 'Wellness',
  NUTRITION: 'Nutrition',
  MINDFULNESS: 'Mindfulness',
  LEARNING: 'Learning',
  CREATIVITY: 'Creativity',
  PRODUCTIVITY: 'Productivity',
} as const;

export type ChallengeCategory = typeof CHALLENGE_CATEGORIES[keyof typeof CHALLENGE_CATEGORIES];

// Challenge status helpers
export const isChallengeActive = (challenge: Challenge): boolean => {
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  return challenge.status === 'active' && now >= startDate && now <= endDate;
};

export const isChallengeUpcoming = (challenge: Challenge): boolean => {
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  return challenge.status === 'upcoming' && now < startDate;
};

export const isChallengeCompleted = (challenge: Challenge): boolean => {
  const now = new Date();
  const endDate = new Date(challenge.end_date);
  return challenge.status === 'completed' || now > endDate;
};

export const getChallengeDaysRemaining = (challenge: Challenge): number => {
  const now = new Date();
  const endDate = new Date(challenge.end_date);
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getChallengeWeekNumber = (challenge: Challenge): number => {
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.floor(diffDays / 7) + 1, challenge.duration_weeks);
};

// Recurring challenge helpers
export const isRecurringChallenge = (challenge: Challenge): boolean => {
  return challenge.is_recurring === true;
};

export const getCurrentWeekForRecurringChallenge = (challenge: Challenge): number => {
  if (!isRecurringChallenge(challenge)) {
    return getChallengeWeekNumber(challenge);
  }

  const now = new Date();
  const startDate = new Date(challenge.start_date);
  
  // Calculate how many weeks have passed since the original start date
  const diffTime = now.getTime() - startDate.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  // For weekly recurring challenges, each week is a new "week 1"
  return 1;
};

export const getCurrentRecurringPeriod = (challenge: Challenge): { start: Date; end: Date } => {
  if (!isRecurringChallenge(challenge)) {
    return {
      start: new Date(challenge.start_date),
      end: new Date(challenge.end_date)
    };
  }

  const now = new Date();
  const originalStart = new Date(challenge.start_date);
  
  // Calculate which week we're in (0-based)
  const diffTime = now.getTime() - originalStart.getTime();
  const weeksSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  // Calculate the start of the current week (Monday 00:01)
  const currentWeekStart = new Date(originalStart);
  currentWeekStart.setDate(originalStart.getDate() + (weeksSinceStart * 7));
  currentWeekStart.setUTCHours(0, 1, 0, 0);
  
  // Calculate the end of the current week (Sunday 23:59)
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setUTCHours(23, 59, 59, 999);
  
  return {
    start: currentWeekStart,
    end: currentWeekEnd
  };
};
