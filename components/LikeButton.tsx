import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { goalInteractionsService } from '../lib/goalInteractions';

interface LikeButtonProps {
  goalId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function LikeButton({ 
  goalId, 
  initialLikeCount = 0, 
  initialIsLiked = false,
  onLikeChange,
  size = 'medium',
  showCount = true
}: LikeButtonProps) {
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
        const [currentIsLiked, currentCount] = await Promise.all([
          goalInteractionsService.isGoalLikedByUser(goalId),
          goalInteractionsService.getGoalLikeCount(goalId)
        ]);
        
        setIsLiked(currentIsLiked);
        setLikeCount(currentCount);
        
        // Set animation value
        Animated.timing(heartAnim, {
          toValue: currentIsLiked ? 1 : 0,
          duration: 0,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error loading like state:', error);
      }
    };

    loadInitialState();
  }, [goalId]);

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
      const result = await goalInteractionsService.toggleGoalLike(goalId);
      
      if (!result.success) {
        // Revert on failure
        setIsLiked(!newIsLiked);
        setLikeCount(!newIsLiked ? likeCount + 1 : likeCount - 1);
        Animated.timing(heartAnim, {
          toValue: !newIsLiked ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Update with real count
        const realCount = await goalInteractionsService.getGoalLikeCount(goalId);
        setLikeCount(realCount);
        onLikeChange?.(result.isLiked, realCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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
        return { iconSize: 20, textSize: 14, padding: 10 };
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
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={iconSize}
          color={isLiked ? "#ff4757" : theme.textSecondary}
          style={styles.icon}
        />
      </Animated.View>
      
      {showCount && (
        <Text style={[
          styles.count,
          { 
            fontSize: textSize,
            color: theme.textSecondary,
            marginLeft: 4
          }
        ]}>
          {likeCount > 0 ? likeCount : ''}
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // Icon styling
  },
  count: {
    fontWeight: '500',
  },
}); 