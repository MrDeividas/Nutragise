import { Platform } from 'react-native';

/** Soft-load HealthKit — missing native module must not crash Expo Go / Android. */
let AppleHealthKit: any = null;
try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default ?? require('react-native-health');
  }
} catch {
  AppleHealthKit = null;
}

export type AppleHealthSleepSample = {
  totalMinutes: number;
  hours: number;
  minutes: number;
  bedtime: Date | null;
  wakeTime: Date | null;
  /** 0–100 quality estimate (8h asleep ≈ 100). */
  quality: number;
};

export type AppleHealthSnapshot = {
  available: boolean;
  authorized: boolean;
  sleep: AppleHealthSleepSample | null;
  steps: number;
  distanceMeters: number;
  syncedAt: number | null;
};

type Listener = (snapshot: AppleHealthSnapshot) => void;

const EMPTY: AppleHealthSnapshot = {
  available: false,
  authorized: false,
  sleep: null,
  steps: 0,
  distanceMeters: 0,
  syncedAt: null,
};

let snapshot: AppleHealthSnapshot = { ...EMPTY, available: Platform.OS === 'ios' && !!AppleHealthKit };
const listeners = new Set<Listener>();
let initPromise: Promise<boolean> | null = null;
let syncPromise: Promise<AppleHealthSnapshot> | null = null;

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

