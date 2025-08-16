import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { useTheme } from '../state/themeStore';



export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch recent followers (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: followers, error } = await supabase
        .from('followers')
        .select('created_at, follower_id')
        .eq('following_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Transform followers into notifications
      const followerNotifications = (followers || []).map((follower: any) => ({
        id: `follow_${follower.follower_id}`,
        type: 'follow',
        name: 'New Follower', // We'll update this with real data if available
        avatar: null,
        message: 'started following you',
        time: getTimeAgo(follower.created_at),
        created_at: follower.created_at,
        follower_id: follower.follower_id
      }));

      // Try to fetch profile data for followers if we have any
      if (followerNotifications.length > 0) {
        const followerIds = followerNotifications.map(n => n.follower_id);
        try {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', followerIds);

          if (!profilesError && profiles) {
            // Update notifications with real profile data
            followerNotifications.forEach(notification => {
              const profile = profiles.find(p => p.id === notification.follower_id);
              if (profile) {
                notification.name = profile.display_name || profile.username || 'Unknown User';
                notification.avatar = profile.avatar_url;
              }
            });
          }
        } catch (profileError) {
          console.error('Error fetching profile data:', profileError);
        }
      }

      // Set notifications to only real follower notifications
      setNotifications(followerNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    // For older notifications, show the actual date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDetailedTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupNotificationsByTime = (notifications: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      last30Days: [] as any[],
      older: [] as any[]
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      const notificationDay = new Date(notificationDate.getFullYear(), notificationDate.getMonth(), notificationDate.getDate());

      if (notificationDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= last30Days) {
        groups.last30Days.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Notification List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          renderItem={({ item, index }) => {
            const groups = groupNotificationsByTime(notifications);
            const notificationDate = new Date(item.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const last30Days = new Date(today);
            last30Days.setDate(last30Days.getDate() - 30);
            
            let showHeader = false;
            let headerTitle = '';
            
            // Check if this is the first notification or if we need a header
            if (index === 0) {
              showHeader = true;
              if (notificationDate.toDateString() === today.toDateString()) {
                headerTitle = 'Today';
              } else if (notificationDate.toDateString() === yesterday.toDateString()) {
                headerTitle = 'Yesterday';
              } else if (notificationDate >= last30Days) {
                headerTitle = 'Last 30 days';
              } else {
                headerTitle = 'Older';
              }
            } else {
              // Check if we need a header based on the previous notification
              const prevNotification = notifications[index - 1];
              const prevDate = new Date(prevNotification.created_at);
              
              if (notificationDate.toDateString() !== prevDate.toDateString()) {
                showHeader = true;
                if (notificationDate.toDateString() === today.toDateString()) {
                  headerTitle = 'Today';
                } else if (notificationDate.toDateString() === yesterday.toDateString()) {
                  headerTitle = 'Yesterday';
                } else if (notificationDate >= last30Days) {
                  headerTitle = 'Last 30 days';
                } else {
                  headerTitle = 'Older';
                }
              }
            }
            
            return (
              <>
                {showHeader && (
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                      {headerTitle}
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.card}
                  onPress={() => {
                    Alert.alert(
                      'Follow Details',
                      `${item.name} started following you on ${getDetailedTime(item.created_at)}`,
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: theme.textTertiary }]}>
                      <Ionicons name="person" size={20} color={theme.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.message, { color: theme.textSecondary }]}>{item.message}</Text>
                  </View>
                  <Text style={[styles.time, { color: theme.textTertiary }]}>{item.time}</Text>
                </TouchableOpacity>
              </>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                You'll see notifications here when people interact with you
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20, // match ProfileScreen
    fontWeight: '600', // match ProfileScreen
    color: '#1f2937',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  headerIcons: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellContainer: {
    position: 'relative',
    marginLeft: 12,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff5a5f',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    margin: 16,
    padding: 4,
    alignSelf: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#129490',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff5a5f',
    marginLeft: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  detailedTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  time: {
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 12,
    minWidth: 60,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
}); 