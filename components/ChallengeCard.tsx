import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Challenge, ChallengeCardProps } from '../types/challenges';
import { useTheme } from '../state/themeStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; // 75% of screen width

export default function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const { theme } = useTheme();

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fitness':
        return '#10B981'; // Green
      case 'wellness':
        return '#8B5CF6'; // Purple
      case 'nutrition':
        return '#F59E0B'; // Amber
      case 'mindfulness':
        return '#06B6D4'; // Cyan
      case 'learning':
        return '#EF4444'; // Red
      case 'creativity':
        return '#EC4899'; // Pink
      case 'productivity':
        return '#6366F1'; // Indigo
      default:
        return '#6B7280'; // Gray
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fitness':
        return 'fitness-outline';
      case 'wellness':
        return 'heart-outline';
      case 'nutrition':
        return 'restaurant-outline';
      case 'mindfulness':
        return 'leaf-outline';
      case 'learning':
        return 'book-outline';
      case 'creativity':
        return 'brush-outline';
      case 'productivity':
        return 'checkmark-circle-outline';
      default:
        return 'trophy-outline';
    }
  };

  const formatDuration = (weeks: number) => {
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  };

  const formatEntryFee = (fee: number) => {
    if (fee === 0) return 'Free';
    return `£${fee}`;
  };

  // Calculate time until start (for upcoming) or until end (for active)
  const getTimeRemaining = () => {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    // Check if challenge is upcoming
    if (now < startDate) {
      // Time until start
      const diffMs = startDate.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `Starts in ${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `Starts in ${hours}h ${minutes}m`;
      } else {
        return `Starts in ${minutes}m`;
      }
    } else {
      // Time until end (active challenge)
      const diffMs = endDate.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffMs <= 0) return 'Challenge ended';
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m left`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m left`;
      } else if (minutes > 0) {
        return `${minutes}m left`;
      } else {
        return 'Less than 1m left';
      }
    }
  };

  const categoryColor = getCategoryColor(challenge.category);
  const categoryIcon = getCategoryIcon(challenge.category);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: `${categoryColor}20` }]}
      onPress={() => onPress(challenge)}
      activeOpacity={0.8}
    >
      {/* Background Image */}
      {challenge.image_url && (
        <Image
          source={{ uri: challenge.image_url }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}
      
      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: categoryColor }]}>
            <Ionicons name={categoryIcon} size={12} color="#FFFFFF" />
            <Text style={styles.tagText}>{challenge.category}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.tagText, { color: categoryColor }]}>
              {formatEntryFee(challenge.entry_fee)}
            </Text>
          </View>
        </View>

        {/* Time Remaining / Duration */}
        <Text style={[styles.timeRemaining, { color: categoryColor }]}>
          {getTimeRemaining()}
        </Text>
        <Text style={[styles.duration, { color: theme.textSecondary }]}>
          {formatDuration(challenge.duration_weeks)}
        </Text>

        {/* Title */}
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {challenge.title}
        </Text>

        {/* Participants */}
        <View style={styles.participantsContainer}>
          <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.participantsText, { color: theme.textSecondary }]}>
            {challenge.participant_count || 0} participants
          </Text>
        </View>

        {/* Entry Fee Display */}
        <View style={styles.feeContainer}>
          <Text style={[styles.feeText, { color: categoryColor }]}>
            {formatEntryFee(challenge.entry_fee)} investment
          </Text>
          <Text style={[styles.potText, { color: theme.textSecondary }]}>
            £{(challenge.participant_count || 0) * challenge.entry_fee} shared pot
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeRemaining: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
    flex: 1,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  participantsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feeContainer: {
    alignItems: 'flex-start',
  },
  feeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  potText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
