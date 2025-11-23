export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  frequency?: boolean[];
  time_commitment?: string;
  check_in_schedule?: string;
  sharing_option?: string;
  success_criteria?: string;
  milestone_count?: number;
  milestones?: string[];
  completed: boolean;
  created_at: string;
  last_updated_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  daily_post_id?: string;
  content: string;
  goal_id?: string;
  date: string;
  photos: string[];
  habits_completed: string[];
  caption?: string;
  mood_rating?: number;
  energy_level?: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyPost {
  id: string;
  user_id: string;
  date: string;
  photos: string[];
  captions: string[];
  habits_completed: string[];
  total_photos: number;
  total_habits: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileView {
  id: string;
  viewer_id: string;
  profile_user_id: string;
  last_viewed_at: string;
}

export interface CreatePostData {
  content: string;
  goal_id?: string;
  date: string;
  photos: string[];
  habits_completed: string[];
  caption?: string;
  mood_rating?: number;
  energy_level?: number;
  is_public?: boolean;
}

export interface UpdatePostData extends Partial<CreatePostData> {}

export interface DailyPostGroup {
  date: string;
  posts: Post[];
  isNewDay: boolean;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  goal_id: string;
  photo_url: string;
  date_uploaded: string;
  check_in_date?: string;
  note?: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  height?: string;
  age?: number;
  completed_competitions?: number;
  won_awards?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  frequency?: boolean[];
  time_commitment?: string;
  check_in_schedule?: string;
  sharing_option?: string;
  success_criteria?: string;
  milestone_count?: number;
  milestones?: string[];
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  frequency?: boolean[];
  time_commitment?: string;
  check_in_schedule?: string;
  sharing_option?: string;
  success_criteria?: string;
  milestone_count?: number;
  milestones?: string[];
  completed?: boolean;
  last_updated_at?: string;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
} 

export interface DailyHabits {
  id: string;
  user_id: string;
  date: string;
  
  // Sleep habit data
  sleep_hours?: number;
  sleep_quality?: number;
  sleep_notes?: string;
  sleep_bedtime_hours?: number;
  sleep_bedtime_minutes?: number;
  sleep_wakeup_hours?: number;
  sleep_wakeup_minutes?: number;  
  // Water habit data
  water_intake?: number;
  water_goal?: string;
  water_notes?: string;
  
  // Run habit data
  run_activity_type?: 'run' | 'walk';
  run_day_type?: 'active' | 'rest';
  run_type?: string;
  run_distance?: number;
  run_duration?: string;
  run_notes?: string;
  
  // Gym habit data
  gym_day_type?: 'active' | 'rest';
  gym_training_types?: string[];
  gym_custom_type?: string;
  
  // Reflect habit data
  reflect_mood?: number;
  reflect_energy?: number;
  reflect_motivation?: number;
  reflect_stress?: number;
  reflect_what_went_well?: string;
  reflect_friction?: string;
  reflect_one_tweak?: string;
  reflect_nothing_to_change?: boolean;
  
  // Cold shower habit data
  cold_shower_completed?: boolean;
  
  // Focus habit data
  focus_duration?: number;  // in minutes
  focus_start_time?: string;  // ISO timestamp
  focus_end_time?: string;  // ISO timestamp
  focus_notes?: string;
  focus_completed?: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreateDailyHabitsData {
  date: string;
  sleep_bedtime_hours?: number;
  sleep_bedtime_minutes?: number;
  sleep_wakeup_hours?: number;
  sleep_wakeup_minutes?: number;  sleep_hours?: number;
  sleep_quality?: number;
  sleep_notes?: string;
  water_intake?: number;
  water_goal?: string;
  water_notes?: string;
  run_activity_type?: 'run' | 'walk';
  run_day_type?: 'active' | 'rest';
  run_type?: string;
  run_distance?: number;
  run_duration?: string;
  run_notes?: string;
  gym_day_type?: 'active' | 'rest';
  gym_training_types?: string[];
  gym_custom_type?: string;
  reflect_mood?: number;
  reflect_energy?: number;
  reflect_motivation?: number;
  reflect_stress?: number;
  reflect_what_went_well?: string;
  reflect_friction?: string;
  reflect_one_tweak?: string;
  reflect_nothing_to_change?: boolean;
  cold_shower_completed?: boolean;
  focus_duration?: number;
  focus_start_time?: string;
  focus_end_time?: string;
  focus_notes?: string;
  focus_completed?: boolean;
}

export interface UpdateDailyHabitsData extends Partial<CreateDailyHabitsData> {}

export type HabitCategory = 'custom' | 'wellbeing' | 'nutrition' | 'time' | 'avoid';
export type HabitMode = 'positive' | 'negative' | 'timed';
export type HabitScheduleType =
  | 'specific_days_week'
  | 'specific_days_month'
  | 'days_per_week'
  | 'days_per_fortnight'
  | 'days_per_month'
  | 'every_x_days';

export interface CustomHabit {
  id: string;
  user_id: string;
  title: string;
  preset_key?: string | null;
  category: HabitCategory;
  habit_mode: HabitMode;
  description?: string | null;
  accent_color?: string | null;
  icon_name?: string | null;
  schedule_type: HabitScheduleType;
  days_of_week?: number[] | null;
  days_of_month?: number[] | null;
  quantity_per_week?: number | null;
  quantity_per_fortnight?: number | null;
  quantity_per_month?: number | null;
  every_x_days?: number | null;
  start_date?: string | null;
  timezone?: string | null;
  goal_duration_minutes?: number | null;
  metadata?: Record<string, any>;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomHabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  occur_date: string;
  status: 'completed' | 'skipped' | 'missed';
  value?: number | null;
  note?: string | null;
  created_at: string;
}

export interface CreateCustomHabitInput {
  title: string;
  preset_key?: string | null;
  category: HabitCategory;
  habit_mode: HabitMode;
  description?: string | null;
  accent_color?: string | null;
  icon_name?: string | null;
  schedule_type: HabitScheduleType;
  days_of_week?: number[] | null;
  days_of_month?: number[] | null;
  quantity_per_week?: number | null;
  quantity_per_fortnight?: number | null;
  quantity_per_month?: number | null;
  every_x_days?: number | null;
  start_date?: string | null;
  timezone?: string | null;
  goal_duration_minutes?: number | null;
  metadata?: Record<string, any>;
}

export interface CompleteHabitPayload {
  habit_id: string;
  occur_date: string;
  status?: 'completed' | 'skipped' | 'missed';
  value?: number | null;
  note?: string | null;
}

export interface HabitStreak {
  habit_type: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string;
}

// DM (Direct Messaging) Types
export interface Chat {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_id?: string;
  last_message_preview?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatWithProfile extends Chat {
  other_user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  unread_count: number;
  is_following: boolean;
}

export interface TypingIndicator {
  id: string;
  chat_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
} 