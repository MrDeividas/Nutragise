import { Goal, GoalProgress } from '../types/database';

// Category icons mapping
export const categoryIcons: { [key: string]: string } = {
  'Health': '🏥',
  'Fitness': '💪',
  'Learning': '📚',
  'Productivity': '⚡',
  'Finance': '💰',
  'Relationships': '❤️',
  'Nutrition': '🥗',
  'Habits': '🎯',
  'Career': '🚀',
  'Personal Growth': '🌱',
  'Other': '📋',
};

// Calculate total required sessions for a goal
export function calculateTotalSessions(goal: Goal): number {
  if (!goal.start_date || !goal.end_date || !goal.frequency) {
    return 0;
  }

  const startDate = new Date(goal.start_date);
  const endDate = new Date(goal.end_date);
  
  // Count how many days per week are selected in frequency
  const daysPerWeek = goal.frequency.filter(day => day).length;
  
  if (daysPerWeek === 0) return 0;

  // Calculate total days in the goal period
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // If the goal period is less than a week, count available days
  if (totalDays <= 7) {
    let availableSessions = 0;
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (goal.frequency[dayOfWeek]) {
        availableSessions++;
      }
    }
    return availableSessions;
  }
  
  // For longer periods, calculate based on full weeks + partial week
  const fullWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  
  let totalSessions = fullWeeks * daysPerWeek;
  
  // Add sessions from the partial week
  for (let i = 0; i < remainingDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (fullWeeks * 7) + i);
    const dayOfWeek = currentDate.getDay();
    
    if (goal.frequency[dayOfWeek]) {
      totalSessions++;
    }
  }
  
  return totalSessions;
}

// Calculate completion percentage based on progress entries
export function calculateCompletionPercentage(goal: Goal, progressEntries: GoalProgress[]): number {
  const totalSessions = calculateTotalSessions(goal);
  
  if (totalSessions === 0) return 0;
  
  const completedSessions = progressEntries.length;
  const percentage = Math.min(100, Math.round((completedSessions / totalSessions) * 100));
  
  return percentage;
}

// Get category icon for a goal
export function getCategoryIcon(category?: string): string {
  if (!category) return categoryIcons['Other'];
  return categoryIcons[category] || categoryIcons['Other'];
}

// Format last update time in a user-friendly way
export function formatLastUpdate(lastUpdatedAt?: string, createdAt?: string): string {
  if (!lastUpdatedAt) {
    // If no updates, show how long ago the goal was created
    if (createdAt) {
      const now = new Date();
      const created = new Date(createdAt);
      const diffInMs = now.getTime() - created.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInMinutes < 1) return 'just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      // For older goals, show the date
      return created.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return 'No updates';
  }

  const now = new Date();
  const lastUpdated = new Date(lastUpdatedAt);
  const diffInMs = now.getTime() - lastUpdated.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  // For older updates, show the date
  return lastUpdated.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
} 