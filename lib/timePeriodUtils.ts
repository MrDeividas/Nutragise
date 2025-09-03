export interface TimePeriod {
  startDate: string;
  endDate: string;
  label: string;
  days: number;
  periodType: 'past7' | 'currentWeek' | 'last30';
}

class TimePeriodUtils {
  /**
   * Get past 7 days (rolling window from today)
   */
  static getPast7Days(): TimePeriod {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      label: 'Past 7 Days',
      days: 7,
      periodType: 'past7'
    };
  }

  /**
   * Get current week (Monday to Sunday)
   */
  static getCurrentWeek(): TimePeriod {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
    
    return {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      label: 'This Week',
      days: 7,
      periodType: 'currentWeek'
    };
  }

  /**
   * Get last 30 days (rolling window from today)
   */
  static getLast30Days(): TimePeriod {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      label: 'Last 30 Days',
      days: 30,
      periodType: 'last30'
    };
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  static getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(date.setDate(diff));
  }

  /**
   * Get all available time periods
   */
  static getAllPeriods(): TimePeriod[] {
    return [
      this.getPast7Days(),
      this.getCurrentWeek(),
      this.getLast30Days()
    ];
  }

  /**
   * Get period by type
   */
  static getPeriodByType(periodType: 'past7' | 'currentWeek' | 'last30'): TimePeriod {
    switch (periodType) {
      case 'past7':
        return this.getPast7Days();
      case 'currentWeek':
        return this.getCurrentWeek();
      case 'last30':
        return this.getLast30Days();
      default:
        return this.getPast7Days();
    }
  }

  /**
   * Check if a date falls within a time period
   */
  static isDateInPeriod(date: string, period: TimePeriod): boolean {
    return date >= period.startDate && date <= period.endDate;
  }

  /**
   * Get the number of days between two dates
   */
  static getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  }
}

export default TimePeriodUtils;
