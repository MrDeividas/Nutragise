import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type {
  AchievementMoment,
  WeekdayInsight,
  ColdShowerInsight,
  PartnerAccountabilityInsight,
  Stage4Dashboard,
} from '../lib/stage4InsightService';

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

const MOMENT_COLORS = ['#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3'];

export const AchievementMomentsPanel: React.FC<
  PanelTheme & { data: AchievementMoment[] | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const items = data || [];
  return (
    <View style={[styles.card, { backgroundColor: '#FFF7ED' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Moments</Text>
        <MetaBadge label="Unlocked" />
      </View>
      {loading && items.length === 0 ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Keep logging habits — streaks, sleep weeks, and correlations show up here.
        </Text>
      ) : (
        <View style={styles.moments}>
          {items.map((m, i) => (
            <View
              key={m.id}
              style={[
                styles.momentCard,
                { backgroundColor: MOMENT_COLORS[i % MOMENT_COLORS.length] },
              ]}
            >
              <Text style={[styles.momentTitle, { color: textPrimary }]}>{m.title}</Text>
              <Text style={[styles.momentMsg, { color: textSecondary }]}>{m.message}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const WeekdayInsightPanel: React.FC<
  PanelTheme & { data: WeekdayInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const full = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const bestIdx = data?.bestDay
    ? full.findIndex((d) => d.toLowerCase() === data.bestDay!.toLowerCase())
    : -1;
  const worstIdx = data?.worstDay
    ? full.findIndex((d) => d.toLowerCase() === data.worstDay!.toLowerCase())
    : -1;

  return (
    <View style={[styles.card, { backgroundColor: '#E0F2FE' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Best & worst day</Text>
        <MetaBadge label="28 days" />
      </View>
      {loading && !data?.bestDay ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !data?.bestDay && !data?.worstDay ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Need more habit days to find your best and worst weekdays.
        </Text>
      ) : (
        <>
          <View style={styles.dayStrip}>
            {days.map((d, i) => {
              const isBest = i === bestIdx;
              const isWorst = i === worstIdx;
              return (
                <View
                  key={d}
                  style={[
                    styles.dayCell,
                    isBest && { backgroundColor: '#34D399' },
                    isWorst && !isBest && { backgroundColor: '#FCA5A5' },
                    !isBest && !isWorst && { backgroundColor: 'rgba(255,255,255,0.65)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isBest || isWorst ? '#111827' : textSecondary,
                        fontWeight: isBest || isWorst ? '700' : '500',
                      },
                    ]}
                  >
                    {d}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={[styles.big, { color: textPrimary }]}>
                {data?.bestDay ? `${data.bestDay}s` : '—'}
              </Text>
              <Text style={[styles.label, { color: textSecondary }]}>Best</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowItem}>
              <Text style={[styles.big, { color: textPrimary }]}>
                {data?.worstDay ? `${data.worstDay}s` : '—'}
              </Text>
              <Text style={[styles.label, { color: textSecondary }]}>Needs work</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowItem}>
              <Text style={[styles.big, { color: textPrimary }]}>
                {data?.overallConsistency ?? 0}%
              </Text>
              <Text style={[styles.label, { color: textSecondary }]}>Consistency</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export const ColdShowerRatePanel: React.FC<
  PanelTheme & { data: ColdShowerInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const pct = data?.completionPct ?? 0;
  return (
    <View style={[styles.card, { backgroundColor: '#CFFAFE' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Cold shower</Text>
        <MetaBadge label="This week" />
      </View>
      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : (
        <>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {pct}
            <Text style={[styles.heroUnit, { color: textSecondary }]}>%</Text>
          </Text>
          <HBar pct={pct} color="#22D3EE" />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={[styles.big, { color: textPrimary }]}>
                {data?.completedDays ?? 0}/{data?.daysInPeriod ?? 0}
              </Text>
              <Text style={[styles.label, { color: textSecondary }]}>Days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowItem}>
              <Text style={[styles.big, { color: textPrimary }]}>{data?.streak ?? 0}</Text>
              <Text style={[styles.label, { color: textSecondary }]}>Streak</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export const PartnerAccountabilityPanel: React.FC<
  PanelTheme & { data: PartnerAccountabilityInsight | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  if (!loading && !data?.hasPartner) return null;

  return (
    <View style={[styles.card, { backgroundColor: '#DCFCE7' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Partner</Text>
        <MetaBadge label={data?.partnerName || 'Together'} />
      </View>
      {loading && !data ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : !data ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Invite a habit partner to track shared streaks.
        </Text>
      ) : (
        <>
          <Text style={[styles.sub, { color: textSecondary }]}>
            {data.habitLabel || 'Shared habit'}
          </Text>
          <Text style={[styles.hero, { color: textPrimary }]}>
            {data.sharedStreak}
            <Text style={[styles.heroUnit, { color: textSecondary }]}> shared streak</Text>
          </Text>
          <HBar pct={data.winRate ?? 0} color="#22C55E" />
          <Text style={[styles.sub, { color: textSecondary, marginTop: 8 }]}>
            Both done {data.winRate != null ? `${data.winRate}%` : '—'} · {data.bothCompletedDays}{' '}
            shared days
          </Text>
        </>
      )}
    </View>
  );
};

export const CorrelationNumbersPanel: React.FC<
  PanelTheme & { data: Stage4Dashboard['correlations'] | null; loading?: boolean }
> = ({ data, loading, textPrimary, textSecondary }) => {
  const items = data || [];
  return (
    <View style={[styles.card, { backgroundColor: '#FEF3C7' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Correlations</Text>
        <MetaBadge label="r values" />
      </View>
      {loading && items.length === 0 ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { color: textSecondary }]}>
          Need ~5 days with sleep + mood/energy to unlock correlation numbers.
        </Text>
      ) : (
        <View style={styles.corrList}>
          {items.map((c, i) => {
            const abs = Math.abs(c.coefficient);
            const barPct = abs * 100;
            const color = c.coefficient >= 0 ? '#34D399' : '#F87171';
            return (
              <View key={`${c.title}-${i}`} style={styles.corrCard}>
                <View style={styles.corrTop}>
                  <Text style={[styles.corrTitle, { color: textPrimary }]}>{c.title}</Text>
                  <Text style={[styles.corrR, { color }]}>
                    {c.coefficient > 0 ? '+' : ''}
                    {c.coefficient.toFixed(2)}
                  </Text>
                </View>
                <HBar pct={barPct} color={color} />
                <Text style={[styles.corrMeta, { color: textSecondary }]}>
                  {c.strength} · {c.dataPoints}d · {c.description}
                </Text>
              </View>
            );
          })}
        </View>
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
  empty: { fontSize: 13, lineHeight: 18 },
  hero: { fontSize: 32, fontWeight: '700' },
  heroUnit: { fontSize: 16, fontWeight: '500' },
  sub: { fontSize: 13, marginBottom: 8 },
  hTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  hFill: { height: '100%', borderRadius: 6 },
  moments: { gap: 8 },
  momentCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  momentTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  momentMsg: { fontSize: 13, lineHeight: 18 },
  dayStrip: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  dayCell: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  dayText: { fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  rowItem: { flex: 1, alignItems: 'center' },
  big: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 11, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(128,128,128,0.2)' },
  corrList: { gap: 10 },
  corrCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  corrTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  corrTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  corrR: { fontSize: 18, fontWeight: '700' },
  corrMeta: { fontSize: 11, lineHeight: 15 },
});
