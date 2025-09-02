import { HabitStreak } from './database';

export interface InsightCard {
  type: 'streak' | 'pattern' | 'correlation' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  icon: string;
  data?: any;
  priority: number;
  expandable?: boolean;
  expanded?: boolean;
  showConsistencyInfo?: boolean;
}

export interface PatternAnalysis {
  habitType: string;
  peakDay: string;
  consistencyScore: number;
  trend: 'improving' | 'declining' | 'stable';
  dayBreakdown: {
    [key: string]: {
      completionRate: number;
      totalDays: number;
      completedDays: number;
    };
  };
}

export interface CorrelationData {
  habit1: string;
  habit2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  significance: number;
}

export interface WeeklyInsights {
  currentWeek: {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
    streaks: HabitStreak[];
  };
  previousWeek: {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
  };
  improvement: number;
  highlights: string[];
  recommendations: string[];
}

export interface HabitPerformance {
  habitType: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  goal: number;
  status: 'on_track' | 'needs_attention' | 'exceeding';
}

export interface OptimalTimeAnalysis {
  habitType: string;
  optimalTime: string;
  consistencyScore: number;
  successRate: number;
  recommendations: string[];
}

export interface InsightPreferences {
  showStreaks: boolean;
  showPatterns: boolean;
  showCorrelations: boolean;
  showRecommendations: boolean;
  maxInsights: number;
  priorityOrder: string[];
}

export interface InsightMetrics {
  totalInsightsGenerated: number;
  insightsViewed: number;
  insightsActedUpon: number;
  userEngagement: number;
  dataQuality: number;
}
