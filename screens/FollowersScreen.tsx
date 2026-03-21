import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useSocialStore } from '../state/socialStore';
import { Profile } from '../lib/socialService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomBackground from '../components/CustomBackground';

type FollowersStackParamList = {
  Followers: { userId: string; username: string; initialTab?: 'followers' | 'following' };
  UserProfile: { userId: string; username: string };
};

type Props = NativeStackScreenProps<FollowersStackParamList, 'Followers'>;

export default function FollowersScreen({ navigation, route }: Props) {
  const { userId, username, initialTab = 'followers' } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { followers, following, fetchFollowers, fetchFollowing, unfollowUser, isLoading } = useSocialStore();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFollowers(userId);
      fetchFollowing(userId);
    }, 0);
    return () => clearTimeout(timer);
  }, [userId]);

  const handleUnfollow = async (followingId: string, followingUsername: string) => {
    if (!user) return;
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow @${followingUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            const success = await unfollowUser(user.id, followingId);
            if (!success) {
              Alert.alert('Error', 'Failed to unfollow user');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFollower = async (followerId: string, followerUsername: string) => {
    if (!user) return;
    Alert.alert(
      'Remove Follower',
      `Remove @${followerUsername} from your followers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await unfollowUser(followerId, user.id);
            if (!success) {
              Alert.alert('Error', 'Failed to remove follower');
              return;
            }
            await fetchFollowers(user.id);
          },
        },
      ]
    );
  };

  const renderFollower = ({ item }: { item: Profile }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={styles.itemInfo}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
        activeOpacity={0.7}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
            <Ionicons name="person" size={24} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: theme.textPrimary }]}>
            {item.display_name || item.username}
          </Text>
          <Text style={[styles.itemUsername, { color: theme.textSecondary }]}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={[styles.itemBio, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleRemoveFollower(item.id, item.username)}
        style={[styles.unfollowButton, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}
      >
        <Text style={[styles.unfollowButtonText, { color: '#dc2626' }]}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFollowing = ({ item }: { item: Profile }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={styles.itemInfo}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
        activeOpacity={0.7}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
            <Ionicons name="person" size={24} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: theme.textPrimary }]}>
            {item.display_name || item.username}
          </Text>
          <Text style={[styles.itemUsername, { color: theme.textSecondary }]}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={[styles.itemBio, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleUnfollow(item.id, item.username)}
        style={[styles.unfollowButton, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}
      >
        <Text style={[styles.unfollowButtonText, { color: '#dc2626' }]}>Unfollow</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {activeTab === 'followers'
          ? "When people follow you, they'll appear here"
          : "When you follow people, they'll appear here"}
      </Text>
    </View>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            @{username}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
            onPress={() => setActiveTab('followers')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'followers' ? theme.textPrimary : theme.textSecondary },
              activeTab === 'followers' && styles.tabTextActive,
            ]}>
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.tabActive]}
            onPress={() => setActiveTab('following')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'following' ? theme.textPrimary : theme.textSecondary },
              activeTab === 'following' && styles.tabTextActive,
            ]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading...
            </Text>
          </View>
        ) : activeTab === 'followers' ? (
          <FlatList
            data={followers}
            renderItem={renderFollower}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
          />
        ) : (
          <FlatList
            data={following}
            renderItem={renderFollowing}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
          />
        )}
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemBio: {
    fontSize: 12,
    lineHeight: 16,
  },
  unfollowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  unfollowButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
