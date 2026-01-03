import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

interface Props {
  onCreatePress: () => void;
  onJoinPress: () => void;
}

export default function CreateJoinBox({ onCreatePress, onJoinPress }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.buttonsRow}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onCreatePress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
          <Ionicons name="add-circle" size={20} color="white" />
        </View>
        <View style={styles.buttonTextContainer}>
          <Text style={[styles.buttonTitle, { color: theme.textPrimary }]}>Create Own Challenge</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onJoinPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
          <Ionicons name="key" size={20} color="white" />
        </View>
        <View style={styles.buttonTextContainer}>
          <Text style={[styles.buttonTitle, { color: theme.textPrimary }]}>Join Private Challenge</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
});
