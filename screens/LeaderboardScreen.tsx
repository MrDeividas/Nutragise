import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
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

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

function getInitials(username: string) {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase() || '?';
}

const DARK = '#1f2937';

export default function LeaderboardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('daily');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [segmentTrackWidth, setSegmentTrackWidth] = useState(0);
  const segmentIndicatorX = useRef(new Animated.Value(0)).current;
  const segmentHasPositioned = useRef(false);

  const segmentIndex = PERIODS.findIndex((p) => p.key === leaderboardPeriod);
  const segmentTabWidth = segmentTrackWidth > 0 ? segmentTrackWidth / PERIODS.length : 0;

  useEffect(() => {
    if (segmentTabWidth <= 0) return;
    const toValue = Math.max(0, segmentIndex) * segmentTabWidth;
    if (!segmentHasPositioned.current) {
      segmentHasPositioned.current = true;
      segmentIndicatorX.setValue(toValue);
      return;
    }
    Animated.spring(segmentIndicatorX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [segmentIndex, segmentTabWidth, segmentIndicatorX]);

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

      const { enrichProfilesWithAvatars } = await import('../lib/avatarUtils');
      const profilesWithAvatars = await enrichProfilesWithAvatars(users);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];

      const usersWithPoints = await Promise.all(
        profilesWithAvatars.map(async (profileUser) => {
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
              avatar_url: profileUser.avatar_url || undefined,
            };
          } catch (err) {
            console.error(`Error fetching points for user ${profileUser.id}:`, err);
            return {
              id: profileUser.id,
              username: profileUser.username || 'Unknown',
              points: 0,
              avatar_url: profileUser.avatar_url || undefined,
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
                backgroundColor: 'rgba(31, 41, 55, 0.08)',
                borderColor: DARK,
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
            style={[styles.userName, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {isCurrentUser ? 'YOU' : item.username}
          </Text>
        </View>

        <Text style={[styles.pointsText, { color: theme.textPrimary }]}>
          {item.points.toLocaleString()}
        </Text>
      </View>
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
          <View style={styles.segmentPad}>
            <View
              style={styles.segmentBar}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width - 8;
                if (w > 0 && Math.abs(w - segmentTrackWidth) > 0.5) {
                  setSegmentTrackWidth(w);
                }
              }}
            >
              {segmentTabWidth > 0 && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentIndicator,
                    {
                      width: segmentTabWidth,
                      transform: [{ translateX: segmentIndicatorX }],
                    },
                  ]}
                />
              )}
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={styles.segment}
                  onPress={() => setLeaderboardPeriod(period.key)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      leaderboardPeriod === period.key && styles.segmentTextActive,
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={DARK} />
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
                  tintColor={DARK}
                  colors={[DARK]}
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
  segmentPad: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'visible',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: DARK,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  segmentText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  leaderboardScrollView: {
    flex: 1,
  },
  leaderboardContentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  listHeaderRank: {
    width: 36,
  },
  listHeaderPlayer: {
    flex: 1,
    marginLeft: 52,
  },
  listHeaderPoints: {
    width: 72,
    textAlign: 'right',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  rankText: {
    width: 36,
    fontSize: 15,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
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
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'right',
  },
});
