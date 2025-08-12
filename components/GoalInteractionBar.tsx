import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../state/themeStore';
import LikeButton from './LikeButton';
import CommentButton from './CommentButton';

interface GoalInteractionBarProps {
  goalId: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  onCommentPress: () => void;
  size?: 'small' | 'medium' | 'large';
  showCounts?: boolean;
}

export default function GoalInteractionBar({
  goalId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialIsLiked = false,
  onLikeChange,
  onCommentPress,
  size = 'medium',
  showCounts = true
}: GoalInteractionBarProps) {
  const { theme } = useTheme();
  
  console.log('GoalInteractionBar rendered for goal:', goalId);
  console.log('Comment count:', initialCommentCount);

  return (
    <View style={[
      styles.container,
      { borderTopColor: theme.border }
    ]}>
      <View style={styles.buttonContainer}>
        <LikeButton
          goalId={goalId}
          initialLikeCount={initialLikeCount}
          initialIsLiked={initialIsLiked}
          onLikeChange={onLikeChange}
          size={size}
          showCount={showCounts}
        />
        
        <CommentButton
          goalId={goalId}
          initialCommentCount={initialCommentCount}
          onPress={onCommentPress}
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
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
}); 