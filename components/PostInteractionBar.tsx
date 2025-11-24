import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import PostLikeButton from './PostLikeButton';
import PostCommentButton from './PostCommentButton';
import { useActionStore } from '../state/actionStore';
import { useAuthStore } from '../state/authStore';

interface PostInteractionBarProps {
  postId: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  onCommentPress: () => void;
  size?: 'small' | 'medium' | 'large';
  showCounts?: boolean;
}

export default function PostInteractionBar({
  postId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialIsLiked = false,
  onLikeChange,
  onCommentPress,
  size = 'medium',
  showCounts = true
}: PostInteractionBarProps) {
  const { theme } = useTheme();
  const { trackCoreHabit } = useActionStore();
  const { user } = useAuthStore();

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out my post on Nutrapp! 💪\n\nFollow my journey: nutrapp.com/post/${postId}`,
        title: 'My Post',
      });

      if (result.action === Share.sharedAction) {
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
        return { iconSize: 22, padding: 10 };
    }
  };

  const { iconSize, padding } = getSizeStyles();

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
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
        
        <PostCommentButton
          postId={postId}
          initialCommentCount={initialCommentCount}
          onPress={onCommentPress}
          size={size}
          showCount={showCounts}
        />
        
        <PostLikeButton
          postId={postId}
          initialLikeCount={initialLikeCount}
          initialIsLiked={initialIsLiked}
          onLikeChange={onLikeChange}
          size={size}
          showCount={showCounts}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    borderTopWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    gap: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
