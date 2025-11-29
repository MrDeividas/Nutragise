import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';
import { pointsService } from '../lib/pointsService';
import CustomBackground from '../components/CustomBackground';
import Podium from '../components/Podium';

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  rank: number;
  avatar_url?: string;
}

export default function LeaderboardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      
      if (!users || users.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      // Fetch points for each user
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];
      
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];

      const usersWithPoints = await Promise.all(
        users.map(async (user) => {
          try {
            let points = 0;
            
            if (leaderboardPeriod === 'daily') {
              // Get today's points
              const todayPoints = await pointsService.getTodaysPoints(user.id);
              points = todayPoints?.total || 0;
            } else if (leaderboardPeriod === 'weekly') {
              points = await pointsService.getPointsBetweenDates(user.id, lastWeekStr, todayStr);
            } else if (leaderboardPeriod === 'monthly') {
              points = await pointsService.getPointsBetweenDates(user.id, lastMonthStr, todayStr);
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

      // Filter out users with 0 points and sort by points
      const sortedUsers = usersWithPoints
        // .filter(user => user.points > 0) // Show all users even with 0 points to ensure current user sees themselves
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

      setLeaderboardData(sortedUsers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <View style={[styles.leaderboardItem, { 
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }]}>
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
        <View style={[styles.avatar, { backgroundColor: '#F3F4F6' }]}>
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
        { color: leaderboardPeriod === period ? theme.primary : theme.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Leaderboard
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: 'transparent' }]}>
          {/* Leaderboard Tabs */}
          <View style={styles.leaderboardTabs}>
            {renderLeaderboardTab('daily', 'Daily')}
            {renderLeaderboardTab('weekly', 'Weekly')}
            {renderLeaderboardTab('monthly', 'Monthly')}
          </View>

          {/* Leaderboard Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No users with points yet
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.leaderboardScrollView}
              contentContainerStyle={styles.leaderboardContentContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
            >
              {/* Podium for Top 3 (Show even if fewer than 3 users) */}
              {leaderboardData.length > 0 && (
                <Podium
                  users={[
                    leaderboardData[1] || null, // 2nd place (left)
                    leaderboardData[0] || null, // 1st place (center)
                    leaderboardData[2] || null, // 3rd place (right)
                  ]}
                />
              )}

              {/* List for positions 4+ */}
              {leaderboardData.length > 3 && (
                <View style={styles.listContainer}>
                  {leaderboardData.slice(3).map((item) => (
                    <View key={item.id}>
                      {renderLeaderboardItem({ item, index: item.rank - 1 })}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  leaderboardTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 28,
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
  leaderboardScrollView: {
    flex: 1,
  },
  leaderboardContentContainer: {
    paddingBottom: 24,
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
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
