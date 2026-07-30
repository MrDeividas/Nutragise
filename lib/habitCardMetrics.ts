/**
 * Live metric row values for core habit cards (below Invite friend).
 */
import { supabase } from './supabase';
import { dailyHabitsService } from './dailyHabitsService';
import { DailyHabits } from '../types/database';

export type HabitCardMetric = {
  metricLabel: string;
  metricValue: string;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function addDaysToDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getAppTodayDateString(): string {
  const now = new Date();
  const hour = now.getHours();
  const d = hour < 4 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Sleep duration in hours (decimal), or null if not logged. */
export function sleepHoursFromRow(h: DailyHabits | null): number | null {
  if (!h) return null;
  const bh = h.sleep_bedtime_hours;
  const bm = h.sleep_bedtime_minutes ?? 0;
  const wh = h.sleep_wakeup_hours;
  const wm = h.sleep_wakeup_minutes ?? 0;
  if (bh !== undefined && bh !== null && wh !== undefined && wh !== null) {
    const bedtimeTotal = bh * 60 + bm;
    const wakeTimeTotal = wh * 60 + wm;
    let sleepDuration: number;
    if (wakeTimeTotal >= bedtimeTotal) {
      sleepDuration = wakeTimeTotal - bedtimeTotal;
    } else {
      sleepDuration = 24 * 60 - bedtimeTotal + wakeTimeTotal;
    }
    return sleepDuration / 60;
  }
  if (h.sleep_hours != null && Number(h.sleep_hours) > 0) {
    const sh = Number(h.sleep_hours);
    return Number.isFinite(sh) ? sh : null;
  }
  return null;
}

export function formatSleepHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins <= 0) return `${whole}h`;
  if (mins === 60) return `${whole + 1}h`;
  return `${whole}h ${mins}m`;
}

export function truncateMetric(text: string, max = 16): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Parse water_goal as liters; ignore legacy Yes/Almost/No. */
export function parseWaterTargetLiters(goal: string | null | undefined): string | null {
  if (!goal) return null;
  const cleaned = String(goal).trim().replace(/l$/i, '').trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Number(cleaned));
}

function gymSessionName(h: DailyHabits): string | null {
  let name: string | null = null;
  if (h.gym_custom_type?.trim()) name = h.gym_custom_type.trim();
  else if (h.gym_training_types && h.gym_training_types.length > 0) {
    name = h.gym_training_types.join(', ');
  }
  if (!name) return null;
  const duration = h.gym_duration?.trim();
  if (duration) return truncateMetric(`${name} · ${duration}`, 22);
  return name;
}

function exerciseSummary(h: DailyHabits): string | null {
  const name =
    (h.run_type && h.run_type.trim()) ||
    (h.run_activity_type === 'run' ? 'Run' : h.run_activity_type === 'walk' ? 'Walk' : null);
  if (!name) return null;
  const duration = h.run_duration?.trim();
  let durLabel = '';
  if (duration) {
    const parts = duration.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length >= 2) {
      const hours = parts[0];
      const mins = parts[1];
      if (hours > 0) durLabel = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      else durLabel = `${mins}m`;
    } else {
      durLabel = duration;
    }
  }
  const combined = durLabel ? `${name} · ${durLabel}` : name;
  return truncateMetric(combined, 18);
}

function weekdayFromDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return WEEKDAYS[dt.getDay()];
}

function startOfWeekSunday(todayStr: string): string {
  const [y, m, d] = todayStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  return addDaysToDateString(todayStr, -day);
}

async function streakFromPointsField(
  userId: string,
  field: 'meditation_completed' | 'microlearn_completed'
): Promise<number> {
  const today = getAppTodayDateString();
  const start = addDaysToDateString(today, -60);
  const { data, error } = await supabase
    .from('user_points_daily')
    .select(`date, ${field}`)
    .eq('user_id', userId)
    .eq(field, true)
    .gte('date', start)
    .lte('date', today)
    .order('date', { ascending: false });

  if (error || !data?.length) return 0;

  const dates = data.map((r: any) => r.date as string);
  let streak = 0;
  let expect = today;
  const yesterday = addDaysToDateString(today, -1);

  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  if (dates[0] === yesterday) expect = yesterday;

  for (const date of dates) {
    if (date === expect) {
      streak++;
      expect = addDaysToDateString(expect, -1);
    } else if (date < expect) {
      break;
    }
  }
  return streak;
}

export type GoalLike = {
  id: string;
  completed?: boolean;
  frequency?: boolean[];
  start_date?: string | null;
  end_date?: string | null;
};

