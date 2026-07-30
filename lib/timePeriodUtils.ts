export interface TimePeriod {
  startDate: string;
  endDate: string;
  label: string;
  days: number;
  periodType: 'past7' | 'currentWeek' | 'last30';
}

class TimePeriodUtils {
  /** Local YYYY-MM-DD (avoids UTC day shifts from toISOString). */
  static toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Parse YYYY-MM-DD as local calendar date. */
  static parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  static getLocalDayName(dateStr: string): string {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[this.parseLocalDate(dateStr).getDay()];
  }

  /** Inclusive list of local calendar dates between start and end. */
  static eachDate(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const cur = this.parseLocalDate(startDate);
    const last = this.parseLocalDate(endDate);
    while (cur <= last) {
      dates.push(this.toLocalDateString(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  /**
   * Get past 7 days (rolling window from today)
   */
  static getPast7Days(): TimePeriod {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    return {
      startDate: this.toLocalDateString(startDate),
      endDate: this.toLocalDateString(endDate),
      label: 'Past 7 Days',
      days: 7,
      periodType: 'past7',
    };
  }

  /**
   * Get current week (Monday to Sunday)
   */
  static getCurrentWeek(): TimePeriod {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      startDate: this.toLocalDateString(weekStart),
      endDate: this.toLocalDateString(weekEnd),
      label: 'This Week',
      days: 7,
      periodType: 'currentWeek',
    };
  }

  /**
   * Get last 30 days (rolling window from today)
   */
  static getLast30Days(): TimePeriod {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29);

    return {
      startDate: this.toLocalDateString(startDate),
      endDate: this.toLocalDateString(endDate),
      label: 'Last 30 Days',
      days: 30,
      periodType: 'last30',
    };
  }

  /**
   * Get the start of the week (Monday) for a given date — does not mutate input.
   */
  static getWeekStart(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  /**
   * Get all available time periods
   */
  static getAllPeriods(): TimePeriod[] {
    return [this.getPast7Days(), this.getCurrentWeek(), this.getLast30Days()];
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
   * Get the number of days between two dates (inclusive)
   */
  static getDaysBetween(startDate: string, endDate: string): number {
    return this.eachDate(startDate, endDate).length;
  }
}

export default TimePeriodUtils;
