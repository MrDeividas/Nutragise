import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

export default function CompetitionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const activeCompetitions = [
    {
      id: '1',
      title: '30-Day Fitness Challenge',
      duration: '15 days left',
      category: 'Fitness',
      participants: 156,
      icon: '💪',
    },
    {
      id: '2',
      title: 'Reading Marathon',
      duration: '7 days left',
      category: 'Learning',
      participants: 89,
      icon: '📚',
    },
    {
      id: '3',
      title: 'Meditation Streak',
      duration: '21 days left',
      category: 'Wellness',
      participants: 234,
      icon: '🧘‍♀️',
    },
  ];

  const upcomingCompetitions = [
    {
      id: '1',
      title: 'Weight Loss Challenge',
      duration: 'Starts in 3 days',
      category: 'Health',
      participants: 67,
      icon: '⚖️',
    },
    {
      id: '2',
      title: 'Coding Bootcamp',
      duration: 'Starts in 1 week',
      category: 'Technology',
      participants: 123,
      icon: '💻',
    },
    {
      id: '3',
      title: 'Art Challenge',
      duration: 'Starts in 5 days',
      category: 'Creativity',
      participants: 45,
      icon: '🎨',
    },
  ];

  const dailyLeaderboard = [
    { id: '1', name: 'Sarah Johnson', points: 1250, rank: 1, avatar: '👩‍🦰' },
    { id: '2', name: 'Mike Chen', points: 1180, rank: 2, avatar: '👨‍💼' },
    { id: '3', name: 'Emma Davis', points: 1120, rank: 3, avatar: '👩‍🎨' },
    { id: '4', name: 'Alex Thompson', points: 1050, rank: 4, avatar: '👨‍🏫' },
    { id: '5', name: 'Lisa Wang', points: 980, rank: 5, avatar: '👩‍⚕️' },
  ];

  const weeklyLeaderboard = [
    { id: '1', name: 'Mike Chen', points: 8450, rank: 1, avatar: '👨‍💼' },
    { id: '2', name: 'Sarah Johnson', points: 8120, rank: 2, avatar: '👩‍🦰' },
    { id: '3', name: 'David Kim', points: 7890, rank: 3, avatar: '👨‍🔬' },
    { id: '4', name: 'Emma Davis', points: 7650, rank: 4, avatar: '👩‍🎨' },
    { id: '5', name: 'Alex Thompson', points: 7420, rank: 5, avatar: '👨‍🏫' },
  ];

  const monthlyLeaderboard = [
    { id: '1', name: 'David Kim', points: 32450, rank: 1, avatar: '👨‍🔬' },
    { id: '2', name: 'Sarah Johnson', points: 31890, rank: 2, avatar: '👩‍🦰' },
    { id: '3', name: 'Mike Chen', points: 31200, rank: 3, avatar: '👨‍💼' },
    { id: '4', name: 'Emma Davis', points: 29850, rank: 4, avatar: '👩‍🎨' },
    { id: '5', name: 'Lisa Wang', points: 28760, rank: 5, avatar: '👩‍⚕️' },
  ];

  const getCurrentLeaderboard = () => {
    switch (leaderboardPeriod) {
      case 'daily':
        return dailyLeaderboard;
      case 'weekly':
        return weeklyLeaderboard;
      case 'monthly':
        return monthlyLeaderboard;
      default:
        return dailyLeaderboard;
    }
  };

  const renderCompetitionCard = (competition: any) => (
    <TouchableOpacity
      key={competition.id}
      style={[styles.card, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
      onPress={() => {
        console.log('Open competition:', competition.title);
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{competition.icon}</Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardDuration, { color: theme.textSecondary }]}>
            {competition.duration}
          </Text>
          <Text style={[styles.cardCategory, { color: theme.textTertiary }]}>
            {competition.category}
          </Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
        {competition.title}
      </Text>
      <View style={styles.cardFooter}>
        <View style={styles.participantsContainer}>
          <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.participantsText, { color: theme.textSecondary }]}>
            {competition.participants} participants
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.leaderboardItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: theme.textPrimary }]}>
          #{item.rank}
        </Text>
        {item.rank <= 3 && (
          <View style={[styles.medalContainer, { backgroundColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>
            <Ionicons name="medal" size={12} color="#ffffff" />
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userAvatar}>{item.avatar}</Text>
        <Text style={[styles.userName, { color: theme.textPrimary }]}>
          {item.name}
        </Text>
      </View>
      
      <View style={styles.pointsContainer}>
        <Text style={[styles.pointsText, { color: theme.textPrimary }]}>
          {item.points.toLocaleString()}
        </Text>
        <Text style={[styles.pointsLabel, { color: theme.textSecondary }]}>
          pts
        </Text>
      </View>
    </View>
  );

  const renderLeaderboardTab = (period: 'daily' | 'weekly' | 'monthly', label: string) => (
    <TouchableOpacity
      style={[
        styles.leaderboardTab,
        leaderboardPeriod === period && styles.leaderboardTabActive
      ]}
      onPress={() => setLeaderboardPeriod(period)}
    >
      <Text style={[
        styles.leaderboardTabText,
        { color: leaderboardPeriod === period ? '#EA580C' : theme.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Competitions
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Active Competitions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame-outline" size={24} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Active Competitions
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Join ongoing challenges and compete with others
          </Text>
          
          <View style={styles.cardsContainer}>
            {activeCompetitions.map(renderCompetitionCard)}
          </View>
        </View>

        {/* Upcoming Competitions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Upcoming Competitions
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Get ready for future challenges and events
          </Text>
          
          <View style={styles.cardsContainer}>
            {upcomingCompetitions.map(renderCompetitionCard)}
          </View>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="podium-outline" size={24} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Leaderboard
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Top performers and rankings
          </Text>

          {/* Leaderboard Tabs */}
          <View style={styles.leaderboardTabs}>
            {renderLeaderboardTab('daily', 'Daily')}
            {renderLeaderboardTab('weekly', 'Weekly')}
            {renderLeaderboardTab('monthly', 'Monthly')}
          </View>

          {/* Leaderboard List */}
          <View style={styles.leaderboardContainer}>
            <FlatList
              data={getCurrentLeaderboard()}
              keyExtractor={(item) => item.id}
              renderItem={renderLeaderboardItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 0,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginLeft: 32,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardCategory: {
    fontSize: 10,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 8,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  leaderboardTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  leaderboardTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  leaderboardTabActive: {
    // No background, just text color change
  },
  leaderboardTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  medalContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  userAvatar: {
    fontSize: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsLabel: {
    fontSize: 12,
    marginTop: 2,
  },
}); 