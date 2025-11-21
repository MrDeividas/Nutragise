import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

const LEVELS = [
  {
    level: 1,
    title: "Beginner",
    minPoints: 0,
    maxPoints: 1399,
    unlocks: "Daily challenges + accountability score tracking",
    rewards: ["Personalized weekly performance summary (AI coach)", "10% referral commission"]
  },
  {
    level: 2,
    title: "Committed",
    minPoints: 1400,
    maxPoints: 3199,
    unlocks: "Streak tracker + habit analytics dashboard",
    comingSoon: ["Create challenges between friends"],
    rewards: ["1 free 'Accountability Boost' (double points for 1 day)", "15% referral commission"]
  },
  {
    level: 3,
    title: "Focused",
    minPoints: 3200,
    maxPoints: 5499,
    unlocks: "Access to advanced challenges (e.g., 7-day cold shower streaks)",
    comingSoon: ["Public challenges"],
    rewards: ["Entry into monthly prize draw (rewards up to £50)"]
  },
  {
    level: 4,
    title: "Disciplined",
    minPoints: 5500,
    maxPoints: 8599,
    unlocks: "Custom progress report + leaderboard spotlight",
    rewards: ["Priority support access", "20% referral commission"]
  },
  {
    level: 5,
    title: "Achiever",
    minPoints: 8600,
    maxPoints: 12499,
    unlocks: "Exclusive community badge + advanced analytics",
    comingSoon: ["Become a mentor - create events, sell courses etc"],
    rewards: ["Entry into monthly prize draw (rewards up to £75)", "2 free 'Accountability Boosts'"]
  },
  {
    level: 6,
    title: "Challenger",
    minPoints: 12500,
    maxPoints: 17499,
    unlocks: "Elite tier challenges + custom goal templates",
    rewards: ["Entry into premium prize draw (rewards up to £100)", "25% referral commission"]
  },
  {
    level: 7,
    title: "Relentless",
    minPoints: 17500,
    maxPoints: 23999,
    unlocks: "Platinum status + featured profile spotlight",
    rewards: ["Entry into premium prize draw (rewards up to £150)", "Exclusive merchandise"]
  },
  {
    level: 8,
    title: "Ascended",
    minPoints: 24000,
    maxPoints: Infinity,
    unlocks: "Ultimate mastery badge + lifetime benefits",
    comingSoon: ["VIP mentorship program"],
    rewards: ["Entry into grand prize draw (rewards up to £250)", "30% referral commission", "Lifetime premium features"]
  }
];

const DAILY_HABIT_NAMES = ['Gym', 'Meditation', 'Microlearn', 'Sleep', 'Water', 'Run', 'Reflect', 'Cold Shower'];
const CORE_HABIT_NAMES = ['Like', 'Comment', 'Share', 'Update Goal', 'Bonus'];

interface LevelInfoModalProps {
  visible: boolean;
  onClose: () => void;
  currentLevel: number;
  totalPoints: number;
  dailyHabits: boolean[];
  coreHabits: boolean[];
}

