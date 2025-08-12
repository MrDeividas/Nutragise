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

type FollowingStackParamList = {
  Following: { userId: string; username: string };
  UserProfile: { userId: string; username: string };
};

type Props = NativeStackScreenProps<FollowingStackParamList, 'Following'>;

export default function FollowingScreen({ navigation, route }: Props) {
  const { userId, username } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { following, fetchFollowing, unfollowUser, isLoading } = useSocialStore();

  useEffect(() => {
    fetchFollowing(userId);
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

  const renderFollowing = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={[styles.followingItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
      onPress={() => {
        navigation.navigate('UserProfile', {
          userId: item.id,
          username: item.username,
        });
      }}
    >
      <View style={styles.followingInfo}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
            <Ionicons name="person" size={24} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.followingDetails}>
          <Text style={[styles.followingName, { color: theme.textPrimary }]}>
            {item.display_name || item.username}
          </Text>
          <Text style={[styles.followingUsername, { color: theme.textSecondary }]}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={[styles.followingBio, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      {user && user.id === userId && (
        <TouchableOpacity
          onPress={() => handleUnfollow(item.id, item.username)}
          style={[styles.unfollowButton, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}
        >
          <Text style={[styles.unfollowButtonText, { color: '#dc2626' }]}>
            Unfollow
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        Not following anyone yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        When you follow people, they'll appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Following
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading following...
          </Text>
        </View>
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
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  followingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingDetails: {
    flex: 1,
  },
  followingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  followingUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  followingBio: {
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