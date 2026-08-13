import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { pointsService, LEVEL_TITLES, UserPointsDaily } from '../lib/pointsService';
import { pillarProgressService, PillarProgressMap, PillarType } from '../lib/pillarProgressService';
import { notificationService, Notification } from '../lib/notificationService';
import LevelInfoModal from '../components/LevelInfoModal';

const ACTIVE_GREEN = '#10B981';

type PillarActiveMap = Record<keyof PillarProgressMap, boolean>;

async function getStartOfDayPillars(
  userId: string,
  progress: PillarProgressMap
): Promise<PillarProgressMap> {
  const today = new Date().toISOString().split('T')[0];
  const startOfDayKey = `pillar_progress_start_of_day_${userId}`;
  const startOfDayDateKey = `pillar_progress_start_of_day_date_${userId}`;
  const storedStartOfDayDate = await AsyncStorage.getItem(startOfDayDateKey);
  const storedStartOfDayProgress = await AsyncStorage.getItem(startOfDayKey);

  let startOfDayProgress = progress;

  if (storedStartOfDayDate === today && storedStartOfDayProgress) {
    try {
      const parsedSnapshot = JSON.parse(storedStartOfDayProgress) as PillarProgressMap;
      const isInvalid = (Object.keys(parsedSnapshot) as (keyof PillarProgressMap)[]).some(
        (key) => parsedSnapshot[key] > progress[key]
      );
      if (!isInvalid) {
        startOfDayProgress = parsedSnapshot;
      }
    } catch {
      // keep current progress as baseline
    }
  }

  return startOfDayProgress;
}

async function getPillarsActiveToday(
  userId: string,
  progress: PillarProgressMap
): Promise<PillarActiveMap> {
  const startOfDayProgress = await getStartOfDayPillars(userId, progress);

  const indicators = {
    strength_fitness: false,
    growth_wisdom: false,
    discipline: false,
    team_spirit: false,
    overall: false,
  } as PillarActiveMap;

  (Object.keys(indicators) as (keyof PillarProgressMap)[]).forEach((key) => {
    if (progress[key] > startOfDayProgress[key]) {
      indicators[key] = true;
    }
  });

  return indicators;
}

const PILLARS: {
  key: Exclude<PillarType, 'overall'>;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  sources: string;
}[] = [
  {
    key: 'strength_fitness',
    label: 'Strength & Fitness',
    icon: 'dumbbell',
    sources: 'Gym, run/walk, water, cold shower',
  },
  {
    key: 'growth_wisdom',
    label: 'Growth & Wisdom',
    icon: 'brain',
    sources: 'Reflect, focus, meditation, microlearn',
  },
  {
    key: 'discipline',
    label: 'Discipline',
    icon: 'lock',
    sources: 'Sleep, update goal, screen time',
  },
  {
    key: 'team_spirit',
    label: 'Team Spirit',
    icon: 'star',
    sources: 'Likes, comments, shares',
  },
];

const HABIT_LABELS: Record<string, string> = {
  gym: 'Gym',
  run: 'Run / Walk',
  cold_shower: 'Cold shower',
  water: 'Water',
  reflect: 'Reflect',
  focus: 'Focus',
  sleep: 'Sleep',
  meditation: 'Meditation',
  microlearn: 'Microlearn',
  like: 'Like',
  comment: 'Comment',
  share: 'Share',
  update_goal: 'Update goal',
  screen_time: 'Screen time',
};

const HABIT_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  gym: 'barbell',
  run: 'walk',
  cold_shower: 'snow',
  water: 'water-outline',
  reflect: 'journal',
  focus: 'eye-outline',
  sleep: 'moon',
  meditation: 'leaf',
  microlearn: 'book-outline',
  like: 'heart',
  comment: 'chatbubble',
  share: 'share-social',
  update_goal: 'trophy',
};

const PILLAR_NAMES: Record<string, string> = {
  strength_fitness: 'Strength & Fitness',
  growth_wisdom: 'Growth & Wisdom',
  discipline: 'Discipline',
  team_spirit: 'Team Spirit',
};

