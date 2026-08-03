import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

const DARK = '#1f2937';
const ACCENT = '#129490';
const REWARD = '#D97706';

const LEVELS = [
  {
    level: 1,
    title: 'Beginner',
    minPoints: 0,
    maxPoints: 1399,
    unlocks: 'Join free challenges + daily challenges + accountability score tracking · 1 microlearn & 1 meditation per day',
    rewards: ['Personalized weekly performance summary (AI coach)', '10% referral commission'],
  },
  {
    level: 2,
    title: 'Committed',
    minPoints: 1400,
    maxPoints: 3199,
    unlocks: 'Streak tracker + habit analytics dashboard · Keep 1 microlearn & 1 meditation per day',
    comingSoon: ['Create challenges between friends'],
    rewards: ["1 free 'Accountability Boost' (double points for 2 days)", '15% referral commission'],
  },
  {
    level: 3,
    title: 'Focused',
    minPoints: 3200,
    maxPoints: 5499,
    unlocks: 'Access to advanced challenges + Rewards Store claims · 2 microlearns & 2 meditations per day',
    comingSoon: ['Public challenges'],
    rewards: [
      '£150 monthly raffle entry unlocked (Pro required to enter)',
    ],
  },
  {
    level: 4,
    title: 'Disciplined',
    minPoints: 5500,
    maxPoints: 8599,
    unlocks: 'Custom progress report + leaderboard spotlight · Keep 2 microlearns & 2 meditations per day',
    rewards: ['Priority support access', '20% referral commission'],
  },
  {
    level: 5,
    title: 'Achiever',
    minPoints: 8600,
    maxPoints: 12499,
    unlocks: 'Exclusive community badge + advanced analytics · 3 microlearns & 3 meditations per day',
    comingSoon: ['Become a mentor - create events, sell courses etc'],
    rewards: ['Entry into the end-of-month prize draw (rewards up to £75)', "2 free 'Accountability Boosts'"],
  },
  {
    level: 6,
    title: 'Challenger',
    minPoints: 12500,
    maxPoints: 17499,
    unlocks: 'Elite tier challenges + custom goal templates · Keep 3 microlearns & 3 meditations per day',
    rewards: ['Entry into premium prize draw (rewards up to £100)', '25% referral commission'],
  },
  {
    level: 7,
    title: 'Relentless',
    minPoints: 17500,
    maxPoints: 23999,
    unlocks: 'Platinum status + featured profile spotlight · Keep 3 microlearns & 3 meditations per day',
    rewards: ['Entry into premium prize draw (rewards up to £150)', 'Exclusive merchandise'],
  },
  {
    level: 8,
    title: 'Ascended',
    minPoints: 24000,
    maxPoints: Infinity,
    unlocks: 'Ultimate mastery badge + lifetime benefits · Keep 3 microlearns & 3 meditations per day (Pro still unlocks unlimited)',
    comingSoon: ['VIP mentorship program'],
    rewards: [
      'Entry into grand prize draw (rewards up to £250)',
      '30% referral commission',
      'Lifetime premium features',
    ],
  },
];

interface LevelInfoModalProps {
  visible: boolean;
  onClose: () => void;
  currentLevel: number;
  totalPoints: number;
}

export default function LevelInfoModal({
  visible,
  onClose,
  currentLevel,
  totalPoints,
}: LevelInfoModalProps) {
  const { theme } = useTheme();
  const currentLevelData = LEVELS.find((l) => l.level === currentLevel);

  const renderLevelCard = (levelData: (typeof LEVELS)[0], isCurrentLevel: boolean) => {
    let pointRangeText = '';
    if (isCurrentLevel && currentLevel < 8) {
      const pointsInLevel = totalPoints - levelData.minPoints;
      const nextLevelPoints = levelData.maxPoints + 1;
      pointRangeText = `${pointsInLevel.toLocaleString()} / ${(nextLevelPoints - levelData.minPoints).toLocaleString()} pts`;
    } else if (isCurrentLevel && currentLevel === 8) {
      pointRangeText = `${totalPoints.toLocaleString()}+ pts`;
    } else {
      pointRangeText = `${levelData.minPoints.toLocaleString()}${
        levelData.maxPoints === Infinity ? '+' : `–${levelData.maxPoints.toLocaleString()}`
      } pts`;
    }

    return (
      <View key={levelData.level} style={[styles.levelCard, isCurrentLevel && styles.levelCardCurrent]}>
        {isCurrentLevel ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        ) : null}

        <View style={styles.titleRow}>
          <View style={[styles.levelDot, isCurrentLevel && styles.levelDotCurrent]}>
            <Text style={[styles.levelDotText, isCurrentLevel && styles.levelDotTextCurrent]}>
              {levelData.level}
            </Text>
          </View>
          <Text style={[styles.title, isCurrentLevel && styles.titleCurrent]} numberOfLines={1}>
            {levelData.title}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {levelData.unlocks}
        </Text>

        <View style={styles.chipRow}>
          {levelData.comingSoon?.length ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {levelData.comingSoon.length} coming soon
              </Text>
            </View>
          ) : null}
          <View style={[styles.chip, styles.rewardChip]}>
            <Text style={[styles.chipText, styles.rewardChipText]}>
              {levelData.rewards.length} reward{levelData.rewards.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="flash" size={13} color={isCurrentLevel ? ACCENT : '#9CA3AF'} />
          <Text style={[styles.metaText, isCurrentLevel && styles.metaTextCurrent]}>
            {pointRangeText}
          </Text>
        </View>

        {levelData.rewards.map((reward, index) => (
          <View key={`reward-${index}`} style={styles.detailRow}>
            <Ionicons name="gift" size={13} color={REWARD} />
            <Text style={styles.detailText}>{reward}</Text>
          </View>
        ))}

        {levelData.comingSoon?.map((feature, index) => (
          <View key={`soon-${index}`} style={styles.detailRow}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
            <Text style={styles.detailText}>Soon · {feature}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Your Progress</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          <View style={styles.totalExpCard}>
            <Text style={styles.totalExpLabel}>Total EXP</Text>
            <Text style={styles.totalExpValue}>{totalPoints.toLocaleString()}</Text>
            <Text style={styles.totalExpLevel}>
              Level {currentLevel}
              {currentLevelData?.title ? ` · ${currentLevelData.title}` : ''}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>All Levels</Text>
          {LEVELS.map((level) => renderLevelCard(level, level.level === currentLevel))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  totalExpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  totalExpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  totalExpValue: {
    fontSize: 32,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.5,
  },
  totalExpLevel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  levelCard: {
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
    overflow: 'hidden',
  },
  levelCardCurrent: {
    borderColor: ACCENT,
    borderWidth: 2,
    backgroundColor: '#F4FBFA',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 2,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingRight: 72,
  },
  levelDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDotCurrent: {
    backgroundColor: ACCENT,
  },
  levelDotText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '800',
  },
  levelDotTextCurrent: {
    color: '#FFFFFF',
  },
  title: {
    flex: 1,
    color: DARK,
    fontSize: 16,
    fontWeight: '700',
  },
  titleCurrent: {
    color: ACCENT,
  },
  description: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
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
  rewardChip: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.22)',
  },
  rewardChipText: {
    color: REWARD,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  metaTextCurrent: {
    color: ACCENT,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  detailText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
