import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type {
  MeditationInsight,
  MicrolearnInsight,
  GoalsInsight,
  PillarsInsight,
  LoginInsight,
  ChallengesInsight,
  ScreenTimeInsight,
} from '../lib/stage3InsightService';

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

function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={styles.hTrack}>
      <View
        style={[
          styles.hFill,
          { width: `${Math.max(4, Math.min(100, pct))}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

export const MeditationInsightPanel: React.FC<
  PanelTheme & { data: MeditationInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const has = !!data && (data.weekSessions > 0 || data.allTimeSessions > 0);
  return (
    <View style={[styles.card, { backgroundColor: '#CCFBF1' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Meditation</Text>
        <MetaBadge label="This week" />
      </View>
      {loading && !has ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !has ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Complete a meditation to see sessions and minutes here.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data!.weekMinutes}
            <Text style={[styles.heroUnit, { color: textSecondary }]}> min</Text>
          </Text>
          <Text style={[styles.sub, { color: textSecondary }]}>
            {data!.weekSessions} sessions · avg {data!.avgSessionMinutes}m
          </Text>
          <View style={styles.statStrip}>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.weekSessions}
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>sessions</Text>
            </View>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.allTimeSessions}
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>all-time</Text>
            </View>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.allTimeMinutes}m
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>lifetime</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export const MicrolearnInsightPanel: React.FC<
  PanelTheme & { data: MicrolearnInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const has = !!data && (data.completed > 0 || data.started > 0);
  return (
    <View style={[styles.card, { backgroundColor: '#FFEDD5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Microlearns</Text>
        <MetaBadge label="All time" />
      </View>
      {loading && !has ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !has ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Start a microlearn to track completions and quiz scores.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data!.completed}
            <Text style={[styles.heroUnit, { color: textSecondary }]}> done</Text>
          </Text>
          <Text style={[styles.barLab, { color: textPrimary }]}>Pass rate</Text>
          <HBar pct={data!.passRate ?? 0} color="#FB923C" />
          <View style={styles.statStrip}>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.passRate != null ? `${data!.passRate}%` : '—'}
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>pass</Text>
            </View>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.avgScore != null ? `${data!.avgScore}%` : '—'}
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>avg score</Text>
            </View>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>{data!.started}</Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>started</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export const GoalsInsightPanel: React.FC<
  PanelTheme & { data: GoalsInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const has = !!data && data.activeGoals > 0;
  return (
    <View style={[styles.card, { backgroundColor: '#FCE7F3' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Goals</Text>
        <MetaBadge label="Active" />
      </View>
      {loading && !has ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !has ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Set a goal to see check-ins and progress here.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data!.onTrackCount}
            <Text style={[styles.heroUnit, { color: textSecondary }]}>
              {' '}
              / {data!.activeGoals} on track
            </Text>
          </Text>
          <Text style={[styles.barLab, { color: textPrimary }]}>Avg progress</Text>
          <HBar pct={data!.avgCompletionPct ?? 0} color="#EC4899" />
          <Text style={[styles.sub, { color: textSecondary, marginTop: 10 }]}>
            {data!.checkInsThisWeek} check-ins this week
          </Text>
        </>
      )}
    </View>
  );
};

const PILLAR_COLORS = {
  strength_fitness: '#F87171',
  growth_wisdom: '#60A5FA',
  discipline: '#FBBF24',
  team_spirit: '#34D399',
};

export const PillarsInsightPanel: React.FC<
  PanelTheme & { data: PillarsInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const pillars = data
    ? [
        { key: 'strength_fitness', label: 'Strength', pct: data.strength_fitness },
        { key: 'growth_wisdom', label: 'Growth', pct: data.growth_wisdom },
        { key: 'discipline', label: 'Discipline', pct: data.discipline },
        { key: 'team_spirit', label: 'Team', pct: data.team_spirit },
      ]
    : [];

  return (
    <View style={[styles.card, { backgroundColor: '#FEF9C3' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Pillars</Text>
        <MetaBadge label="Journey" />
      </View>
      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !data ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Pillar progress will show once your journey starts.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data.overall}
            <Text style={[styles.heroUnit, { color: textSecondary }]}>% overall</Text>
          </Text>
          {data.weakest ? (
            <Text style={[styles.sub, { color: textSecondary }]}>
              Weakest: {data.weakest} ({data.weakestPct}%)
            </Text>
          ) : null}
          <View style={styles.pillarBars}>
            {pillars.map((p) => (
              <View key={p.key} style={styles.pillarRow}>
                <View style={styles.pillarTop}>
                  <Text style={[styles.barLab, { color: textPrimary }]}>{p.label}</Text>
                  <Text style={[styles.barLab, { color: textPrimary }]}>{p.pct}%</Text>
                </View>
                <HBar
                  pct={p.pct}
                  color={PILLAR_COLORS[p.key as keyof typeof PILLAR_COLORS]}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export const LoginInsightPanel: React.FC<
  PanelTheme & { data: LoginInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const has = !!data && (data.currentStreak > 0 || data.longestStreak > 0);
  const blocks = Math.min(14, Math.max(data?.currentStreak ?? 0, 0));

  return (
    <View style={[styles.card, { backgroundColor: '#CFFAFE' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Login streak</Text>
        <MetaBadge label="App rhythm" />
      </View>
      {loading && !has ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !has ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Open the app daily to build a login streak.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data!.currentStreak}
            <Text style={[styles.heroUnit, { color: textSecondary }]}> days</Text>
          </Text>
          <Text style={[styles.sub, { color: textSecondary }]}>
            Best {data!.longestStreak} days
          </Text>
          <View style={styles.dotRow}>
            {Array.from({ length: 14 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < blocks ? '#06B6D4' : 'rgba(255,255,255,0.55)',
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

export const ChallengesInsightPanel: React.FC<
  PanelTheme & { data: ChallengesInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const has = !!data && data.activeCount > 0;
  return (
    <View style={[styles.card, { backgroundColor: '#FEE2E2' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Challenges</Text>
        <MetaBadge label="Active" />
      </View>
      {loading && !has ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !has ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Join a challenge to track completion and missed days.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data!.avgCompletionPct != null ? data!.avgCompletionPct : 0}
            <Text style={[styles.heroUnit, { color: textSecondary }]}>% avg</Text>
          </Text>
          <HBar pct={data!.avgCompletionPct ?? 0} color="#F87171" />
          <View style={styles.statStrip}>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.activeCount}
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>active</Text>
            </View>
            <View style={styles.stripItem}>
              <Text style={[styles.stripVal, { color: textPrimary }]}>
                {data!.totalDaysMissed}
              </Text>
              <Text style={[styles.stripLab, { color: textSecondary }]}>missed</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export const ScreenTimeInsightPanel: React.FC<
  PanelTheme & { data: ScreenTimeInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const hours = data?.dailyHours || [];
  const max = Math.max(...hours, 1);

  return (
    <View style={[styles.card, { backgroundColor: '#F1F5F9' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Screen time</Text>
        <MetaBadge label="Last 7 days" />
      </View>
      {loading && !data?.hasData ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !data?.hasData ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Log screen time in Action to replace the chart mock with real averages.
        </Text>
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data.averageHours != null ? data.averageHours : '—'}
            <Text style={[styles.heroUnit, { color: textSecondary }]}>h avg</Text>
          </Text>
          <View style={styles.miniBars}>
            {hours.map((h, i) => (
              <View key={i} style={styles.miniCol}>
                <View style={styles.miniTrack}>
                  <View
                    style={[
                      styles.miniFill,
                      {
                        height: `${Math.max(8, (h / max) * 100)}%`,
                        backgroundColor: h > 5 ? '#F87171' : '#34D399',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
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
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '600' },
  badge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
  hero: { fontSize: 32, fontWeight: '700' },
  heroUnit: { fontSize: 16, fontWeight: '500' },
  sub: { fontSize: 13, marginTop: 2, marginBottom: 10 },
  empty: { fontSize: 13, lineHeight: 18 },
  barLab: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  hTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  hFill: { height: '100%', borderRadius: 6 },
  statStrip: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  stripItem: { flex: 1, alignItems: 'center' },
  stripVal: { fontSize: 16, fontWeight: '700' },
  stripLab: { fontSize: 10, marginTop: 2 },
  pillarBars: { gap: 10, marginTop: 10 },
  pillarRow: { gap: 4 },
  pillarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  miniBars: {
    flexDirection: 'row',
    height: 72,
    gap: 6,
    marginTop: 12,
  },
  miniCol: { flex: 1, justifyContent: 'flex-end' },
  miniTrack: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  miniFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 6,
  },
});
