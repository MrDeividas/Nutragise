import React, { useState } from 'react';
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
  const { theme, isDark } = useTheme();
  const [showAllLevels, setShowAllLevels] = useState(true); // Start with all levels shown

  const currentLevelData = LEVELS[currentLevel - 1];

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
          { 
            backgroundColor: isCurrentLevel ? 'rgba(16, 185, 129, 0.15)' : 'rgba(128, 128, 128, 0.1)',
            borderWidth: isCurrentLevel ? 2 : 1,
            borderColor: isCurrentLevel ? '#10B981' : 'rgba(128, 128, 128, 0.2)'
          }
        ]}
      >
        <View style={styles.levelHeader}>
          <Text style={[styles.levelTitle, { color: theme.textPrimary }]}>
            LEVEL {levelData.level} — {levelData.title}
          </Text>
          {isCurrentLevel && (
            <View style={[styles.currentBadge, { backgroundColor: '#10B981' }]}>
              <Text style={[styles.currentBadgeText, { color: '#FFFFFF' }]}>CURRENT</Text>
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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Your Progress
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {/* All Levels Section */}
          <View style={styles.content}>
            <View style={styles.allLevelsSection}>
              <View style={styles.allLevelsHeader}>
                <Text style={[styles.allLevelsTitle, { color: theme.textPrimary }]}>
                  All Levels
                </Text>
              </View>
              {LEVELS.map((level) => 
                renderLevelCard(level, level.level === currentLevel)
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
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
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  levelCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
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
  allLevelsSection: {
    marginTop: 8,
  },
  allLevelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  allLevelsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
});

