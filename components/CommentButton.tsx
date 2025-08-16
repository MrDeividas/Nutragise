import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { goalInteractionsService } from '../lib/goalInteractions';

interface CommentButtonProps {
  goalId: string;
  initialCommentCount?: number;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function CommentButton({ 
  goalId, 
  initialCommentCount = 0,
  onPress,
  size = 'medium',
  showCount = true
}: CommentButtonProps) {
  const { theme } = useTheme();
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const count = await goalInteractionsService.getGoalCommentCount(goalId);
        setCommentCount(count);
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    };

    loadCommentCount();
  }, [goalId]);

  const handlePress = () => {
    if (isLoading) {
      return;
    }
    onPress();
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
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Ionicons
        name="chatbubble-outline"
        size={iconSize}
        color={theme.textSecondary}
        style={styles.icon}
      />
      
      {showCount && commentCount > 0 && (
        <Text style={[
          styles.count,
          { 
            fontSize: textSize,
            color: theme.textSecondary,
            marginLeft: 4
          }
        ]}>
          {commentCount}
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
  icon: {
    // Icon styling
  },
  count: {
    fontWeight: '500',
  },
}); 