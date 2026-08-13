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
  challengeDateYmd,
  localYmd,
  getChallengePeriodDays,
} from '../lib/challengeDates';

const { width } = Dimensions.get('window');
const horizontalPadding = 24 * 2;
const gap = 12; // Match habit card width calculation
const CARD_WIDTH = Math.max(160, (width - horizontalPadding - gap) / 2);

/** Bottom band shades for Steps ladder — lighter → darker as step target rises */
const STEP_CARD_BAND_COLORS: Record<string, string> = {
  '8k steps daily': '#10B981', // emerald
  '8k steps': '#10B981',
  '10k steps daily': '#047857', // darker
  '10k steps': '#047857',
  '12k steps daily': '#065F46', // darker still
  '12k steps': '#065F46',
  '15k steps daily': '#022C22', // darkest
  '15k steps': '#022C22',
};

function getStepsCardBandColor(title: string): string | null {
  const key = stripTrailingChallengeWord(title).toLowerCase();
  return STEP_CARD_BAND_COLORS[key] ?? STEP_CARD_BAND_COLORS[key.replace(/\s+daily$/, '')] ?? null;
}

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

/** Top-right timing chip, e.g. "Starts in 3 days" */
function getStartsLabel(startIso: string, endIso: string): string | null {
  const startYmd = challengeDateYmd(startIso);
  const endYmd = challengeDateYmd(endIso);
  if (!startYmd || !endYmd) return null;

  const today = localYmd(new Date());
  const start = new Date(`${startYmd}T12:00:00`);
  const end = new Date(`${endYmd}T12:00:00`);
  const todayDate = new Date(`${today}T12:00:00`);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilStart = Math.round((start.getTime() - todayDate.getTime()) / msPerDay);
  const daysUntilEnd = Math.round((end.getTime() - todayDate.getTime()) / msPerDay);

  if (daysUntilStart > 1) return `Starts in ${daysUntilStart} days`;
  if (daysUntilStart === 1) return 'Starts in 1 day';
  if (daysUntilStart === 0) return 'Starts today';
  if (daysUntilEnd < 0) return 'Ended';
  if (daysUntilEnd === 0) return 'Ends today';
  if (daysUntilEnd === 1) return 'Ends in 1 day';
  return `Ends in ${daysUntilEnd} days`;
}

function getDurationLabel(startIso: string, endIso: string): string | null {
  const days = getChallengePeriodDays(startIso, endIso);
  if (!days || days < 1) return null;
  return days === 1 ? '1 day' : `${days} days`;
}

function formatUsd(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  return `$${n.toLocaleString('en-US')}`;
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

  const categoryColor = getCategoryColor(challenge.category);
  const stepsBandColor = getStepsCardBandColor(challenge.title);
  
  // Steps ladder: progressively darker bottom bands. Core habits dark grey. Private purple. Else category.
  const sectionColor =
    challenge.visibility === 'private'
      ? '#4B0082'
      : stepsBandColor
        ? stepsBandColor
        : isCoreHabit
          ? isDark
            ? '#1f1f1f'
            : '#111827'
          : categoryColor;

  /** Participant count always green (joined state used elsewhere, not for this chip). */
  const participantIconColor = '#10B981';
  const participantNumberColor = '#10B981';
  const startsLabel = getStartsLabel(challenge.start_date, challenge.end_date);
  const durationLabel = getDurationLabel(challenge.start_date, challenge.end_date);
  const displayParticipantCount = challenge.participant_count || 0;

  const audiencePill =
    challenge.visibility === 'private' ? (
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
    );

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
        {/* Top-right: Done today, else starts/ends timing chip */}
        {isCompleted ? (
          <View style={styles.doneBadge} pointerEvents="none">
            <Ionicons name="checkmark-done-circle" size={14} color="#F59E0B" />
            <Text style={styles.doneText}>Done</Text>
          </View>
        ) : startsLabel ? (
          <View style={styles.startsBadge} pointerEvents="none">
            <Ionicons name="time-outline" size={11} color="#4B5563" />
            <Text style={styles.startsBadgeText} numberOfLines={1}>
              {startsLabel}
            </Text>
          </View>
        ) : null}

        {/* Top half: audience + duration (left) + participants (right) */}
        <View style={styles.topSection}>
          <View
            style={[
              styles.topBadgesRow,
              heroImageSource != null && styles.topBadgesRowWithHero,
            ]}
          >
            <View style={styles.topLeftBadges}>
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
              ) : (
                audiencePill
              )}
            </View>
            <View style={styles.participantsContainerAction}>
              <Ionicons name="people" size={14} color={participantIconColor} />
              <Text
                style={[
                  styles.participantsTextAction,
                  { color: participantNumberColor },
                ]}
              >
                <Text style={{ fontWeight: '700' }}>{displayParticipantCount}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom half: title on top line, entry/pot at bottom */}
        <View style={styles.bottomSection}>
          <Text
            style={[styles.title, styles.titleInBottom]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getChallengeDisplayTitle(challenge.title)}
          </Text>
          {durationLabel ? (
            <View style={styles.durationUnderTitleRow}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255, 255, 255, 0.68)" />
              <Text style={styles.durationUnderTitle} numberOfLines={1}>
                {durationLabel}
              </Text>
            </View>
          ) : null}

          <View style={styles.feeContainer}>
            <View style={styles.feeBlockLeft}>
              <Text style={styles.prizePoolLabel} numberOfLines={1}>
                prize pool
              </Text>
              <Text style={styles.prizePoolAmount} numberOfLines={1}>
                {formatUsd(displayParticipantCount * (challenge.entry_fee ?? 0))}
              </Text>
            </View>
            <View style={styles.feeBlockRight}>
              <Text style={styles.entryAmount} numberOfLines={1}>
                {formatUsd(challenge.entry_fee ?? 0)}
              </Text>
              <Text style={styles.entryLabel} numberOfLines={1}>
                entry
              </Text>
            </View>
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
  everyonePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
  /** Top ~60% — audience + participants sit along the bottom edge of the photo */
  topSection: {
    height: '60%',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 36,
    paddingBottom: 8,
  },
  /** Bottom 40% — title on top line (where date was), fees at bottom */
  bottomSection: {
    height: '40%',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'column',
    position: 'relative',
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
  durationUnderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  durationUnderTitle: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  topLeftBadges: {
    flexShrink: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  /** Hero cards: lift row above Image layer */
  topBadgesRowWithHero: {
    zIndex: 12,
    elevation: 10,
  },
  participantsContainerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    alignSelf: 'flex-end',
  },
  participantsTextAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  startsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    maxWidth: '62%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  startsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.1,
    flexShrink: 1,
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
    gap: 8,
  },
  feeBlockLeft: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  feeBlockRight: {
    alignItems: 'flex-end',
  },
  /** Label sits on the middle line; amount below matches title weight */
  prizePoolLabel: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  prizePoolAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 1,
  },
  entryAmount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  entryLabel: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 1,
  },
});
