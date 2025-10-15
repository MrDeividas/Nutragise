import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../state/themeStore';
import PostLikeButton from './PostLikeButton';
import PostCommentButton from './PostCommentButton';

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

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <PostLikeButton
          postId={postId}
          initialLikeCount={initialLikeCount}
          initialIsLiked={initialIsLiked}
          onLikeChange={onLikeChange}
          size={size}
          showCount={showCounts}
        />
        
        <PostCommentButton
          postId={postId}
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
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },
});
