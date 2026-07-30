import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type {
  HabitCompletionRate,
  ThreeWeekPulse,
  EnergyInsight,
  SleepSnapshot,
  MovementSummary,
} from '../lib/analyticsService';
import { analyticsService } from '../lib/analyticsService';

const HABIT_ORDER = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'] as const;

const HABIT_COLORS: Record<string, string> = {
  sleep: '#7DD3FC',
  water: '#67E8F9',
  run: '#86EFAC',
  gym: '#FCD34D',
  reflect: '#F9A8D4',
  cold_shower: '#A5B4FC',
};

function formatHabit(habit: string): string {
  return analyticsService.formatHabitLabel(habit);
}

function capitalizeDay(day: string | null): string {
  if (!day) return '—';
  return day.charAt(0).toUpperCase() + day.slice(1);
}

interface PanelTheme {
  textPrimary: string;
  textSecondary: string;
  primary: string;
}

function MetaBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function HorizontalBar({
  pct,
  color,
  track = 'rgba(31,41,55,0.08)',
}: {
  pct: number;
  color: string;
  track?: string;
}) {
  const width = Math.max(4, Math.min(100, pct));
  return (
    <View style={[styles.hBarTrack, { backgroundColor: track }]}>
      <View style={[styles.hBarFill, { width: `${width}%`, backgroundColor: color }]} />
    </View>
  );
}

interface HabitScoreboardProps extends PanelTheme {
  data: HabitCompletionRate | null;
  loading?: boolean;
}

