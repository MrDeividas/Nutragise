import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';
import { pointsService } from '../lib/pointsService';

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  rank: number;
  avatar_url?: string;
}

export default function CompeteScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with profiles
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('username', 'is', null);

      if (usersError) {
        console.error('[Leaderboard] Error fetching users:', usersError);
        setLeaderboardData([]);
        setLoading(false);
        return;
      }
      
      console.log('[Leaderboard] Found users:', users?.length);
      
      if (!users || users.length === 0) {
        console.log('[Leaderboard] No users found');
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      // Fetch points for each user
      const usersWithPoints = await Promise.all(
        users.map(async (user) => {
          try {
            let points = 0;
            
            if (leaderboardPeriod === 'daily') {
              // Get today's points
              const todayPoints = await pointsService.getTodaysPoints(user.id);
              points = todayPoints?.total || 0;
              console.log(`[Leaderboard] User ${user.username} (${user.id}) daily points:`, points, 'Data:', todayPoints);
            } else {
              // Get total points for weekly/monthly
              points = await pointsService.getTotalPoints(user.id);
              console.log(`[Leaderboard] User ${user.username} (${user.id}) total points:`, points);
            }

            return {
              id: user.id,
              username: user.username || 'Unknown',
              points,
              avatar_url: user.avatar_url,
            };
          } catch (err) {
            console.error(`Error fetching points for user ${user.id}:`, err);
            return {
              id: user.id,
              username: user.username || 'Unknown',
              points: 0,
              avatar_url: user.avatar_url,
            };
          }
        })
      );

      console.log('[Leaderboard] All users with points:', usersWithPoints);

      // Filter out users with 0 points and sort by points
      const sortedUsers = usersWithPoints
        .filter(user => user.points > 0)
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

      console.log('[Leaderboard] Filtered and sorted users:', sortedUsers);
      console.log('[Leaderboard] Final count:', sortedUsers.length);
      setLeaderboardData(sortedUsers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
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

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <View style={[styles.leaderboardItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: theme.textPrimary }]}>
          #{item.rank}
        </Text>
      </View>
      
      {/* Avatar */}
      {item.avatar_url ? (
        <Image 
          source={{ uri: item.avatar_url }} 
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
          <Ionicons name="person" size={20} color={theme.textSecondary} />
        </View>
      )}
      
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {item.username}
          </Text>
          {item.rank <= 3 && (
            <View style={[styles.medalContainer, { backgroundColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>
              <Ionicons name="medal" size={12} color="#ffffff" />
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.pointsContainer}>
        <Text style={[styles.pointsText, { color: theme.textPrimary }]}>
          {item.points.toLocaleString()} <Text style={[styles.pointsLabel, { color: theme.textSecondary }]}>pts</Text>
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
              Compete
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EA580C"
            colors={['#EA580C']}
          />
        }
      >
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EA580C" />
              </View>
            ) : leaderboardData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No users with points yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={leaderboardData}
                keyExtractor={(item) => item.id}
                renderItem={renderLeaderboardItem}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
}); 