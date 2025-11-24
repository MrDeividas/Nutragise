import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyPostInteractionsService } from '../lib/dailyPostInteractions';
import { useActionStore } from '../state/actionStore';

interface DailyPostLikeButtonProps {
  dailyPostId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function DailyPostLikeButton({ 
  dailyPostId, 
  initialLikeCount = 0, 
  initialIsLiked = false,
  onLikeChange,
  size = 'medium',
  showCount = true
}: DailyPostLikeButtonProps) {
  const { theme } = useTheme();
  const { trackCoreHabit } = useActionStore();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const scaleAnim = useState(new Animated.Value(1))[0];
  const heartAnim = useState(new Animated.Value(isLiked ? 1 : 0))[0];

  // Update local state when props change (same pattern as LikeButton for goals)
  useEffect(() => {
    setLikeCount(initialLikeCount);
    setIsLiked(initialIsLiked);
    
    // Set animation value
    Animated.timing(heartAnim, {
      toValue: initialIsLiked ? 1 : 0,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }, [initialLikeCount, initialIsLiked]);

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

      // Track core habit if this is a like (not unlike)
      if (newIsLiked) {
        await trackCoreHabit('like');
      }

      // Call parent handler (same pattern as LikeButton for goals)
      if (onLikeChange) {
        onLikeChange(newIsLiked, newCount);
      }
    } catch (error) {
      console.error('Error toggling daily post like:', error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(!isLiked ? likeCount + 1 : likeCount - 1);
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, textSize: 12, padding: 8 };
      case 'large':
        return { iconSize: 24, textSize: 16, padding: 12 };
      default:
        return { iconSize: 22, textSize: 16, padding: 10 };
    }
  };

  const { iconSize, textSize, padding } = getSizeStyles();

  return (
    <TouchableOpacity
      style={[styles.container, { padding }]}
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
          color={isLiked ? "#ef4444" : theme.textSecondary}
        />
      </Animated.View>
      
      {showCount && likeCount > 0 && (
        <Text style={[
          styles.countText, 
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
  countText: {
    fontWeight: '500',
  },
});