/** Count active goals scheduled at least once in the current week. */
export function countGoalsDueThisWeek(goals: GoalLike[], todayStr: string): number {
  const weekStart = startOfWeekSunday(todayStr);
  let count = 0;
  for (const goal of goals) {
    if (goal.completed || !goal.frequency?.some(Boolean)) continue;
    let due = false;
    for (let i = 0; i < 7; i++) {
      const dateStr = addDaysToDateString(weekStart, i);
      if (goal.start_date && dateStr < goal.start_date.slice(0, 10)) continue;
      if (goal.end_date && dateStr > goal.end_date.slice(0, 10)) continue;
      const [y, m, d] = dateStr.split('-').map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      if (goal.frequency[dow]) {
        due = true;
        break;
      }
    }
    if (due) count++;
  }
  return count;
}

/**
 * Compute live metric label/value for each core habit id.
 */
export async function computeHabitCardMetrics(
  userId: string,
  goals: GoalLike[] = []
): Promise<Record<string, HabitCardMetric>> {
  const today = getAppTodayDateString();
  const weekStart = startOfWeekSunday(today);
  const lookbackStart = addDaysToDateString(today, -45);

  const rows = await dailyHabitsService.getDailyHabitsRange(userId, lookbackStart, today);

  const sleepWindowStart = addDaysToDateString(today, -6);
  const sleepHours: number[] = [];
  for (const row of rows) {
    if (row.date < sleepWindowStart || row.date > today) continue;
    const hrs = sleepHoursFromRow(row);
    if (hrs != null && hrs > 0) sleepHours.push(hrs);
  }
  const sleepMetric: HabitCardMetric =
    sleepHours.length > 0
      ? {
          metricLabel: '7-day avg',
          metricValue: formatSleepHours(
            sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length
          ),
        }
      : { metricLabel: '7-day avg', metricValue: '—' };

  let waterTarget: string | null = null;
  let bestWaterDate = '';
  for (const row of rows) {
    const parsed = parseWaterTargetLiters(row.water_goal);
    if (parsed && row.date >= bestWaterDate) {
      bestWaterDate = row.date;
      waterTarget = parsed;
    }
  }
  const waterMetric: HabitCardMetric = {
    metricLabel: 'Target',
    metricValue: waterTarget ? `${waterTarget}L` : '—',
  };

  let gymMetric: HabitCardMetric = { metricLabel: 'Last', metricValue: '—' };
  {
    const gymRows = [...rows]
      .filter((r) => r.gym_day_type === 'active' && gymSessionName(r))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (gymRows[0]) {
      gymMetric = {
        metricLabel: 'Last',
        metricValue: truncateMetric(gymSessionName(gymRows[0])!, 16),
      };
    }
  }

  let runMetric: HabitCardMetric = { metricLabel: 'Last', metricValue: '—' };
  {
    const runRows = [...rows]
      .filter((r) => r.run_day_type === 'active' || r.run_activity_type || r.run_type)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const summary = runRows[0] ? exerciseSummary(runRows[0]) : null;
    if (summary) runMetric = { metricLabel: 'Last', metricValue: summary };
  }

  let coldMetric: HabitCardMetric = { metricLabel: 'Last', metricValue: '—' };
  {
    const coldRows = [...rows]
      .filter((r) => r.cold_shower_completed === true)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (coldRows[0]) {
      coldMetric = {
        metricLabel: 'Last',
        metricValue: weekdayFromDateStr(coldRows[0].date),
      };
    }
  }

  const [reflectStreaks, meditationStreak, microlearnStreak] = await Promise.all([
    dailyHabitsService.getHabitStreaksBatch(userId, ['reflect']),
    streakFromPointsField(userId, 'meditation_completed'),
    streakFromPointsField(userId, 'microlearn_completed'),
  ]);

  const focusWeekCount = rows.filter(
    (r) =>
      r.date >= weekStart &&
      r.date <= today &&
      (r.focus_completed === true || (r.focus_duration != null && r.focus_duration > 0))
  ).length;

  const reflectStreak = reflectStreaks.find((s) => s.habit_type === 'reflect')?.current_streak ?? 0;

  let screenMetric: HabitCardMetric = { metricLabel: 'Last logged', metricValue: '—' };
  {
    const screenRows = [...rows]
      .filter((r) => (r as any).screen_time_minutes != null && (r as any).screen_time_minutes > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (screenRows[0]) {
      screenMetric = {
        metricLabel: 'Last logged',
        metricValue: weekdayFromDateStr(screenRows[0].date),
      };
    }
  }

  const dueCount = countGoalsDueThisWeek(goals, today);

  return {
    sleep: sleepMetric,
    water: waterMetric,
    gym: gymMetric,
    run: runMetric,
    cold_shower: coldMetric,
    reflect: { metricLabel: 'Streak', metricValue: String(reflectStreak) },
    focus: { metricLabel: 'This week', metricValue: String(focusWeekCount) },
    meditation: { metricLabel: 'Streak', metricValue: String(meditationStreak) },
    microlearn: { metricLabel: 'Streak', metricValue: String(microlearnStreak) },
    update_goal: {
      metricLabel: 'Due',
      metricValue: String(dueCount),
    },
    screen_time: screenMetric,
  };
}