function formatHabitLabel(habitType?: string | null) {
  if (!habitType) return 'Habit reward';
  return HABIT_LABELS[habitType] || habitType.replace(/_/g, ' ');
}

function formatDayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getTimeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function sourcesFromDay(row: UserPointsDaily): string[] {
  const sources: string[] = [];
  if (row.gym_completed) sources.push('Gym');
  if (row.run_completed) sources.push('Run');
  if (row.water_completed) sources.push('Water');
  if (row.cold_shower_completed) sources.push('Cold shower');
  if (row.sleep_completed) sources.push('Sleep');
  if (row.reflect_completed) sources.push('Reflect');
  if (row.meditation_completed) sources.push('Meditation');
  if (row.microlearn_completed) sources.push('Microlearn');
  if (row.liked_today) sources.push('Like');
  if (row.commented_today) sources.push('Comment');
  if (row.shared_today) sources.push('Share');
  if (row.updated_goal_today) sources.push('Goal update');
  if (row.bonus_points > 0) sources.push('All-habits bonus');
  return sources;
}

export default function ProfileStatsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [todayBreakdown, setTodayBreakdown] = useState({ daily: 0, core: 0, bonus: 0, total: 0 });
  const [pillars, setPillars] = useState<PillarProgressMap>({
    strength_fitness: 0,
    growth_wisdom: 0,
    discipline: 0,
    team_spirit: 0,
    overall: 0,
  });
  const [pillarsActiveToday, setPillarsActiveToday] = useState<PillarActiveMap>({
    strength_fitness: false,
    growth_wisdom: false,
    discipline: false,
    team_spirit: false,
    overall: false,
  });
  const [startOfWeekPillars, setStartOfWeekPillars] = useState<PillarProgressMap>({
    strength_fitness: 0,
    growth_wisdom: 0,
    discipline: 0,
    team_spirit: 0,
    overall: 0,
  });
  const [weekPillarGains, setWeekPillarGains] = useState<PillarProgressMap>({
    strength_fitness: 0,
    growth_wisdom: 0,
    discipline: 0,
    team_spirit: 0,
    overall: 0,
  });
  const [rewards, setRewards] = useState<Notification[]>([]);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [dailyRows, setDailyRows] = useState<UserPointsDaily[]>([]);

  const levelProgress = useMemo(
    () => pointsService.getLevelProgress(totalPoints),
    [totalPoints]
  );
  const levelTitle = LEVEL_TITLES[levelProgress.currentLevel - 1] || 'Beginner';
  const levelFill = useMemo(() => {
    if (levelProgress.currentLevel >= 8) return 1;
    const span =
      levelProgress.pointsInCurrentLevel + levelProgress.pointsNeededForNext;
    if (span <= 0) return 1;
    return Math.min(1, Math.max(0, levelProgress.pointsInCurrentLevel / span));
  }, [levelProgress]);

  const dayDeltas = useMemo(() => {
    // Compare each day to the next older day in the list to show gained/lost vs previous logged day
    const sorted = [...dailyRows].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.map((row, index) => {
      const older = sorted[index + 1];
      const delta = older ? row.total_points_today - older.total_points_today : null;
      return { row, delta };
    });
  }, [dailyRows]);

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [points, today, pillarMap, rewardHistory, recentDays] = await Promise.all([
        pointsService.getTotalPoints(user.id),
        pointsService.getTodaysPoints(user.id),
        pillarProgressService.getPillarProgress(user.id),
        notificationService.getHabitRewardHistory(user.id, 100, 14),
        pointsService.getRecentDailyBreakdown(user.id, 14),
      ]);
      setTotalPoints(points);
      setTodayBreakdown(today);
      setPillars(pillarMap);
      const weekGains = await pillarProgressService.getThisWeeksPillarGains(user.id);
      const weekBaselines = pillarProgressService.getStartOfWeekBaselines(pillarMap, weekGains);
      const todayStr = new Date().toISOString().split('T')[0];
      const weekStart = pillarProgressService.getWeekStartDate(todayStr);
      await AsyncStorage.setItem(`pillar_progress_start_of_week_${user.id}`, JSON.stringify(weekBaselines));
      await AsyncStorage.setItem(`pillar_progress_start_of_week_date_${user.id}`, weekStart);
      setWeekPillarGains(weekGains);
      setStartOfWeekPillars(weekBaselines);
      setPillarsActiveToday(await getPillarsActiveToday(user.id, pillarMap));
      setRewards(rewardHistory);
      setDailyRows(recentDays);
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStats();
    }, [loadStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <CustomBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>EXP & Stats</Text>
          <TouchableOpacity onPress={() => setShowLevelModal(true)} style={styles.backButton}>
            <Ionicons name="information-circle-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.textPrimary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: bottomNavPadding + 32 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textPrimary} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Overall EXP + overall score */}
            <View style={[styles.card, { borderColor: theme.border }]}>
              <View style={styles.overallScoreRow}>
                <Text style={[styles.cardEyebrow, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Overall
                </Text>
                <View
                  style={[
                    styles.overallScoreBadge,
                    {
                      backgroundColor: pillarsActiveToday.overall ? ACTIVE_GREEN : theme.textPrimary,
                    },
                  ]}
                >
                  <Text style={styles.overallScoreBadgeText}>
                    {Math.floor(pillars.overall || 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.levelRow}>
                <Text style={[styles.levelTitle, { color: theme.textPrimary }]}>
                  Level {levelProgress.currentLevel} · {levelTitle}
                </Text>
                <Text style={[styles.expTotal, { color: theme.textPrimary }]}>{totalPoints} EXP</Text>
              </View>
              <View style={[styles.levelTrack, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                <View
                  style={[
                    styles.levelFill,
                    { width: `${Math.round(levelFill * 100)}%`, backgroundColor: theme.textPrimary },
                  ]}
                />
              </View>
              <Text style={[styles.levelHint, { color: theme.textSecondary }]}>
                {levelProgress.currentLevel >= 8
                  ? 'Max level reached'
                  : `${levelProgress.pointsNeededForNext} EXP to Level ${levelProgress.nextLevel}`}
              </Text>

              <View style={styles.todayGrid}>
                <View style={styles.todayCell}>
                  <Text style={[styles.todayValue, { color: theme.textPrimary }]}>{todayBreakdown.daily}</Text>
                  <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>Habits today</Text>
                </View>
                <View style={styles.todayCell}>
                  <Text style={[styles.todayValue, { color: theme.textPrimary }]}>{todayBreakdown.core}</Text>
                  <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>Social / goals</Text>
                </View>
                <View style={styles.todayCell}>
                  <Text style={[styles.todayValue, { color: theme.textPrimary }]}>{todayBreakdown.bonus}</Text>
                  <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>Bonus</Text>
                </View>
                <View style={styles.todayCell}>
                  <Text style={[styles.todayValue, { color: theme.textPrimary }]}>{todayBreakdown.total}</Text>
                  <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>Today total</Text>
                </View>
              </View>
            </View>

            {/* Pillars */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pillars</Text>
            <View style={[styles.card, { borderColor: theme.border, paddingVertical: 8 }]}>
              {PILLARS.map((pillar) => {
                const value = pillars[pillar.key] || 0;
                const isActiveToday = !!pillarsActiveToday[pillar.key];
                const accent = isActiveToday ? ACTIVE_GREEN : theme.textPrimary;
                const pct = Math.max(0, Math.min(100, value));
                const weekGainPct = Math.max(0, weekPillarGains[pillar.key] || 0);
                const growthPct = Math.min(weekGainPct, pct);
                const startPct = Math.max(0, pct - growthPct);
                const priorShareInFill = pct > 0 ? startPct / pct : 1;
                return (
                  <View key={pillar.key} style={styles.pillarRow}>
                    <View style={[styles.pillarIcon, { backgroundColor: `${accent}14` }]}>
                      <FontAwesome5
                        name={pillar.icon}
                        size={14}
                        color={accent}
                        solid={pillar.key === 'team_spirit'}
                      />
                    </View>
                    <View style={styles.pillarBody}>
                      <View style={styles.pillarHeader}>
                        <View style={styles.pillarLabelRow}>
                          <Text style={[styles.pillarLabel, { color: theme.textPrimary }]}>
                            {pillar.label}
                          </Text>
                          {isActiveToday && (
                            <View style={styles.todayBadge}>
                              <FontAwesome5 name="arrow-up" size={9} color={ACTIVE_GREEN} />
                              <Text style={styles.todayBadgeText}>Today</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.pillarValue, { color: accent }]}>
                          {value.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={[styles.pillarTrack, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                        {pct > 0 ? (
                          <View style={[styles.pillarFillShell, { width: `${pct}%` }]}>
                            {growthPct > 0 ? <View style={styles.pillarGrowthTip} /> : null}
                            {priorShareInFill > 0 ? (
                              <View
                                style={[
                                  styles.pillarPriorFill,
                                  {
                                    width: growthPct > 0 ? `${priorShareInFill * 100}%` : '100%',
                                    backgroundColor: theme.textPrimary,
                                  },
                                ]}
                              />
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.pillarSources, { color: theme.textSecondary }]}>
                        {pillar.sources}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {(() => {
                const overallValue = pillars.overall || 0;
                const overallActive = !!pillarsActiveToday.overall;
                const overallAccent = overallActive ? ACTIVE_GREEN : theme.textPrimary;
                const pct = Math.max(0, Math.min(100, overallValue));
                const weekGainPct = Math.max(0, weekPillarGains.overall || 0);
                const growthPct = Math.min(weekGainPct, pct);
                const startPct = Math.max(0, pct - growthPct);
                const priorShareInFill = pct > 0 ? startPct / pct : 1;
                return (
                  <View style={[styles.pillarRow, styles.overallPillar, { borderTopColor: theme.border }]}>
                    <View style={[styles.pillarIcon, { backgroundColor: `${overallAccent}14` }]}>
                      <FontAwesome5 name="fire" size={14} color={overallAccent} />
                    </View>
                    <View style={styles.pillarBody}>
                      <View style={styles.pillarHeader}>
                        <View style={styles.pillarLabelRow}>
                          <Text style={[styles.pillarLabel, { color: theme.textPrimary }]}>Overall</Text>
                          {overallActive && (
                            <View style={styles.todayBadge}>
                              <FontAwesome5 name="arrow-up" size={9} color={ACTIVE_GREEN} />
                              <Text style={styles.todayBadgeText}>Today</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.pillarValue, { color: overallAccent }]}>
                          {overallValue.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={[styles.pillarTrack, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                        {pct > 0 ? (
                          <View style={[styles.pillarFillShell, { width: `${pct}%` }]}>
                            {growthPct > 0 ? <View style={styles.pillarGrowthTip} /> : null}
                            {priorShareInFill > 0 ? (
                              <View
                                style={[
                                  styles.pillarPriorFill,
                                  {
                                    width: growthPct > 0 ? `${priorShareInFill * 100}%` : '100%',
                                    backgroundColor: theme.textPrimary,
                                  },
                                ]}
                              />
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.pillarSources, { color: theme.textSecondary }]}>
                        Average of all four pillars
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Recent EXP events */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent EXP</Text>
            <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
              Gains from the last 14 days. Uncompleting a habit removes that day’s reward from your total.
            </Text>
            <View style={[styles.card, { borderColor: theme.border, paddingVertical: 4 }]}>
              {rewards.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No recent EXP rewards yet. Complete habits to see them here.
                </Text>
              ) : (
                <>
                  {(showAllRewards ? rewards : rewards.slice(0, 4)).map((item) => {
                    const points = item.points_gained ?? 0;
                    const isGain = points >= 0;
                    return (
                      <View key={item.id} style={styles.eventRow}>
                        <View
                          style={[
                            styles.eventIcon,
                            { backgroundColor: isGain ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' },
                          ]}
                        >
                          <Ionicons
                            name={HABIT_ICONS[item.habit_type || ''] || 'flash'}
                            size={18}
                            color={isGain ? '#059669' : '#DC2626'}
                          />
                        </View>
                        <View style={styles.eventBody}>
                          <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>
                            {formatHabitLabel(item.habit_type)}
                          </Text>
                          <Text style={[styles.eventSubtitle, { color: theme.textSecondary }]}>
                            {item.pillar_type
                              ? `${PILLAR_NAMES[item.pillar_type] || item.pillar_type}${
                                  item.pillar_progress != null ? ` · +${item.pillar_progress}%` : ''
                                }`
                              : 'EXP reward'}
                            {' · '}
                            {getTimeAgo(item.created_at)}
                          </Text>
                        </View>
                        <Text style={[styles.eventPoints, { color: isGain ? '#059669' : '#DC2626' }]}>
                          {isGain ? '+' : ''}
                          {points}
                        </Text>
                      </View>
                    );
                  })}
                  {rewards.length > 4 && (
                    <TouchableOpacity
                      style={styles.seeMoreButton}
                      onPress={() => setShowAllRewards((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.seeMoreText, { color: theme.textPrimary }]}>
                        {showAllRewards ? 'Show less' : `See more (${rewards.length - 4})`}
                      </Text>
                      <Ionicons
                        name={showAllRewards ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.textPrimary}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Daily history */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily breakdown</Text>
            <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
              Last 14 days max. Delta compares to the previous logged day.
            </Text>
            <View style={[styles.card, { borderColor: theme.border, paddingVertical: 4 }]}>
              {dayDeltas.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No daily EXP history yet.
                </Text>
              ) : (
                <>
                  {(showAllDays ? dayDeltas : dayDeltas.slice(0, 4)).map(({ row, delta }) => {
                    const sources = sourcesFromDay(row);
                    return (
                      <View key={row.date} style={styles.dayRow}>
                        <View style={styles.dayHeader}>
                          <Text style={[styles.dayDate, { color: theme.textPrimary }]}>
                            {formatDayLabel(row.date)}
                          </Text>
                          <View style={styles.dayMeta}>
                            {delta != null && (
                              <Text
                                style={[
                                  styles.dayDelta,
                                  { color: delta >= 0 ? '#059669' : '#DC2626' },
                                ]}
                              >
                                {delta >= 0 ? '+' : ''}
                                {delta}
                              </Text>
                            )}
                            <Text style={[styles.dayTotal, { color: theme.textPrimary }]}>
                              {row.total_points_today} EXP
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.daySources, { color: theme.textSecondary }]}>
                          {sources.length > 0 ? sources.join(' · ') : 'No sources logged'}
                        </Text>
                        <Text style={[styles.daySplit, { color: theme.textSecondary }]}>
                          Habits {row.daily_habits_points} · Social {row.core_habits_points} · Bonus{' '}
                          {row.bonus_points}
                        </Text>
                      </View>
                    );
                  })}
                  {dayDeltas.length > 4 && (
                    <TouchableOpacity
                      style={styles.seeMoreButton}
                      onPress={() => setShowAllDays((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.seeMoreText, { color: theme.textPrimary }]}>
                        {showAllDays ? 'Show less' : `See more (${dayDeltas.length - 4})`}
                      </Text>
                      <Ionicons
                        name={showAllDays ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.textPrimary}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        )}

        <LevelInfoModal
          visible={showLevelModal}
          onClose={() => setShowLevelModal(false)}
          currentLevel={levelProgress.currentLevel}
          totalPoints={totalPoints}
        />
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  overallScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overallScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  overallScoreBadgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    gap: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  expTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  levelTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 999,
  },
  levelHint: {
    marginTop: 8,
    fontSize: 13,
  },
  todayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  todayCell: {
    width: '47%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  todayValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  todayLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  pillarRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  pillarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pillarBody: { flex: 1 },
  pillarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pillarLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  pillarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ACTIVE_GREEN,
  },
  pillarValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  pillarTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pillarFillShell: {
    height: '100%',
    position: 'relative',
  },
  pillarGrowthTip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 999,
    zIndex: 1,
  },
  pillarPriorFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    zIndex: 2,
  },
  pillarFill: {
    height: '100%',
    borderRadius: 999,
  },
  pillarSources: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  overallPillar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    paddingTop: 14,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 16,
    textAlign: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBody: { flex: 1 },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  eventSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  eventPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayRow: {
    paddingVertical: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayDelta: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  daySources: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  daySplit: {
    fontSize: 12,
    marginTop: 2,
  },
});
