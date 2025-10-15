import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import DailyPostLikeButton from './DailyPostLikeButton';
import PostCommentButton from './PostCommentButton';
import { useActionStore } from '../state/actionStore';
import { useAuthStore } from '../state/authStore';

interface DailyPostInteractionBarProps {
  dailyPostId: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  onCommentPress: () => void;
  size?: 'small' | 'medium' | 'large';
  showCounts?: boolean;
}

export default function DailyPostInteractionBar({
  dailyPostId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialIsLiked = false,
  onLikeChange,
  onCommentPress,
  size = 'medium',
  showCounts = true
}: DailyPostInteractionBarProps) {
  const { theme } = useTheme();
  const { trackCoreHabit } = useActionStore();
  const { user } = useAuthStore();

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out my daily progress on Nutrapp! 💪\n\nFollow my journey: nutrapp.com/post/${dailyPostId}`,
        title: 'My Daily Progress',
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully
        if (user) {
          const success = await trackCoreHabit('share');
          if (success) {
            Alert.alert('Success', 'Shared! +15 points earned 🎉');
          } else {
            Alert.alert('Already Shared', 'You already shared today! Points are awarded once per day.');
          }
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, padding: 8 };
      case 'large':
        return { iconSize: 24, padding: 12 };
      default:
        return { iconSize: 20, padding: 10 };
    }
  };

  const { iconSize, padding } = getSizeStyles();

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <DailyPostLikeButton
          dailyPostId={dailyPostId}
          initialLikeCount={initialLikeCount}
          initialIsLiked={initialIsLiked}
          onLikeChange={onLikeChange}
          size={size}
          showCount={showCounts}
        />
        
        <PostCommentButton
          postId={dailyPostId}
          initialCommentCount={initialCommentCount}
          onPress={onCommentPress}
          size={size}
          showCount={showCounts}
        />

        <TouchableOpacity
          style={[styles.shareButton, { padding }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="share-outline" 
            size={iconSize} 
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
