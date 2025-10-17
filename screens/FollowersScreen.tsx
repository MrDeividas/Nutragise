import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
  Followers: { userId: string; username: string };
  UserProfile: { userId: string; username: string };
};

type Props = NativeStackScreenProps<FollowersStackParamList, 'Followers'>;

export default function FollowersScreen({ navigation, route }: Props) {
  const { userId, username } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { followers, fetchFollowers, isLoading } = useSocialStore();

  // Optimized initialization - defer data fetching to avoid blocking navigation animation
  useEffect(() => {
    // Use setTimeout to move heavy operations to next tick
    const timer = setTimeout(() => {
      fetchFollowers(userId);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [userId]);

  const renderFollower = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={[styles.followerItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
      onPress={() => {
        navigation.navigate('UserProfile', {
          userId: item.id,
          username: item.username,
        });
      }}
    >
      <View style={styles.followerInfo}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
            <Ionicons name="person" size={24} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.followerDetails}>
          <Text style={[styles.followerName, { color: theme.textPrimary }]}>
            {item.display_name || item.username}
          </Text>
          <Text style={[styles.followerUsername, { color: theme.textSecondary }]}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={[styles.followerBio, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        No followers yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        When people follow you, they'll appear here
      </Text>
    </View>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Followers
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading followers...
            </Text>
          </View>
        ) : (
          <FlatList
            data={followers}
            renderItem={renderFollower}
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
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  followerInfo: {
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
  followerDetails: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  followerUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  followerBio: {
    fontSize: 12,
    lineHeight: 16,
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