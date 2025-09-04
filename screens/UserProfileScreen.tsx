import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useSocialStore } from '../state/socialStore';
import { socialService, Profile } from '../lib/socialService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type UserProfileStackParamList = {
  UserProfile: { userId: string; username: string };
};

type Props = NativeStackScreenProps<UserProfileStackParamList, 'UserProfile'>;

export default function UserProfileScreen({ navigation, route }: Props) {
  const { userId, username } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { followUser, unfollowUser, isLoading } = useSocialStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profileData = await socialService.getProfile(userId);
      setProfile(profileData);

      if (user && profileData) {
        // Check if current user is following this profile
        const followingStatus = await socialService.isFollowing(user.id, userId);
        setIsFollowing(followingStatus);

        // Get follower/following counts
        const followers = await socialService.getFollowerCount(userId);
        const following = await socialService.getFollowingCount(userId);
        setFollowerCount(followers);
        setFollowingCount(following);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !profile || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      let success = false;
      if (isFollowing) {
        success = await unfollowUser(user.id, userId);
        if (success) {
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
        }
      } else {
        success = await followUser(user.id, userId);
        if (success) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
      }

      if (!success) {
        Alert.alert('Error', `Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Profile not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {profile.display_name || profile.username}
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profilePicture} />
            ) : (
              <View style={[styles.profilePicturePlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
                <Ionicons name="person" size={40} color={theme.textSecondary} />
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={[styles.displayName, { color: theme.textPrimary }]}>
              {profile.display_name || profile.username}
            </Text>
            <Text style={[styles.username, { color: theme.textSecondary }]}>
              @{profile.username}
            </Text>
            {profile.bio && (
              <Text style={[styles.bio, { color: theme.textSecondary }]}>
                {profile.bio}
              </Text>
            )}
          </View>

          {/* Follow Button */}
          {user && user.id !== userId && (
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={isFollowLoading}
              style={[
                styles.followButton,
                {
                  backgroundColor: isFollowing ? 'rgba(128, 128, 128, 0.3)' : theme.primary,
                  opacity: isFollowLoading ? 0.7 : 1,
                },
              ]}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
              {followerCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Followers
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
              {followingCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Following
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
              {profile.completed_competitions || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Competitions
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
              {profile.won_awards || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Awards
            </Text>
          </View>
        </View>

        {/* Additional Info */}
        {(profile.height || profile.age) && (
          <View style={[styles.infoCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
              Additional Info
            </Text>
            <View style={styles.infoRow}>
              {profile.height && (
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Height</Text>
                  <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{profile.height}</Text>
                </View>
              )}
              {profile.age && (
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Age</Text>
                  <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{profile.age}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
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
  profileCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  profilePictureContainer: {
    marginBottom: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
  },
  infoCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 