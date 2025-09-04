import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

interface PostCommentReplyButtonProps {
  onPress: () => void;
  replyCount?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function PostCommentReplyButton({ 
  onPress,
  replyCount = 0,
  size = 'medium',
  showCount = true
}: PostCommentReplyButtonProps) {
  const { theme } = useTheme();

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
        { padding }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="chatbubble-outline"
        size={iconSize}
        color={theme.textSecondary}
      />
      
      {showCount && replyCount > 0 && (
        <Text style={[
          styles.count,
          { 
            fontSize: textSize,
            color: theme.textSecondary,
            marginLeft: 4
          }
        ]}>
          {replyCount}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontWeight: '500',
  },
});
