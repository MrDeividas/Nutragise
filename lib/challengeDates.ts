/**
 * Challenge days run 5:00am → 4:59am next morning (local time).
 * Example: 1-day challenge on 4 Aug = 4 Aug 5:00am → 5 Aug 4:59am.
 */

export const CHALLENGE_DAY_START_HOUR = 5;

/** Local calendar YMD `YYYY-MM-DD`. */
export function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add calendar days to a local date (copy). */
export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

/** 5:00:00.000 local on the given calendar day. */
export function getChallengePeriodStart(calendarDate: Date): Date {
  const d = new Date(calendarDate);
  d.setHours(CHALLENGE_DAY_START_HOUR, 0, 0, 0);
  return d;
}

/**
 * End of a challenge lasting `durationDays` periods starting on `calendarDate`.
 * 1 day on 4 Aug → 5 Aug 4:59:59.999.
 */
export function getChallengePeriodEnd(calendarDate: Date, durationDays: number): Date {
  const d = addCalendarDays(calendarDate, Math.max(1, durationDays));
  d.setHours(CHALLENGE_DAY_START_HOUR - 1, 59, 59, 999);
  return d;
}

export function buildChallengeDateRange(
  startCalendar: Date,
  durationDays: number
): { start: Date; end: Date } {
  return {
    start: getChallengePeriodStart(startCalendar),
    end: getChallengePeriodEnd(startCalendar, durationDays),
  };
}

/** Local calendar YMD of a stored challenge timestamp. */
export function challengeDateYmd(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const ymd = iso.split('T')[0]?.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
  }
  return localYmd(d);
}

/**
 * Which challenge "business day" a moment falls in (before 5am → previous calendar day).
 */
export function challengeBusinessYmd(at: Date = new Date()): string {
  const d = new Date(at);
  if (d.getHours() < CHALLENGE_DAY_START_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  return localYmd(d);
}

/**
 * How many challenge periods between start and end.
 * 4 Aug 5am → 5 Aug 4:59am = 1 day.
 */
export function getChallengePeriodDays(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): number {
  if (!startIso || !endIso) return 1;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
}

/** @deprecated Use getChallengePeriodDays — kept as alias for older call sites. */
export function getInclusiveChallengeDays(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): number {
  return getChallengePeriodDays(startIso, endIso);
}

/** e.g. "4 Aug" from a challenge timestamp (local calendar day). */
export function formatChallengeShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Human-readable start/end window for a challenge.
 * Uses stored timestamps when they include a real time; otherwise falls back to
 * the 5:00am → 4:59am challenge-day convention.
 */
export function formatChallengeStartEndLabels(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): { started: string; finished: string } {
  if (!startIso || !endIso) {
    return { started: '—', finished: '—' };
  }

  const startRaw = new Date(startIso);
  const endRaw = new Date(endIso);
  if (Number.isNaN(startRaw.getTime()) || Number.isNaN(endRaw.getTime())) {
    return { started: '—', finished: '—' };
  }

  const looksDateOnly = (d: Date, iso: string) => {
    const hasTimePart = /T\d{2}:\d{2}/.test(iso);
    return (
      !hasTimePart ||
      (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0)
    );
  };

  let startAt = startRaw;
  let endAt = endRaw;

  if (looksDateOnly(startRaw, startIso) || looksDateOnly(endRaw, endIso)) {
    const startYmd = challengeDateYmd(startIso)!;
    const durationDays = getChallengePeriodDays(startIso, endIso);
    const calendarStart = new Date(`${startYmd}T12:00:00`);
    startAt = getChallengePeriodStart(calendarStart);
    endAt = getChallengePeriodEnd(calendarStart, durationDays);
  }

  const fmt = (d: Date) =>
    d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return { started: fmt(startAt), finished: fmt(endAt) };
}