/** Horizontal colorful bars — like a race chart */
export const HabitScoreboard: React.FC<HabitScoreboardProps> = ({
  data,
  loading,
  textPrimary,
  textSecondary,
}) => {
  const rows = useMemo(() => {
    if (!data?.habitBreakdown) return [];
    const top = new Set(data.topPerforming || []);
    const needs = new Set(data.needsAttention || []);
    return HABIT_ORDER.map((habit) => {
      const stats = (data.habitBreakdown as any)[habit];
      return {
        habit,
        label: formatHabit(habit),
        completion: Math.round(stats?.completion ?? 0),
        streak: stats?.streak ?? 0,
        isTop: top.has(habit),
        needsAttention: needs.has(habit) && !top.has(habit),
        color: HABIT_COLORS[habit] || '#94A3B8',
      };
    }).sort((a, b) => b.completion - a.completion);
  }, [data]);

  return (
    <View style={[styles.card, { backgroundColor: '#ECFDF5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Habit Scoreboard</Text>
        <MetaBadge label="This week" />
      </View>

      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" style={{ marginVertical: 12 }} />
      ) : (
        <>
          <View style={styles.heroRow}>
            <Text style={[styles.heroNum, { color: textPrimary }]}>
              {Math.round(data?.overallCompletion ?? 0)}
              <Text style={[styles.heroUnit, { color: textSecondary }]}>%</Text>
            </Text>
            <Text style={[styles.heroSub, { color: textSecondary }]}>overall completion</Text>
          </View>

          <View style={styles.barList}>
            {rows.map((row) => (
              <View key={row.habit} style={styles.barRow}>
                <View style={styles.barRowTop}>
                  <Text style={[styles.barLabel, { color: textPrimary }]}>
                    {row.label}
                    {row.isTop ? ' · top' : row.needsAttention ? ' · focus' : ''}
                  </Text>
                  <Text style={[styles.barPct, { color: textPrimary }]}>{row.completion}%</Text>
                </View>
                <HorizontalBar pct={row.completion} color={row.color} />
                <Text style={[styles.barMeta, { color: textSecondary }]}>
                  {row.streak}d streak
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

interface WeekPulseProps extends PanelTheme {
  data: ThreeWeekPulse | null;
  loading?: boolean;
}

/** Vertical bars like Screen Time */
export const WeekPulsePanel: React.FC<WeekPulseProps> = ({
  data,
  loading,
  textPrimary,
  textSecondary,
}) => {
  const columns = data
    ? [
        { key: 'this', label: 'This', rate: data.thisWeek.completionRate, color: '#34D399' },
        { key: 'last', label: 'Last', rate: data.lastWeek.completionRate, color: '#FBBF24' },
        {
          key: 'older',
          label: '2 wks',
          rate: data.twoWeeksAgo.completionRate,
          color: '#93C5FD',
        },
      ]
    : [];

  const maxRate = Math.max(100, ...columns.map((c) => c.rate), 1);
  const delta = data ? Math.round(data.lastWeek.deltaVsPrevious) : 0;

  return (
    <View style={[styles.card, { backgroundColor: '#FEF3C7' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Week pulse</Text>
        <MetaBadge label="3 weeks" />
      </View>

      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" style={{ marginVertical: 12 }} />
      ) : (
        <>
          <View style={styles.heroRow}>
            <Text style={[styles.heroNum, { color: textPrimary }]}>
              {Math.round(data?.thisWeek.completionRate ?? 0)}
              <Text style={[styles.heroUnit, { color: textSecondary }]}>%</Text>
            </Text>
            <Text
              style={[
                styles.deltaPill,
                {
                  backgroundColor: delta >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: delta >= 0 ? '#15803D' : '#B91C1C',
                },
              ]}
            >
              {delta === 0 ? 'flat vs last' : delta > 0 ? `↑${delta} vs last` : `↓${Math.abs(delta)} vs last`}
            </Text>
          </View>

          <View style={styles.vBars}>
            {columns.map((col) => {
              const h = Math.max(12, (col.rate / maxRate) * 100);
              return (
                <View key={col.key} style={styles.vBarCol}>
                  <Text style={[styles.vBarValue, { color: textPrimary }]}>
                    {Math.round(col.rate)}%
                  </Text>
                  <View style={styles.vBarTrack}>
                    <View
                      style={[
                        styles.vBarFill,
                        { height: `${h}%`, backgroundColor: col.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.vBarLabel, { color: textSecondary }]}>{col.label}</Text>
                </View>
              );
            })}
          </View>

          {data?.highlights?.length ? (
            <View style={styles.footer}>
              {data.highlights.map((line, i) => (
                <Text key={i} style={[styles.footerText, { color: textSecondary }]}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
};

interface EnergyPanelProps extends PanelTheme {
  data: EnergyInsight | null;
  loading?: boolean;
}

/** Soft blue card + segmented meter */
export const EnergyPanel: React.FC<EnergyPanelProps> = ({
  data,
  loading,
  textPrimary,
  textSecondary,
}) => {
  const avg = data?.average ?? 0;
  const segments = [1, 2, 3, 4, 5];

  return (
    <View style={[styles.card, { backgroundColor: '#DBEAFE' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Energy</Text>
        <MetaBadge label="This week" />
      </View>

      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" style={{ marginVertical: 8 }} />
      ) : !data || data.sampleDays === 0 || data.average == null ? (
        <Text style={[styles.emptyHint, { color: textSecondary }]}>
          Log energy in Reflect to see your average and best day.
        </Text>
      ) : (
        <>
          <View style={styles.heroRow}>
            <Text style={[styles.heroNum, { color: textPrimary }]}>
              {avg}
              <Text style={[styles.heroUnit, { color: textSecondary }]}> / 5</Text>
            </Text>
            <Text style={[styles.heroSub, { color: textSecondary }]}>
              Best on {capitalizeDay(data.bestDay)}s · {data.sampleDays} days
            </Text>
          </View>

          <View style={styles.segRow}>
            {segments.map((s) => (
              <View
                key={s}
                style={[
                  styles.seg,
                  {
                    backgroundColor:
                      s <= Math.round(avg) ? '#3B82F6' : 'rgba(255,255,255,0.55)',
                  },
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

interface SleepSnapshotProps extends PanelTheme {
  data: SleepSnapshot | null;
  loading?: boolean;
}

/** Dual hero + quality bar */
export const SleepSnapshotPanel: React.FC<SleepSnapshotProps> = ({
  data,
  loading,
  textPrimary,
  textSecondary,
}) => {
  const empty = !data || data.nightsLogged === 0;
  const quality = data?.averageQuality ?? 0;

  return (
    <View style={[styles.card, { backgroundColor: '#FCE7F3' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Sleep Snapshot</Text>
        <MetaBadge label="This week" />
      </View>

      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" style={{ marginVertical: 12 }} />
      ) : empty ? (
        <Text style={[styles.emptyHint, { color: textSecondary }]}>
          Log sleep to see hours, quality, and ideal bed/wake times.
        </Text>
      ) : (
        <>
          <View style={styles.dualHero}>
            <View style={styles.dualHeroBlock}>
              <Text style={[styles.heroNum, { color: textPrimary }]}>
                {data!.averageHours != null ? data!.averageHours : '—'}
                <Text style={[styles.heroUnit, { color: textSecondary }]}>h</Text>
              </Text>
              <Text style={[styles.heroSub, { color: textSecondary }]}>avg hours</Text>
            </View>
            <View style={styles.dualDivider} />
            <View style={styles.dualHeroBlock}>
              <Text style={[styles.heroNum, { color: textPrimary }]}>
                {data!.averageQuality != null ? data!.averageQuality : '—'}
              </Text>
              <Text style={[styles.heroSub, { color: textSecondary }]}>avg quality</Text>
            </View>
          </View>

          <Text style={[styles.barLabel, { color: textPrimary, marginBottom: 6 }]}>
            Quality
          </Text>
          <HorizontalBar pct={quality} color="#F472B6" track="rgba(255,255,255,0.5)" />

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={[styles.chipValue, { color: textPrimary }]}>
                {data!.bedtimeConsistency}%
              </Text>
              <Text style={[styles.chipLabel, { color: textSecondary }]}>consistency</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={[styles.chipValue, { color: textPrimary }]}>
                {data!.optimalBedtime}
              </Text>
              <Text style={[styles.chipLabel, { color: textSecondary }]}>best bed</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={[styles.chipValue, { color: textPrimary }]}>
                {data!.optimalWakeTime}
              </Text>
              <Text style={[styles.chipLabel, { color: textSecondary }]}>best wake</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

interface MovementPanelProps extends PanelTheme {
  data: MovementSummary | null;
  loading?: boolean;
}

/** Split bars for run vs gym */
export const MovementPanel: React.FC<MovementPanelProps> = ({
  data,
  loading,
  textPrimary,
  textSecondary,
}) => {
  const run = data?.runSessions ?? 0;
  const gym = data?.gymSessions ?? 0;
  const max = Math.max(run, gym, 1);

  return (
    <View style={[styles.card, { backgroundColor: '#D1FAE5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Movement</Text>
        <MetaBadge label="This week" />
      </View>

      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" style={{ marginVertical: 12 }} />
      ) : (
        <>
          <View style={styles.heroRow}>
            <Text style={[styles.heroNum, { color: textPrimary }]}>
              {data?.totalDistanceKm ?? 0}
              <Text style={[styles.heroUnit, { color: textSecondary }]}> km</Text>
            </Text>
            <Text style={[styles.heroSub, { color: textSecondary }]}>
              {data?.topTrainingType
                ? `Top training: ${data.topTrainingType}`
                : data?.takeaway || ''}
            </Text>
          </View>

          <View style={styles.vBars}>
            <View style={styles.vBarCol}>
              <Text style={[styles.vBarValue, { color: textPrimary }]}>{run}</Text>
              <View style={styles.vBarTrack}>
                <View
                  style={[
                    styles.vBarFill,
                    {
                      height: `${Math.max(12, (run / max) * 100)}%`,
                      backgroundColor: '#34D399',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.vBarLabel, { color: textSecondary }]}>Run</Text>
            </View>
            <View style={styles.vBarCol}>
              <Text style={[styles.vBarValue, { color: textPrimary }]}>{gym}</Text>
              <View style={styles.vBarTrack}>
                <View
                  style={[
                    styles.vBarFill,
                    {
                      height: `${Math.max(12, (gym / max) * 100)}%`,
                      backgroundColor: '#FBBF24',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.vBarLabel, { color: textSecondary }]}>Gym</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  heroRow: {
    marginBottom: 14,
  },
  heroNum: {
    fontSize: 32,
    fontWeight: '700',
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '500',
  },
  heroSub: {
    fontSize: 13,
    marginTop: 2,
  },
  deltaPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  barList: {
    gap: 12,
  },
  barRow: {
    gap: 4,
  },
  barRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  barPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  barMeta: {
    fontSize: 11,
  },
  hBarTrack: {
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  vBars: {
    flexDirection: 'row',
    height: 110,
    gap: 10,
    marginBottom: 4,
  },
  vBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  vBarValue: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  vBarTrack: {
    flex: 1,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    minHeight: 60,
  },
  vBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 8,
  },
  vBarLabel: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.12)',
    gap: 2,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  segRow: {
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 14,
    borderRadius: 7,
  },
  dualHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dualHeroBlock: {
    flex: 1,
    alignItems: 'center',
  },
  dualDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
