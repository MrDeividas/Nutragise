import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { Post } from '../types/database';

interface PostCardProps {
  post: Post;
  isNew?: boolean;
  onPress?: () => void;
}

const habitIcons = {
  sleep: 'moon-outline',
  water: 'water-outline',
  run: 'walk-outline',
  gym: 'barbell-outline',
  reflect: 'bulb-outline',
  cold_shower: 'snow-outline',
};

export default function PostCard({ post, isNew = false, onPress }: PostCardProps) {
  const { theme } = useTheme();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getHabitColor = (habitKey: string) => {
    // Check if habit has photo evidence (red/pink)
    if (post.photos.length > 0 && post.habits_completed.includes(habitKey)) {
      return '#ef4444'; // Red for verified habits
    }
    // Check if habit is completed (green)
    if (post.habits_completed.includes(habitKey)) {
      return '#10B981'; // Green for completed habits
    }
    // Default grey for incomplete
    return 'rgba(255, 255, 255, 0.5)';
  };

  const renderMoodEnergy = () => {
    if (!post.mood_rating && !post.energy_level) return null;

    return (
      <View style={styles.moodEnergyContainer}>
        {post.mood_rating && (
          <View style={styles.moodEnergyItem}>
            <Ionicons name="happy-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.moodEnergyText, { color: theme.textSecondary }]}>
              Mood: {post.mood_rating}/5
            </Text>
          </View>
        )}
        {post.energy_level && (
          <View style={styles.moodEnergyItem}>
            <Ionicons name="flash-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.moodEnergyText, { color: theme.textSecondary }]}>
              Energy: {post.energy_level}/5
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(post.created_at)}
          </Text>
          {isNew && (
            <View style={[styles.newBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.newBadgeText, { color: '#ffffff' }]}>NEW</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.contentText, { color: theme.textPrimary }]}>
          {post.content}
        </Text>
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.caption}>
          <Text style={[styles.captionText, { color: theme.textSecondary }]}>
            {post.caption}
          </Text>
        </View>
      )}

      {/* Photos */}
      {post.photos.length > 0 && (
        <View style={styles.photosContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {post.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Habits */}
      {post.habits_completed.length > 0 && (
        <View style={styles.habitsContainer}>
          <Text style={[styles.habitsTitle, { color: theme.textSecondary }]}>
            Habits Completed:
          </Text>
          <View style={styles.habitsGrid}>
            {post.habits_completed.map(habit => (
              <View key={habit} style={styles.habitItem}>
                <Ionicons 
                  name={habitIcons[habit as keyof typeof habitIcons] as any} 
                  size={16} 
                  color={getHabitColor(habit)} 
                />
                <Text style={[styles.habitText, { color: getHabitColor(habit) }]}>
                  {habit.replace('_', ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mood & Energy */}
      {renderMoodEnergy()}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.borderSecondary }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            {post.photos.length} photo{post.photos.length !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            {post.habits_completed.length} habit{post.habits_completed.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  captionText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  photosContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  habitsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  habitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  moodEnergyContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  moodEnergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moodEnergyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  footerText: {
    fontSize: 12,
  },
});
