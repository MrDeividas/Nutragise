import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

interface CommentReplyButtonProps {
  onPress: () => void;
  replyCount?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function CommentReplyButton({
  onPress,
  replyCount = 0,
  size = 'medium',
  showCount = true
}: CommentReplyButtonProps) {
  const { theme } = useTheme();

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
          { fontSize: textSize, color: theme.textSecondary, marginLeft: 4 }
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
  },
  count: {
    fontWeight: '500',
  },
}); 