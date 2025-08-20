import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { useAuthStore } from '../state/authStore';
import { HabitStreak } from '../types/database';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const habitConfig = [
  { type: 'login', label: 'Login', icon: 'log-in', color: '#10B981' },
  { type: 'sleep', label: 'Sleep', icon: 'moon', color: '#8B5CF6' },
  { type: 'water', label: 'Water', icon: 'water', color: '#06B6D4' },
  { type: 'run', label: 'Run', icon: 'walk', color: '#10B981' },
  { type: 'gym', label: 'Gym', icon: 'barbell', color: '#F59E0B' },
  { type: 'reflect', label: 'Reflect', icon: 'sparkles', color: '#EC4899' },
  { type: 'cold_shower', label: 'Cold Shower', icon: 'snow', color: '#3B82F6' }
];

export default function StreakModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [streaks, setStreaks] = useState<{ [key: string]: HabitStreak }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && user) {
      loadStreaks();
    }
  }, [visible, user]);

  const loadStreaks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const streakData: { [key: string]: HabitStreak } = {};
      
      for (const habit of habitConfig) {
        let streak: HabitStreak;
        if (habit.type === 'login') {
          streak = await dailyHabitsService.getLoginStreak(user.id);
        } else {
          streak = await dailyHabitsService.getHabitStreak(user.id, habit.type);
        }
        streakData[habit.type] = streak;
      }
      
      setStreaks(streakData);
    } catch (error) {
      console.error('Error loading streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakEmoji = (streak: number, isPending: boolean) => {
    if (streak === 0) return '❄️';
    if (isPending) return '⏱️'; // Timer emoji for pending
    return '🔥'; // Single flame for all active streaks
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return theme.textSecondary;
    if (streak < 3) return '#F59E0B';
    if (streak < 7) return '#EF4444';
    if (streak < 14) return '#8B5CF6';
    if (streak < 30) return '#EC4899';
    return '#10B981';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="flame" size={28} color="#F59E0B" />
              <Text style={[styles.title, { color: theme.textPrimary }]}>Habit Streaks</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingState}>
                <Ionicons name="refresh" size={48} color={theme.textSecondary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading streaks...</Text>
              </View>
            ) : (
              <View style={styles.streaksList}>
                {habitConfig.map((habit) => {
                  const streak = streaks[habit.type];
                  const currentStreak = streak?.current_streak || 0;
                  const longestStreak = streak?.longest_streak || 0;
                  
                  // Determine if habit is pending (has streak but not completed today)
                  const today = new Date().toISOString().split('T')[0];
                  const isPending = currentStreak > 0 && streak?.last_completed_date !== today;
                  
                  return (
                                        <View key={habit.type} style={styles.streakRow}>
                      <View style={styles.rowLeft}>
                        <View style={[styles.habitIconSmall, { backgroundColor: `${habit.color}20` }]}>
                          <Ionicons name={habit.icon as any} size={16} color={habit.color} />
                        </View>
                        <Text style={[styles.habitLabelSmall, { color: theme.textPrimary }]}>{habit.label}</Text>
                      </View>

                      <View style={styles.rowRight}>
                        <Text style={[styles.streakEmojiSmall, { color: getStreakColor(currentStreak) }]}>
                          {getStreakEmoji(currentStreak, isPending)}
                        </Text>
                        <Text style={[styles.streakNumberSmall, { color: getStreakColor(currentStreak) }]}>
                          {currentStreak}d
                        </Text>
                        <Text style={[styles.longestStreakSmall, { color: theme.textSecondary }]}>Best {longestStreak}d</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Keep the fire burning! 🔥
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 420,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  streaksList: {
    gap: 8,
  },
  // Compact row styles
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  habitLabelSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakEmojiSmall: {
    fontSize: 14,
  },
  streakNumberSmall: {
    fontSize: 14,
    fontWeight: '700',
  },
  longestStreakSmall: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
}); 