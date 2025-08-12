import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { goalInteractionsService } from '../lib/goalInteractions';

interface CommentLikeButtonProps {
  commentId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function CommentLikeButton({
  commentId,
  initialLikeCount = 0,
  initialIsLiked = false,
  onLikeChange,
  size = 'medium',
  showCount = true
}: CommentLikeButtonProps) {
  const { theme } = useTheme();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  // Update state when props change
  useEffect(() => {
    setLikeCount(initialLikeCount);
    setIsLiked(initialIsLiked);
  }, [initialLikeCount, initialIsLiked]);

  const handlePress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    
    // Optimistic update
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setIsLiked(newIsLiked);
    setLikeCount(newCount);
    
    // Notify parent component
    onLikeChange?.(newIsLiked, newCount);

    try {
      const result = await goalInteractionsService.toggleCommentLike(commentId);
      
      if (!result.success) {
        // Revert optimistic update on failure
        setIsLiked(!newIsLiked);
        setLikeCount(newIsLiked ? Math.max(0, newCount - 1) : newCount + 1);
        onLikeChange?.(!newIsLiked, newIsLiked ? Math.max(0, newCount - 1) : newCount + 1);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert optimistic update on error
      setIsLiked(!newIsLiked);
      setLikeCount(newIsLiked ? Math.max(0, newCount - 1) : newCount + 1);
      onLikeChange?.(!newIsLiked, newIsLiked ? Math.max(0, newCount - 1) : newCount + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { iconSize: 14, textSize: 12, padding: 4 },
    medium: { iconSize: 16, textSize: 14, padding: 6 },
    large: { iconSize: 18, textSize: 16, padding: 8 }
  };

  const { iconSize, textSize, padding } = sizeConfig[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { padding },
        { opacity: isLoading ? 0.7 : 1 }
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isLiked ? 'heart' : 'heart-outline'}
        size={iconSize}
        color={isLiked ? '#ff4757' : theme.textSecondary}
      />
      {showCount && likeCount > 0 && (
        <Text style={[
          styles.count,
          { fontSize: textSize, color: theme.textSecondary, marginLeft: 4 }
        ]}>
          {likeCount}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    fontWeight: '500',
  },
}); 