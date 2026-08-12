import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import CustomBackground from '../components/CustomBackground';
import AchievementBadge from '../components/AchievementBadge';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import {
  achievementsService,
  BadgeWithStatus,
  TOTAL_ACHIEVEMENTS,
} from '../lib/achievementsService';
import { AchievementCriteria } from '../lib/achievementDefinitions';

const COLS = 3;
const GAP = 12;
const SCREEN_W = Dimensions.get('window').width;
const CELL = (SCREEN_W - 48 - GAP * (COLS - 1)) / COLS;

type Filter = 'all' | 'unlocked' | 'locked';

function howToObtain(criteria: AchievementCriteria, fallback: string): string {
  switch (criteria.type) {
    case 'habit_completions': {
      const name = criteria.habit.replace(/_/g, ' ');
      return criteria.count === 1
        ? `Complete the ${name} habit once.`
        : `Complete the ${name} habit ${criteria.count} times.`;
    }
    case 'custom_habit_completions':
      return criteria.count === 1
        ? 'Complete any custom habit once.'
        : `Complete custom habits ${criteria.count} times.`;
    case 'streak_days':
      return `Keep any habit streak going for ${criteria.count} days.`;
    case 'weekend_warrior':
      return 'Complete at least one habit on both Saturday and Sunday in the same week.';
    case 'perfect_day':
      return `Complete ${criteria.minHabits} or more habits in a single day.`;
    case 'perfect_week':
      return 'Complete at least one habit every day for 7 days in a row.';
    case 'comeback_kid':
      return `Come back and complete a habit after ${criteria.gapDays}+ days away.`;
    case 'posts_count':
      return criteria.count === 1
        ? 'Create your first journey post.'
        : `Create ${criteria.count} journey posts.`;
    case 'photos_count':
      return `Upload ${criteria.count} photos to your journey posts.`;
    case 'captioned_posts':
      return `Add captions to ${criteria.count} journey posts.`;
    case 'habit_showcase_post':
      return `Share a post that includes ${criteria.minHabits}+ completed habits.`;
    case 'post_distinct_dates':
      return `Post on ${criteria.count} different days.`;
    case 'public_post':
      return 'Make a public journey post.';
    case 'early_bird_post':
      return 'Create a journey post before 9am.';
    case 'following_count':
      return criteria.count === 1
        ? 'Follow someone.'
        : `Follow ${criteria.count} people.`;
    case 'followers_count':
      return criteria.count === 1
        ? 'Get your first follower.'
        : `Reach ${criteria.count} followers.`;
    case 'habit_invites_sent':
      return 'Send a habit accountability invite.';
    case 'partnerships_accepted':
      return criteria.count === 1
        ? 'Get an accepted habit partnership.'
        : `Have ${criteria.count} accepted habit partnerships.`;
    case 'nudges_sent':
      return criteria.count === 1
        ? 'Send a nudge to a habit partner.'
        : `Send ${criteria.count} nudges to habit partners.`;
    case 'likes_given':
      return criteria.count === 1
        ? 'Like a community post.'
        : `Like ${criteria.count} community posts.`;
    case 'comments_made':
      return `Leave ${criteria.count} comments on posts.`;
    case 'challenges_joined':
      return criteria.count === 1
        ? 'Join a challenge.'
        : `Join ${criteria.count} challenges.`;
    case 'challenges_completed':
      return criteria.count === 1
        ? 'Finish a challenge.'
        : `Finish ${criteria.count} challenges.`;
    case 'challenges_won':
      return criteria.count === 1
        ? 'Win a challenge.'
        : `Win ${criteria.count} challenges.`;
    case 'challenge_proofs':
      return criteria.count === 1
        ? 'Submit your first challenge proof.'
        : `Submit ${criteria.count} challenge proofs.`;
    case 'challenge_daily':
      return 'Join a daily recurring challenge.';
    case 'challenge_weekly':
      return 'Join a weekly challenge.';
    case 'challenge_paid':
      return 'Join a paid / entry-fee challenge.';
    case 'challenge_team':
      return `Join a challenge with ${criteria.minParticipants}+ participants.`;
    case 'challenge_rejoin':
      return 'Leave a challenge, then rejoin it later.';
    case 'challenge_clean_sheet':
      return 'Finish a challenge with 100% completion.';
    case 'level':
      return `Reach level ${criteria.min}.`;
    case 'total_exp':
      return `Earn ${criteria.min.toLocaleString()} EXP in total.`;
    case 'pillar_any':
      return `Get any pillar to ${criteria.minPercent}% or higher.`;
    case 'pillar_all':
      return `Get all four pillars to ${criteria.minPercent}% or higher.`;
    case 'profile_exists':
      return 'Finish onboarding and start using Nutrapp.';
    case 'active_days':
      return `Be active on ${criteria.count} different days.`;
    case 'custom_habits_created':
      return 'Create a custom habit.';
    case 'flag':
      if (criteria.key === 'insights_opened') return 'Open the Insights tab.';
      if (criteria.key === 'pro_modal_opened') return 'Open the Upgrade to Pro screen.';
      return fallback;
    case 'is_pro':
      return 'Become a Nutrapp Pro member.';
    default:
      return fallback;
  }
}

