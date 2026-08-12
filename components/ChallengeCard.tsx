import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Challenge, ChallengeCardProps } from '../types/challenges';
import { useTheme } from '../state/themeStore';
import {
  stripTrailingChallengeWord,
  getChallengeDisplayTitle,
} from '../lib/challengeTitleUtils';
import { getChallengeCardHeroSource } from '../lib/challengeHeroImages';
import {
  formatChallengeShortDate,
  getChallengePeriodDays,
} from '../lib/challengeDates';

const { width } = Dimensions.get('window');
const horizontalPadding = 24 * 2;
const gap = 12; // Match habit card width calculation
const CARD_WIDTH = Math.max(160, (width - horizontalPadding - gap) / 2);

const CORE_HABIT_TITLES = new Set([
  'Gym',
  'Exercise',
  'Goal Update',
  'Microlearn',
  'Focus',
  'Reflection',
  'Water',
  'Cold Shower',
  'Screen Time',
  'Sleep',
  'Meditation',
]);

function isCoreHabitTitle(title: string): boolean {
  return CORE_HABIT_TITLES.has(stripTrailingChallengeWord(title));
}

export default function ChallengeCard({ challenge, onPress, isJoined, isCompleted }: ChallengeCardProps) {
  const { theme, isDark } = useTheme();

  const isCoreHabit = isCoreHabitTitle(challenge.title);
  const curatedHero = getChallengeCardHeroSource(
    challenge.title,
    challenge.is_user_created && !challenge.image_url
  );
  const heroImageSource =
    challenge.is_user_created && challenge.image_url
      ? { uri: challenge.image_url }
      : curatedHero;
  const heroContentPosition =
    challenge.is_user_created && challenge.image_url ? 'center' : 'top center';

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fitness':
        return '#10B981'; // Green
      case 'wellness':
        return '#8B5CF6'; // Purple
      case 'nutrition':
        return '#F59E0B'; // Amber
      case 'mindfulness':
        return '#06B6D4'; // Cyan
      case 'learning':
        return '#EF4444'; // Red
      case 'creativity':
        return '#EC4899'; // Pink
      case 'productivity':
        return '#6366F1'; // Indigo
      default:
        return '#6B7280'; // Gray
    }
  };

  const formatDuration = (weeks: number) => {
    const spanDays = getChallengePeriodDays(challenge.start_date, challenge.end_date);

    if (spanDays === 1) return '1 day';
    if (spanDays < 7) return `${spanDays} days`;
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  };

  /** e.g. "23 Mar - 30 Mar • 1 week" */
  const scheduleLine = `${formatChallengeShortDate(challenge.start_date)} - ${formatChallengeShortDate(challenge.end_date)} • ${formatDuration(challenge.duration_weeks)}`;

  const categoryColor = getCategoryColor(challenge.category);
  const categoryLabel = (challenge.category || 'fitness')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  
  // For core habit challenges, use dark grey color (matching ActionScreen core habit cards)
  // For private challenges, use dark purple, otherwise use category color
  const sectionColor = challenge.visibility === 'private' 
    ? '#4B0082' 
    : (isCoreHabit ? (isDark ? '#1f1f1f' : '#111827') : categoryColor);

  /** On full-bleed hero art, muted grey vanishes on light artwork (e.g. Sleep). Use dark slate, not theme.textPrimary (can be light in dark theme). */
  const participantIconColor = isJoined
    ? '#10B981'
    : heroImageSource != null
      ? '#111827'
      : theme.textSecondary;
  const participantNumberColor = participantIconColor;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
      onPress={() => onPress(challenge)}
      activeOpacity={0.8}
    >
      {heroImageSource != null ? (
        <View style={styles.cardHeroImageWrap} pointerEvents="none">
          <Image
            source={heroImageSource}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={heroContentPosition}
            transition={0}
          />
        </View>
      ) : null}
      {/* Coloured band: 40% height — sits above hero image; top ~60% shows photo + pills/badges */}
      <View style={[styles.blueSection, { backgroundColor: sectionColor }]} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Category + Private / Everyone (or Member) */}
        <View style={styles.topPillsColumn} pointerEvents="none">
          <View
            style={[
              styles.categoryPill,
              {
                borderColor: `${categoryColor}55`,
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
              },
            ]}
          >
            <Text
              style={[styles.pillLabel, styles.categoryPillLabel, { color: theme.textPrimary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {categoryLabel}
            </Text>
          </View>
          {challenge.visibility === 'private' ? (
            <View style={styles.privatePill}>
              <Text style={[styles.pillLabel, styles.privatePillText]}>Private</Text>
            </View>
          ) : challenge.is_pro_only ? (
            <View style={styles.memberPill}>
              <Text style={[styles.pillLabel, styles.memberPillText]}>Member</Text>
            </View>
          ) : (
            <View style={styles.everyonePill}>
              <Text style={[styles.pillLabel, styles.everyonePillText]}>Everyone</Text>
            </View>
          )}
        </View>
        
        {/* "Done today" badge — top-right, same pill style as Pending/Rejected */}
        {isCompleted && (
          <View style={styles.doneBadge} pointerEvents="none">
            <Ionicons name="checkmark-done-circle" size={14} color="#F59E0B" />
            <Text style={styles.doneText}>Done</Text>
          </View>
        )}

        {/* Top half: badges + participants only; title lives in bottom half */}
        <View style={styles.topSection}>
          <View
            style={[
              styles.topBadgesRow,
              heroImageSource != null && styles.topBadgesRowWithHero,
            ]}
          >
            {challenge.approval_status === 'pending' ? (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={14} color="#F59E0B" />
                <Text style={styles.pendingText}>Pending Review</Text>
              </View>
            ) : challenge.approval_status === 'rejected' ? (
              <View style={styles.rejectedBadge}>
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text style={styles.rejectedText}>Rejected</Text>
              </View>
            ) : null}
          <View style={styles.participantsContainerAction}>
            <Ionicons name="people" size={14} color={participantIconColor} />
            <Text
              style={[
                styles.participantsTextAction,
                { color: participantNumberColor },
              ]}
            >
              <Text style={{ fontWeight: '700' }}>{challenge.participant_count || 0}</Text>
            </Text>
            </View>
          </View>
        </View>

        {/* Bottom half: schedule, title, entry/pot */}
        <View style={styles.bottomSection}>
          <Text style={[styles.timeRemaining, styles.bottomSecondaryText]}>
            {scheduleLine}
          </Text>

          <View style={styles.bottomTitleWrap}>
            <Text
              style={[styles.title, styles.titleInBottom]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {getChallengeDisplayTitle(challenge.title)}
            </Text>
          </View>

          <View style={styles.feeContainer}>
            <Text style={[styles.entryPotText, styles.bottomSecondaryText]}>
              Entry: £{challenge.entry_fee ?? 0}
            </Text>
            <Text style={[styles.entryPotText, styles.bottomSecondaryText]}>
              Pot: £{(challenge.participant_count || 0) * (challenge.entry_fee ?? 0)}
            </Text>
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 232,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10, // Match habit card spacing
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  /** Full-card bleed; cover fills rect (may crop). Bottom 40% is covered by blueSection. */
  cardHeroImageWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
    borderRadius: 20,
  },
  blueSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
    zIndex: 2,
  },
  topPillsColumn: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 9,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  /** Hug text width; cap width so long names ellipsize + second pill still fits */
  categoryPill: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '72%',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryPillLabel: {
    flexShrink: 1,
  },
  everyonePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  everyonePillText: {
    color: '#15803D',
  },
  privatePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 0, 130, 0.35)',
    backgroundColor: 'rgba(75, 0, 130, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  privatePillText: {
    color: '#4B0082',
  },
  memberPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF1F4F',
    backgroundColor: 'rgba(255, 31, 79, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  memberPillText: {
    color: '#FF1F4F',
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.12,
  },
  /** Top ~60% — extra paddingTop clears stacked category + Everyone/Member pills */
  topSection: {
    height: '60%',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 6,
  },
  /** Bottom 40% — date, title, Entry/Pot (marginTop:auto on fee row) */
  bottomSection: {
    height: '40%',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'column',
    position: 'relative',
  },
  /** Flex:1 fills the space between date and fee; title is vertically centered inside */
  bottomTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
  },
  /** Schedule + Entry/Pot — dimmer so title reads as primary */
  bottomSecondaryText: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontWeight: '600',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 0,
  },
  titleInBottom: {
    color: '#FFFFFF',
    textAlign: 'left',
    width: '100%',
    fontWeight: '800',
    lineHeight: 20,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  /** Hero cards: lift row above Image layer (no background — icon + count only, like before) */
  topBadgesRowWithHero: {
    zIndex: 12,
    elevation: 10,
  },
  participantsContainerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  participantsTextAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  doneBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rejectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
  },
  entryPotText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
