import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
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

function getInitials(username: string) {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase() || '?';
}

export default function LeaderboardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
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

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];

      const usersWithPoints = await Promise.all(
        users.map(async (profileUser) => {
          try {
            let points = 0;

            if (leaderboardPeriod === 'daily') {
              const todayPoints = await pointsService.getTodaysPoints(profileUser.id);
              points = todayPoints?.total || 0;
            } else if (leaderboardPeriod === 'weekly') {
              points = await pointsService.getPointsBetweenDates(profileUser.id, lastWeekStr, todayStr);
            } else if (leaderboardPeriod === 'monthly') {
              points = await pointsService.getPointsBetweenDates(profileUser.id, lastMonthStr, todayStr);
            }

            return {
              id: profileUser.id,
              username: profileUser.username || 'Unknown',
              points,
              avatar_url: profileUser.avatar_url,
            };
          } catch (err) {
            console.error(`Error fetching points for user ${profileUser.id}:`, err);
            return {
              id: profileUser.id,
              username: profileUser.username || 'Unknown',
              points: 0,
              avatar_url: profileUser.avatar_url,
            };
          }
        })
      );

      const sortedUsers = usersWithPoints
        .sort((a, b) => b.points - a.points)
        .map((profileUser, index) => ({
          ...profileUser,
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

  const renderLeaderboardItem = (item: LeaderboardUser) => {
    const isCurrentUser = !!user && item.id === user.id;

    return (
      <View
        style={[
          styles.leaderboardItem,
          isCurrentUser
            ? {
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderColor: theme.primary,
                borderWidth: 1.5,
              }
            : {
                backgroundColor: '#FFFFFF',
                borderColor: '#EEF0F3',
                borderWidth: 1,
              },
        ]}
      >
        <Text style={[styles.rankText, { color: theme.textPrimary }]}>{item.rank}</Text>

        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{getInitials(item.username)}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              { color: isCurrentUser ? theme.primary : theme.textPrimary },
            ]}
            numberOfLines={1}
          >
            {isCurrentUser ? 'YOU' : item.username}
          </Text>
        </View>

        <Text
          style={[
            styles.pointsText,
            { color: isCurrentUser ? theme.primary : theme.textPrimary },
          ]}
        >
          {item.points.toLocaleString()}
        </Text>
      </View>
    );
  };

  const renderLeaderboardTab = (period: 'daily' | 'weekly' | 'monthly', label: string) => {
    const active = leaderboardPeriod === period;
    return (
      <TouchableOpacity
        style={[
          styles.leaderboardTab,
          active
            ? { backgroundColor: theme.primary }
            : { backgroundColor: '#F1F3F5' },
        ]}
        onPress={() => setLeaderboardPeriod(period)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.leaderboardTabText,
            { color: active ? '#FFFFFF' : '#6B7280' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const listUsers = leaderboardData.length > 3 ? leaderboardData.slice(3) : [];

  return (
    <CustomBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Leaderboard</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.content, { backgroundColor: 'transparent' }]}>
          <View style={styles.leaderboardTabs}>
            {renderLeaderboardTab('daily', 'Daily')}
            {renderLeaderboardTab('weekly', 'Weekly')}
            {renderLeaderboardTab('monthly', 'Monthly')}
          </View>

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
              <Podium
                users={[
                  leaderboardData[1] || null,
                  leaderboardData[0] || null,
                  leaderboardData[2] || null,
                ]}
                currentUserId={user?.id}
              />

              {listUsers.length > 0 && (
                <View style={styles.listContainer}>
                  <View style={styles.listHeader}>
                    <Text style={[styles.listHeaderText, styles.listHeaderRank]}>#</Text>
                    <Text style={[styles.listHeaderText, styles.listHeaderPlayer]}>PLAYER</Text>
                    <Text style={[styles.listHeaderText, styles.listHeaderPoints]}>POINTS</Text>
                  </View>

                  {listUsers.map((item) => (
                    <View key={item.id}>{renderLeaderboardItem(item)}</View>
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
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  leaderboardTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  leaderboardTabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  leaderboardScrollView: {
    flex: 1,
  },
  leaderboardContentContainer: {
    paddingBottom: 32,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  listHeaderRank: {
    width: 28,
  },
  listHeaderPlayer: {
    flex: 1,
    marginLeft: 8,
  },
  listHeaderPoints: {
    textAlign: 'right',
    minWidth: 64,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rankText: {
    width: 28,
    fontSize: 18,
    fontWeight: '800',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 48,
    textAlign: 'right',
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
});
