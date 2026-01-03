import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Challenge, ChallengeCardProps } from '../types/challenges';
import { useTheme } from '../state/themeStore';

const { width } = Dimensions.get('window');
const horizontalPadding = 24 * 2;
const gap = 12; // Match habit card width calculation
const CARD_WIDTH = Math.max(160, (width - horizontalPadding - gap) / 2);

export default function ChallengeCard({ challenge, onPress, isJoined, isCompleted }: ChallengeCardProps) {
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
    // Calculate actual duration in days
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // If it's a same-day challenge
    if (startDate.toDateString() === endDate.toDateString()) {
      return '1 day';
    }
    
    if (diffDays < 7) {
      return `${diffDays + 1} days`;
    }

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
    
    // Set end date to end of day to include the full last day
    endDate.setHours(23, 59, 59, 999);
    
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
  
  // Use dark purple for private challenges, otherwise use category color
  const sectionColor = challenge.visibility === 'private' ? '#4B0082' : categoryColor;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
      onPress={() => onPress(challenge)}
      activeOpacity={0.8}
    >
      {/* Blue Section */}
      <View style={[styles.blueSection, { backgroundColor: sectionColor }]} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
            {challenge.title}
          </Text>
          <View style={styles.topBadgesRow}>
            {challenge.approval_status === 'pending' ? (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={14} color="#F59E0B" />
                <Text style={styles.pendingText}>Pending Review</Text>
              </View>
            ) : challenge.approval_status === 'rejected' ? (
              <View style={styles.rejectedBadge}>
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text style={styles.rejectedText}>Rejected</Text>
              </View>
            ) : isCompleted ? (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-done-circle" size={14} color="#F59E0B" />
              <Text style={styles.doneText}>Done</Text>
            </View>
          ) : isJoined ? (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : null}
          <View style={styles.participantsContainerAction}>
            <Ionicons name="people" size={14} color={theme.textSecondary} />
            <Text style={[styles.participantsTextAction, { color: theme.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>{challenge.participant_count || 0}</Text>
            </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: sectionColor }]}>
              <Ionicons name={challenge.visibility === 'private' ? 'lock-closed-outline' : categoryIcon} size={12} color="#FFFFFF" />
              <Text style={styles.tagText}>{challenge.visibility === 'private' ? 'Private' : challenge.category}</Text>
            </View>
            <View style={[styles.durationBadge, { backgroundColor: sectionColor }]}>
              <Text style={styles.durationBadgeText}>
                {formatDuration(challenge.duration_weeks)}
              </Text>
            </View>
          </View>

          <Text style={[styles.timeRemaining, { color: 'rgba(255,255,255,0.9)' }]}>
            {getTimeRemaining()}
          </Text>

          <View style={styles.feeContainer}>
            <Text style={[styles.feeText, { color: 'rgba(255,255,255,0.9)' }]}>
              {formatEntryFee(challenge.entry_fee)} challenge
            </Text>
            <Text style={[styles.potText, { color: 'rgba(255,255,255,0.9)' }]}>
              £{(challenge.participant_count || 0) * challenge.entry_fee} shared pot
            </Text>
          </View>

          {/* Pro Badge (Bottom Right) */}
          {challenge.is_pro_only && (
            <View style={styles.proBadge}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10, // Match habit card spacing
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  blueSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  topSection: {
    height: '40%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomSection: {
    height: '60%',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    marginLeft: 0,
    paddingLeft: 0,
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 8,
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
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantsContainerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  participantsTextAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rejectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  feeContainer: {
    alignItems: 'flex-start',
  },
  feeText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  potText: {
    fontSize: 12,
    fontWeight: '500',
  },
  proBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