export default function LevelInfoModal({
  visible,
  onClose,
  currentLevel,
  totalPoints,
  dailyHabits,
  coreHabits,
}: LevelInfoModalProps) {
  const { theme } = useTheme();
  const [showAllLevels, setShowAllLevels] = useState(false);

  const currentLevelData = LEVELS[currentLevel - 1];

  const renderHabitItem = (name: string, completed: boolean) => (
    <View key={name} style={styles.habitItemCompact}>
      <View style={[
        styles.habitCheckbox, 
        { backgroundColor: completed ? '#10B981' : 'rgba(128, 128, 128, 0.3)' }
      ]}>
        {completed && <Ionicons name="checkmark" size={12} color="#ffffff" />}
      </View>
      <Text style={[styles.habitTextCompact, { color: theme.textPrimary }]}>{name}</Text>
    </View>
  );

  const renderLevelCard = (levelData: typeof LEVELS[0], isCurrentLevel: boolean) => {
    // Calculate progress for current level
    let pointRangeText = '';
    if (isCurrentLevel && currentLevel < 8) {
      const pointsInLevel = totalPoints - levelData.minPoints;
      const nextLevelPoints = levelData.maxPoints + 1;
      pointRangeText = `${pointsInLevel.toLocaleString()}/${(nextLevelPoints - levelData.minPoints).toLocaleString()} pts`;
    } else if (isCurrentLevel && currentLevel === 8) {
      pointRangeText = `${totalPoints.toLocaleString()}+ pts`;
    } else {
      pointRangeText = `${levelData.minPoints.toLocaleString()}${levelData.maxPoints === Infinity ? '+' : `-${levelData.maxPoints.toLocaleString()}`} pts`;
    }

    return (
      <View 
        key={levelData.level}
        style={[
          styles.levelCard, 
          { backgroundColor: 'rgba(128, 128, 128, 0.15)' },
          isCurrentLevel && { borderWidth: 2, borderColor: theme.textPrimary }
        ]}
      >
        <View style={styles.levelHeader}>
          <Text style={[styles.levelTitle, { color: theme.textPrimary }]}>
            LEVEL {levelData.level} — {levelData.title}
          </Text>
          {isCurrentLevel && (
            <View style={[styles.currentBadge, { backgroundColor: theme.textPrimary }]}>
              <Text style={[styles.currentBadgeText, { color: theme.background }]}>CURRENT</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.levelPoints, { color: theme.textSecondary }]}>
          ({pointRangeText})
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🔓 Unlocks:</Text>
          <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
            {levelData.unlocks}
          </Text>
        </View>

        {levelData.comingSoon && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🚀 Coming Soon:</Text>
            {levelData.comingSoon.map((feature, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>•</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🎯 Rewards:</Text>
          {levelData.rewards.map((reward, index) => (
            <View key={index} style={styles.bulletItem}>
              <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{reward}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(50, 50, 50, 1)' }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Your Progress
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
            >
            {/* Current Level Section */}
            <View style={styles.content}>
              {renderLevelCard(currentLevelData, true)}

              {/* Today's Progress */}
              <View style={styles.progressSection}>
                <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
                  Today's Habits
                </Text>

                {/* Daily Habits */}
                <View style={styles.habitsGroup}>
                  <Text style={[styles.habitGroupTitle, { color: theme.textSecondary }]}>
                    Daily Habits ({dailyHabits.filter(h => h).length}/8)
                  </Text>
                  <View style={styles.habitsGrid}>
                    {DAILY_HABIT_NAMES.map((name, index) => 
                      renderHabitItem(name, dailyHabits[index] || false)
                    )}
                  </View>
                </View>

                {/* Core Habits */}
                <View style={styles.habitsGroup}>
                  <Text style={[styles.habitGroupTitle, { color: theme.textSecondary }]}>
                    Core Habits ({coreHabits.filter(h => h).length}/5)
                  </Text>
                  <View style={styles.habitsGrid}>
                    {CORE_HABIT_NAMES.map((name, index) => 
                      renderHabitItem(name, coreHabits[index] || false)
                    )}
                  </View>
                </View>
              </View>

              {/* Show More / All Levels */}
              {!showAllLevels ? (
                <TouchableOpacity 
                  style={[styles.showMoreButton, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
                  onPress={() => setShowAllLevels(true)}
                >
                  <Text style={[styles.showMoreText, { color: theme.textPrimary }]}>
                    Show All Levels
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.allLevelsSection}>
                  <View style={styles.allLevelsHeader}>
                    <Text style={[styles.allLevelsTitle, { color: theme.textPrimary }]}>
                      All Levels
                    </Text>
                    <TouchableOpacity onPress={() => setShowAllLevels(false)}>
                      <Ionicons name="chevron-up" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  {LEVELS.map((level) => 
                    renderLevelCard(level, level.level === currentLevel)
                  )}
                </View>
            )}
          </View>
          </ScrollView>
        </View>
      </View>
    </View>
</Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '100%',
    overflow: 'hidden',
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 600,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  levelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  levelPoints: {
    fontSize: 14,
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  rewardItem: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
    width: 12,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  habitsGroup: {
    marginBottom: 16,
  },
  habitGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
    minWidth: '45%',
    flex: 0,
  },
  habitCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTextCompact: {
    fontSize: 13,
    flex: 1,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  allLevelsSection: {
    marginTop: 8,
  },
  allLevelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  allLevelsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
});