export default function AchievementsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const targetUserId: string = route.params?.userId || user?.id;
  const readOnly = !!route.params?.userId && route.params.userId !== user?.id;

  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<BadgeWithStatus | null>(null);
  /** Temporarily pin a newly unlocked achievement to the front with a NEW label */
  const [pinnedNewId, setPinnedNewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      if (!readOnly) {
        await achievementsService.evaluateAndUnlock(targetUserId);
      }
      const list = await achievementsService.getBadgesWithStatus(targetUserId);
      setBadges(list);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, readOnly]);

  useFocusEffect(
    useCallback(() => {
      load();

      const highlightId: string | undefined = route.params?.highlightId;
      if (highlightId) {
        setPinnedNewId(highlightId);
        setFilter('all');
        const clearPin = setTimeout(() => setPinnedNewId(null), 8000);
        // Clear param so revisiting the screen doesn't re-pin forever
        navigation.setParams?.({ highlightId: undefined });
        return () => clearTimeout(clearPin);
      }
    }, [load, route.params?.highlightId, navigation])
  );

  const unlockedCount = useMemo(() => badges.filter((b) => b.unlocked).length, [badges]);

  const visible = useMemo(() => {
    let list =
      filter === 'unlocked'
        ? badges.filter((b) => b.unlocked)
        : filter === 'locked'
          ? badges.filter((b) => !b.unlocked)
          : badges;

    if (pinnedNewId) {
      const pinned = list.find((b) => b.id === pinnedNewId);
      if (pinned) {
        list = [pinned, ...list.filter((b) => b.id !== pinnedNewId)];
      }
    }

    return list;
  }, [badges, filter, pinnedNewId]);

  return (
    <CustomBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Achievements</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {unlockedCount}/{TOTAL_ACHIEVEMENTS} unlocked
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filters}>
          {(['all', 'unlocked', 'locked'] as Filter[]).map((f) => {
            const active = filter === f;
            const dark = '#1f2937';
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  { borderColor: dark },
                  active && { backgroundColor: dark, borderColor: dark },
                ]}
              >
                <Text style={[styles.filterText, { color: active ? '#FFFFFF' : dark }]}>
                  {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={"#1f2937"} />
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            numColumns={COLS}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
            renderItem={({ item }) => {
              const isNew = pinnedNewId === item.id;
              return (
                <TouchableOpacity
                  style={[styles.cell, { width: CELL }]}
                  activeOpacity={0.8}
                  onPress={() => setSelected(item)}
                >
                  <View>
                    <AchievementBadge image={item.image} unlocked={item.unlocked} size={CELL - 8} />
                    {isNew ? (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.cellTitle, { color: item.unlocked ? theme.textPrimary : theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textSecondary }]}>No badges in this filter</Text>
            }
          />
        )}

        <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelected(null)}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalCard, { backgroundColor: '#FFFFFF' }]}>
                {selected && (
                  <>
                    <AchievementBadge image={selected.image} unlocked={selected.unlocked} size={140} />
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{selected.title}</Text>
                    <Text style={[styles.modalRarity, { color: theme.textSecondary }]}>
                      {selected.rarity.toUpperCase()} · {selected.category}
                    </Text>

                    <View style={[styles.howToBox, { backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.howToLabel, { color: theme.textPrimary }]}>
                        {selected.unlocked ? 'How you earned it' : 'How to unlock'}
                      </Text>
                      <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
                        {howToObtain(selected.criteria, selected.description)}
                      </Text>
                    </View>

                    <Text style={[styles.modalStatus, { color: selected.unlocked ? '#10B981' : theme.textSecondary }]}>
                      {selected.unlocked
                        ? `Unlocked${selected.unlockedAt ? ` · ${new Date(selected.unlockedAt).toLocaleDateString()}` : ''}`
                        : 'Not unlocked yet'}
                    </Text>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)} activeOpacity={0.8}>
                      <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  filters: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: 24, paddingBottom: 40 },
  cell: { alignItems: 'center' },
  cellTitle: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4, minHeight: 28 },
  newBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  empty: { textAlign: 'center', marginTop: 40 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  modalRarity: { fontSize: 11, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  howToBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  howToLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  modalDesc: { fontSize: 14, textAlign: 'left', lineHeight: 20 },
  modalStatus: { fontSize: 13, fontWeight: '600', marginTop: 14 },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#129490',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
