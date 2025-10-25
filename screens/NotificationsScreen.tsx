import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { useTheme } from '../state/themeStore';
import { notificationService, Notification } from '../lib/notificationService';



export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivityCollapsed, setRecentActivityCollapsed] = useState(true);
  const [actionTipsCollapsed, setActionTipsCollapsed] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch notifications from our notifications table
      const notifications = await notificationService.getNotifications(user.id, 50);
      
      // Transform notifications into the expected format
      const transformedNotifications = notifications.map((notification: Notification) => {
        let message = '';
        let type = notification.notification_type;
        
        switch (notification.notification_type) {
          case 'post_like':
            message = 'liked your post';
            break;
          case 'post_comment':
            message = notification.comment_content 
              ? `commented: "${notification.comment_content}"`
              : 'commented on your post';
            break;
          case 'post_reply':
            message = notification.reply_content 
              ? `replied: "${notification.reply_content}"`
              : 'replied to your comment';
            break;
          case 'follow':
            message = 'started following you';
            break;
          default:
            message = 'interacted with your content';
        }
        
        return {
          id: notification.id,
          type: type,
          name: notification.from_user?.display_name || notification.from_user?.username || 'Unknown User',
          avatar: notification.from_user?.avatar_url || null,
          message: message,
          time: getTimeAgo(notification.created_at),
          created_at: notification.created_at,
          is_read: notification.is_read,
          post_id: notification.post_id,
          comment_id: notification.comment_id,
          reply_id: notification.reply_id,
          goal_id: notification.goal_id
        };
      });
      
      // Set notifications
      setNotifications(transformedNotifications);
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
    // Mark notifications as read when screen is opened
    if (user) {
      notificationService.markAllAsRead(user.id);
    }
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
          contentContainerStyle={{ padding: 12 }}
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

      {/* Recent Activity Section */}
      <View style={[styles.sectionHeader, { paddingLeft: 32 }]}>
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => setRecentActivityCollapsed(!recentActivityCollapsed)}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Recent Activity</Text>
          <Ionicons 
            name={recentActivityCollapsed ? "chevron-down" : "chevron-up"} 
            size={16} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      {!recentActivityCollapsed && (
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: theme.backgroundTertiary }]}>
              <Ionicons name="checkmark-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Completed workout goal</Text>
              <Text style={[styles.activityTime, { color: theme.textTertiary }]}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: theme.backgroundTertiary }]}>
              <Ionicons name="camera-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Added photo to meditation goal</Text>
              <Text style={[styles.activityTime, { color: theme.textTertiary }]}>5 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: theme.backgroundTertiary }]}>
              <Ionicons name="add-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Created new reading goal</Text>
              <Text style={[styles.activityTime, { color: theme.textTertiary }]}>1 day ago</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Tips Section */}
      <View style={[styles.sectionHeader, { paddingLeft: 32 }]}>
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => setActionTipsCollapsed(!actionTipsCollapsed)}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Action Tips</Text>
          <Ionicons 
            name={actionTipsCollapsed ? "chevron-down" : "chevron-up"} 
            size={16} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      {!actionTipsCollapsed && (
        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={24} color={theme.textSecondary} />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>Break big goals into smaller, manageable tasks</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="time-outline" size={24} color={theme.textSecondary} />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>Set specific time blocks for your goals</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="trophy-outline" size={24} color={theme.textSecondary} />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>Celebrate small wins to stay motivated</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 34, // Add bottom padding for home indicator
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
    fontSize: 28,
    fontWeight: '700',
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
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  message: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  detailedTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 12,
    minWidth: 50,
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
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityList: {
    marginTop: 0,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#6b7280',
  },
  tipsContainer: {
    marginTop: 0,
    paddingHorizontal: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    marginLeft: 14,
    flex: 1,
    color: '#6b7280',
    lineHeight: 18,
  },
}); 