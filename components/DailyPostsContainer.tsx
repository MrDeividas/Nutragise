import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { DailyPostGroup, Post } from '../types/database';
import PostCard from './PostCard';

interface DailyPostsContainerProps {
  dailyGroup: DailyPostGroup;
  onPostPress?: (post: Post) => void;
  onAddPost?: () => void;
}

export default function DailyPostsContainer({ 
  dailyGroup, 
  onPostPress,
  onAddPost 
}: DailyPostsContainerProps) {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getNewPostsCount = () => {
    return dailyGroup.posts.filter(post => {
      // Check if post was created in the last hour for demo purposes
      // In real implementation, this would check against last profile view
      const postTime = new Date(post.created_at).getTime();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return postTime > oneHourAgo;
    }).length;
  };

  const newPostsCount = getNewPostsCount();

  return (
    <View style={styles.container}>
      {/* Daily Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.dateText, { color: theme.textPrimary }]}>
            {formatDate(dailyGroup.date)}
          </Text>
          <Text style={[styles.postCountText, { color: theme.textSecondary }]}>
            {dailyGroup.posts.length} post{dailyGroup.posts.length !== 1 ? 's' : ''}
          </Text>
          {newPostsCount > 0 && (
            <View style={[styles.newIndicator, { backgroundColor: theme.primary }]}>
              <Text style={[styles.newIndicatorText, { color: '#ffffff' }]}>
                {newPostsCount} new
              </Text>
            </View>
          )}
        </View>
        
        {onAddPost && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={onAddPost}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Posts */}
      <View style={styles.postsContainer}>
        {dailyGroup.posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            isNew={index < newPostsCount}
            onPress={() => onPostPress?.(post)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  postCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  newIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsContainer: {
    gap: 8,
  },
});