function setSnapshot(partial: Partial<AppleHealthSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

function roundToFive(n: number) {
  return Math.round(n / 5) * 5;
}

function parseSleepSamples(results: any[]): AppleHealthSleepSample | null {
  if (!results?.length) return null;

  let totalSleepMinutes = 0;
  let bedtime: Date | null = null;
  let wakeTime: Date | null = null;

  results.forEach((sample: any) => {
    const value = String(sample?.value ?? '').toUpperCase();
    // ASLEEP / INBED / and numeric enums used by some HealthKit wrappers
    const isSleep =
      value === 'ASLEEP' ||
      value === 'INBED' ||
      value === 'CORE' ||
      value === 'DEEP' ||
      value === 'REM' ||
      value === '1' ||
      value === '0' ||
      sample?.value === 0 ||
      sample?.value === 1;

    if (!isSleep) return;

    const start = new Date(sample.startDate);
    const end = new Date(sample.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    if (duration <= 0 || duration > 24 * 60) return;

    totalSleepMinutes += duration;
    if (!bedtime || start < bedtime) bedtime = start;
    if (!wakeTime || end > wakeTime) wakeTime = end;
  });

  if (totalSleepMinutes < 30) return null;

  const quality = Math.min(100, Math.round((totalSleepMinutes / 480) * 100));
  return {
    totalMinutes: Math.round(totalSleepMinutes),
    hours: Math.floor(totalSleepMinutes / 60),
    minutes: Math.round(totalSleepMinutes % 60),
    bedtime,
    wakeTime,
    quality,
  };
}

function promisify<T>(fn: (cb: (err: any, result: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      fn((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    } catch (e) {
      reject(e);
    }
  });
}

class AppleHealthService {
  getSnapshot(): AppleHealthSnapshot {
    return snapshot;
  }

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(snapshot);
    return () => listeners.delete(listener);
  }

  isSupported(): boolean {
    return (
      Platform.OS === 'ios' &&
      !!AppleHealthKit &&
      typeof AppleHealthKit.initHealthKit === 'function'
    );
  }

  /**
   * Shows the iOS Health permission sheet (once). Safe to call on every launch —
   * iOS only prompts if not yet decided.
   */
  async requestAuthorization(): Promise<boolean> {
    if (!this.isSupported()) {
      setSnapshot({ available: false, authorized: false });
      return false;
    }

    if (initPromise) return initPromise;

    initPromise = new Promise((resolve) => {
      try {
        const permissions = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.SleepAnalysis,
              AppleHealthKit.Constants.Permissions.Steps,
              AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            ],
            write: [],
          },
        };

        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          const authorized = !error;
          setSnapshot({ available: true, authorized });
          resolve(authorized);
        });
      } catch {
        setSnapshot({ available: false, authorized: false });
        resolve(false);
      }
    });

    return initPromise;
  }

  async fetchSleep(hoursBack = 36): Promise<AppleHealthSleepSample | null> {
    if (!this.isSupported() || typeof AppleHealthKit.getSleepSamples !== 'function') {
      return null;
    }

    const options = {
      startDate: new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    };

    try {
      const results = await promisify<any[]>((cb) =>
        AppleHealthKit.getSleepSamples(options, cb)
      );
      return parseSleepSamples(results || []);
    } catch {
      return null;
    }
  }

  async fetchStepsToday(): Promise<{ steps: number; distanceMeters: number }> {
    if (!this.isSupported() || typeof AppleHealthKit.getStepCount !== 'function') {
      return { steps: 0, distanceMeters: 0 };
    }

    const options = { date: new Date().toISOString() };

    let steps = 0;
    let distanceMeters = 0;

    try {
      const stepsResult = await promisify<any>((cb) =>
        AppleHealthKit.getStepCount(options, cb)
      );
      steps = Math.round(Number(stepsResult?.value) || 0);
    } catch {
      steps = 0;
    }

    try {
      if (typeof AppleHealthKit.getDistanceWalkingRunning === 'function') {
        const distanceResult = await promisify<any>((cb) =>
          AppleHealthKit.getDistanceWalkingRunning(options, cb)
        );
        distanceMeters = Number(distanceResult?.value) || 0;
      }
    } catch {
      distanceMeters = 0;
    }

    return { steps, distanceMeters };
  }

  /**
   * Refresh Health data into the shared snapshot.
   * Call on app launch / foreground / Action focus.
   */
  async sync(options?: { force?: boolean }): Promise<AppleHealthSnapshot> {
    if (!this.isSupported()) {
      setSnapshot({ available: false, authorized: false });
      return snapshot;
    }

    // Debounce identical in-flight syncs
    if (syncPromise && !options?.force) return syncPromise;

    // Skip if we synced in the last 45s unless forced
    if (
      !options?.force &&
      snapshot.syncedAt &&
      Date.now() - snapshot.syncedAt < 45_000
    ) {
      return snapshot;
    }

    syncPromise = (async () => {
      const authorized = await this.requestAuthorization();
      if (!authorized) {
        setSnapshot({ authorized: false, syncedAt: Date.now() });
        return snapshot;
      }

      const [sleep, activity] = await Promise.all([
        this.fetchSleep(),
        this.fetchStepsToday(),
      ]);

      setSnapshot({
        available: true,
        authorized: true,
        sleep,
        steps: activity.steps,
        distanceMeters: activity.distanceMeters,
        syncedAt: Date.now(),
      });

      return snapshot;
    })().finally(() => {
      syncPromise = null;
    });

    return syncPromise;
  }

  /** Helpers for Action / Challenge UI */
  sleepQuestionnaireDefaults(sleep: AppleHealthSleepSample) {
    return {
      sleepQuality: sleep.quality,
      bedtimeHours: sleep.bedtime ? sleep.bedtime.getHours() : 22,
      bedtimeMinutes: sleep.bedtime ? roundToFive(sleep.bedtime.getMinutes()) : 0,
      wakeupHours: sleep.wakeTime ? sleep.wakeTime.getHours() : 6,
      wakeupMinutes: sleep.wakeTime ? roundToFive(sleep.wakeTime.getMinutes()) : 0,
      sleepNotes: `Loaded from Apple Health (${sleep.hours}h ${sleep.minutes}m)`,
    };
  }

  isStepChallengeTitle(title: string | null | undefined): boolean {
    const t = (title || '').toLowerCase();
    return t.includes('step');
  }

  /** Parse a target like 10000 / 15000 from challenge titles when present. */
  parseStepTarget(title: string | null | undefined): number | null {
    const t = (title || '').toLowerCase();
    const match = t.match(/(\d+)\s*k\s*steps?/) || t.match(/(\d[\d,]*)\s*steps?/);
    if (!match) return null;
    const raw = match[1].replace(/,/g, '');
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    // "15k" style
    if (/k\s*steps?/.test(t) && n < 1000) return Math.round(n * 1000);
    return Math.round(n);
  }
}

export const appleHealthService = new AppleHealthService();
