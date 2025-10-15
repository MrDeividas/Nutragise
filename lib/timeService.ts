/**
 * Time Service for Daily Post Grouping
 * Handles UK timezone and 4 AM - 3:59 AM daily periods
 */

/**
 * Get the daily post date for a given timestamp
 * Daily period: 4:00 AM - 3:59 AM UK time
 * 
 * Examples:
 * - Dec 16, 2:00 AM UK → Dec 15 daily post
 * - Dec 16, 5:00 AM UK → Dec 16 daily post
 * - Dec 16, 11:00 PM UK → Dec 16 daily post
 */
export function getDailyPostDate(timestamp: Date = new Date()): string {
  try {
    // Use Intl.DateTimeFormat for more reliable timezone conversion
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(timestamp);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    
    // Create the base date string (YYYY-MM-DD format)
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // If between 4 AM and 3:59 AM next day, use current date
    if (hour >= 4) {
      return dateString;
    } else {
      // If between midnight and 3:59 AM, use previous day
      const currentDate = new Date(year, month - 1, day); // month - 1 because Date constructor expects 0-based month
      currentDate.setDate(currentDate.getDate() - 1);
      
      const prevYear = currentDate.getFullYear();
      const prevMonth = currentDate.getMonth() + 1; // +1 because getMonth() returns 0-based month
      const prevDay = currentDate.getDate();
      
      return `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    // Fallback: use current local date if timezone conversion fails
    console.warn('Timezone conversion failed, using local date:', error);
    const localDate = new Date(timestamp);
    return localDate.toISOString().split('T')[0];
  }
}

/**
 * Get UK time from any timestamp
 */
export function getUKTime(timestamp: Date = new Date()): Date {
  const ukTimeString = timestamp.toLocaleString("en-US", {timeZone: "Europe/London"});
  const ukTime = new Date(ukTimeString);
  
  // Validate the date conversion
  if (isNaN(ukTime.getTime())) {
    // Fallback: use offset calculation if locale conversion fails
    const utcTime = timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000);
    const ukOffset = 0; // UK is GMT/UTC in winter, +1 in summer (simplified)
    return new Date(utcTime + (ukOffset * 3600000));
  }
  
  return ukTime;
}

/**
 * Check if a timestamp is in the current daily post period
 */
export function isInCurrentDailyPeriod(timestamp: Date): boolean {
  const currentDailyDate = getDailyPostDate(new Date());
  const timestampDailyDate = getDailyPostDate(timestamp);
  return currentDailyDate === timestampDailyDate;
}

/**
 * Get the start and end times for a daily post period
 */
export function getDailyPeriodBounds(date: string): { start: Date; end: Date } {
  const [year, month, day] = date.split('-').map(Number);
  
  // Start: 4:00 AM on the given date
  const start = new Date();
  start.setFullYear(year, month - 1, day);
  start.setHours(4, 0, 0, 0);
  
  // End: 3:59:59 AM on the next date
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(3, 59, 59, 999);
  
  return { start, end };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format date for journey display (e.g., "Dec 15")
 */
export function formatJourneyDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Get relative time string (e.g., "2h ago", "Today")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    if (diffHours === 0) {
      return 'Just now';
    } else if (diffHours === 1) {
      return '1h ago';
    } else {
      return `${diffHours}h ago`;
    }
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(dateString);
  }
}

/**
 * Calculate day number from first post
 */
export function calculateDayNumber(firstPostDate: string, currentDate: string): number {
  const first = new Date(firstPostDate);
  const current = new Date(currentDate);
  const diffTime = current.getTime() - first.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Get time until next daily post period
 */
export function getTimeUntilNextPeriod(): { hours: number; minutes: number } {
  const now = getUKTime();
  const hour = now.getHours();
  
  if (hour >= 4) {
    // Next period starts at 4 AM tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(4, 0, 0, 0);
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  } else {
    // Next period starts at 4 AM today
    const today = new Date(now);
    today.setHours(4, 0, 0, 0);
    
    const diffMs = today.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }
}
