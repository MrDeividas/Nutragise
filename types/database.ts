export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  start_date: string;
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

export interface ProgressPhoto {
  id: string;
  user_id: string;
  goal_id: string;
  photo_url: string;
  date_uploaded: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  goal_id?: string;
  created_at: string;
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