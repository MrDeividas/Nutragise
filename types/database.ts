export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  start_date: string;
  end_date?: string;
  completed: boolean;
  created_at: string;
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
  follower_id: string;
  following_id: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  category?: string;
  end_date?: string;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  end_date?: string;
  completed?: boolean;
} 