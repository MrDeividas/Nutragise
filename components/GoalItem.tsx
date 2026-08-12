import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types/database';
import FeaturedGoalCircle from './FeaturedGoalCircle';

const DARK = '#1f2937';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_FEATURED = 3;

interface GoalItemProps {
  goal: Goal;
  navigation: any;
  onToggle: (id: string) => void;
  onToggleFeatured?: (id: string, featured: boolean) => void;
  featuredCount?: number;
}

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDaysUntilTarget = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const dueLabel = (
  endDate: string | null | undefined
): { text: string; tone: 'overdue' | 'soon' | 'ok' } | null => {
  if (!endDate) return null;
  const days = getDaysUntilTarget(endDate);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'overdue' };
  if (days === 0) return { text: 'Due today', tone: 'soon' };
  if (days === 1) return { text: '1 day left', tone: 'soon' };
  if (days <= 7) return { text: `${days} days left`, tone: 'soon' };
  return { text: `${days} days left`, tone: 'ok' };
};

const frequencyLabel = (frequency?: boolean[]): string | null => {
  if (!frequency || frequency.length === 0) return null;
  const activeDays = frequency
    .map((on, i) => (on ? DAY_LABELS[i] : null))
    .filter(Boolean) as string[];
  if (activeDays.length === 0) return null;
  if (activeDays.length === 7) return 'Daily';
  if (activeDays.length >= 5) return `${activeDays.length}x / week`;
  return activeDays.join(' · ');
};

const GoalItem = React.memo(
  ({ goal, navigation, onToggle, onToggleFeatured, featuredCount = 0 }: GoalItemProps) => {
    const due = !goal.completed ? dueLabel(goal.end_date) : null;
    const schedule = frequencyLabel(goal.frequency);
    const milestoneCount = goal.milestone_count || goal.milestones?.length || 0;
    const progressPct =
      typeof goal.progress_percent === 'number' && !Number.isNaN(goal.progress_percent)
        ? Math.max(0, Math.min(100, Math.round(goal.progress_percent)))
        : goal.completed
          ? 100
          : 0;
    const finishedDate = goal.completed
      ? goal.last_updated_at || goal.created_at
      : null;
    const hasChips = !!(
      goal.category ||
      goal.completed ||
      due ||
      goal.time_commitment ||
      milestoneCount > 0
    );
    const hasDates = !!(goal.start_date || goal.end_date || finishedDate);
    const isFeatured = !!goal.is_featured;
    const hasMeta =
      !!goal.description || hasChips || !!schedule || hasDates;

    const handleFeaturePress = () => {
      if (!onToggleFeatured || goal.completed) return;
      if (!isFeatured && featuredCount >= MAX_FEATURED) {
        Alert.alert('Featured goals', `You can feature up to ${MAX_FEATURED} goals on your profile.`);
        return;
      }
      onToggleFeatured(goal.id, !isFeatured);
    };

    const openDetail = () => navigation.navigate('GoalDetail', { goal });
    const openUpdate = () => navigation.navigate('UpdateGoal', { goalId: goal.id });

    return (
      <View style={[styles.card, goal.completed && styles.cardDone]}>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <TouchableOpacity style={styles.titlePress} onPress={openDetail} activeOpacity={0.88}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.title, goal.completed && styles.titleDone]} numberOfLines={2}>
                  {goal.title}
                </Text>
                {isFeatured ? (
                  <View style={styles.featuredInline}>
                    <Text style={styles.featuredInlineText}>Featured</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            {!goal.completed && onToggleFeatured ? (
              <TouchableOpacity
                onPress={handleFeaturePress}
                hitSlop={10}
                style={[styles.featureBtn, isFeatured && styles.featureBtnOn]}
                accessibilityLabel={isFeatured ? 'Unfeature goal' : 'Feature on profile'}
              >
                <Ionicons
                  name={isFeatured ? 'star' : 'star-outline'}
                  size={16}
                  color={isFeatured ? '#FFFFFF' : '#10B981'}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.contentRow}>
            <View style={styles.ringWrap}>
              <FeaturedGoalCircle
                id={goal.id}
                title={goal.title}
                percent={progressPct}
                compact
                showTitle={false}
                onPress={openDetail}
                onLongPress={openUpdate}
              />
            </View>

            <TouchableOpacity
              style={styles.metaCol}
              onPress={openDetail}
              activeOpacity={0.88}
              disabled={!hasMeta}
            >
              {goal.description ? (
                <Text
                  style={[styles.description, goal.completed && styles.descriptionDone]}
                  numberOfLines={2}
                >
                  {goal.description}
                </Text>
              ) : null}

              {hasChips ? (
                <View style={styles.chipRow}>
                  {goal.category ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{goal.category}</Text>
                    </View>
                  ) : null}
                  {goal.completed ? (
                    <View style={[styles.chip, styles.doneChip]}>
                      <Text style={[styles.chipText, styles.doneChipText]}>Done</Text>
                    </View>
                  ) : null}
                  {due ? (
                    <View
                      style={[
                        styles.chip,
                        due.tone === 'overdue' && styles.overdueChip,
                        due.tone === 'soon' && styles.soonChip,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          due.tone === 'overdue' && styles.overdueChipText,
                          due.tone === 'soon' && styles.soonChipText,
                        ]}
                      >
                        {due.text}
                      </Text>
                    </View>
                  ) : null}
                  {goal.time_commitment ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{goal.time_commitment}</Text>
                    </View>
                  ) : null}
                  {milestoneCount > 0 ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {milestoneCount} milestone{milestoneCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {schedule ? (
                <View style={styles.scheduleRow}>
                  <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {schedule}
                  </Text>
                </View>
              ) : null}

              {hasDates ? (
                <View style={styles.datesRow}>
                  <Text style={styles.metaText}>
                    Started {goal.start_date ? formatShortDate(goal.start_date) : '—'}
                  </Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>
                    Ends {goal.end_date ? formatShortDate(goal.end_date) : '—'}
                  </Text>
                  {finishedDate ? (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>
                        Finished {formatShortDate(finishedDate)}
                      </Text>
                    </>
                  ) : null}
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onToggle(goal.id)}
          style={[styles.check, goal.completed && styles.checkDone]}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!goal.completed }}
        >
          {goal.completed ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </TouchableOpacity>
      </View>
    );
  }
);

export default GoalItem;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDone: {
    backgroundColor: '#FFFFFF',
    opacity: 0.92,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  titlePress: {
    flex: 1,
    minWidth: 0,
  },
  titleWithBadge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: DARK,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  titleDone: {
    color: '#9CA3AF',
  },
  featuredInline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  featuredInlineText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  featureBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBtnOn: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ringWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  description: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  descriptionDone: {
    color: '#9CA3AF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    color: DARK,
    fontSize: 11,
    fontWeight: '700',
  },
  doneChip: {
    backgroundColor: 'rgba(31,41,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(31,41,55,0.15)',
  },
  doneChipText: {
    color: DARK,
  },
  overdueChip: {
    backgroundColor: '#FEF2F2',
  },
  overdueChipText: {
    color: '#DC2626',
  },
  soonChip: {
    backgroundColor: '#FFFBEB',
  },
  soonChipText: {
    color: '#B45309',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  metaDot: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  datesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkDone: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
});
