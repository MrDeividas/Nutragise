import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';

interface PostCommentLikeButtonProps {
  commentId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function PostCommentLikeButton({ 
  commentId, 
  initialLikeCount = 0, 
  initialIsLiked = false,
  onLikeChange,
  size = 'medium',
  showCount = true
}: PostCommentLikeButtonProps) {
  const { theme } = useTheme();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const scaleAnim = useState(new Animated.Value(1))[0];
  const heartAnim = useState(new Animated.Value(isLiked ? 1 : 0))[0];

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const { data: likeData, error: likeError } = await supabase
          .from('post_comment_likes')
          .select('*')
          .eq('comment_id', commentId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        const { count, error: countError } = await supabase
          .from('post_comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', commentId);

        if (!likeError && !countError) {
          const currentIsLiked = likeData && likeData.length > 0;
          const currentCount = count || 0;
          
          setIsLiked(currentIsLiked);
          setLikeCount(currentCount);
          
          // Set animation value
          Animated.timing(heartAnim, {
            toValue: currentIsLiked ? 1 : 0,
            duration: 0,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Error loading comment like state:', error);
      }
    };

    loadInitialState();
  }, [commentId]);

  const handleLikePress = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Optimistic update
      const newIsLiked = !isLiked;
      const newCount = newIsLiked ? likeCount + 1 : likeCount - 1;
      
      setIsLiked(newIsLiked);
      setLikeCount(newCount);
      
      // Animate heart
      Animated.parallel([
        Animated.timing(heartAnim, {
          toValue: newIsLiked ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Call backend
      if (newIsLiked) {
        const { error } = await supabase
          .from('post_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('post_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) {
          throw error;
        }
      }

      // Call custom handler if provided
      if (onLikeChange) {
        onLikeChange(newIsLiked, newCount);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(!isLiked ? likeCount + 1 : likeCount - 1);
      Animated.timing(heartAnim, {
        toValue: !isLiked ? 1 : 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 14, textSize: 10, padding: 4 };
      case 'large':
        return { iconSize: 20, textSize: 14, padding: 8 };
      default:
        return { iconSize: 16, textSize: 12, padding: 6 };
    }
  };

  const { iconSize, textSize, padding } = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { padding },
        { opacity: isLoading ? 0.7 : 1 }
      ]}
      onPress={handleLikePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }],
        width: iconSize,
        height: iconSize,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={iconSize}
          color={isLiked ? theme.primary : theme.textSecondary}
        />
      </Animated.View>
      
      {showCount && likeCount > 0 && (
        <Text style={[
          styles.count,
          { 
            fontSize: textSize,
            color: theme.textSecondary,
            marginLeft: 4
          }
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
    justifyContent: 'flex-start',
  },
  count: {
    fontWeight: '500',
  },
});
