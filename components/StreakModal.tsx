import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { useAuthStore } from '../state/authStore';
import { HabitStreak } from '../types/database';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DARK = '#1f2937';
const PAGE_BG = '#F8F9FB';
const ACCENT = '#F59E0B';

const habitConfig = [
  { type: 'login', label: 'Login', icon: 'log-in-outline', color: '#34D399' },
  { type: 'sleep', label: 'Sleep', icon: 'moon-outline', color: '#34D399' },
  { type: 'water', label: 'Water', icon: 'water-outline', color: '#60A5FA' },
  { type: 'run', label: 'Exercise', icon: 'walk-outline', color: '#EAB308' },
  { type: 'gym', label: 'Workout', icon: 'barbell-outline', color: '#EF4444' },
  { type: 'reflect', label: 'Reflect', icon: 'journal-outline', color: '#F59E0B' },
  { type: 'cold_shower', label: 'Cold Shower', icon: 'snow-outline', color: '#38BDF8' },
];

function getAppDayDateString(now = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split('T')[0];
}

export default function StreakModal({ visible, onClose }: Props) {
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

  const getStreakTone = (streak: number) => {
    if (streak === 0) return '#9CA3AF';
    if (streak < 3) return '#F59E0B';
    if (streak < 7) return '#EF4444';
    if (streak < 14) return '#8B5CF6';
    if (streak < 30) return '#EC4899';
    return '#10B981';
  };

  if (!visible) {
    return null;
  }

  const today = getAppDayDateString();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Habit Streaks</Text>
            <Text style={styles.headerSubtitle}>Your consistency across core habits</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={DARK} />
              <Text style={styles.loadingText}>Loading streaks…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Active streaks</Text>
              {habitConfig.map((habit) => {
                const streak = streaks[habit.type];
                const currentStreak = streak?.current_streak || 0;
                const longestStreak = streak?.longest_streak || 0;
                const isPending =
                  currentStreak > 0 && streak?.last_completed_date !== today;
                const tone = getStreakTone(currentStreak);
                const isActive = currentStreak > 0;

                return (
                  <View
                    key={habit.type}
                    style={[styles.streakCard, isActive && styles.streakCardActive]}
                  >
                    <View style={styles.cardLeft}>
                      <View style={[styles.habitIcon, { backgroundColor: `${habit.color}18` }]}>
                        <Ionicons name={habit.icon as any} size={18} color={habit.color} />
                      </View>
                      <View style={styles.habitTextCol}>
                        <Text style={styles.habitLabel}>{habit.label}</Text>
                        <Text style={styles.habitMeta}>
                          {currentStreak === 0
                            ? 'No active streak'
                            : isPending
                              ? 'Pending today'
                              : 'Completed today'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <View style={styles.currentRow}>
                        <Ionicons
                          name={
                            currentStreak === 0
                              ? 'snow-outline'
                              : isPending
                                ? 'time-outline'
                                : 'flame'
                          }
                          size={16}
                          color={tone}
                        />
                        <Text style={[styles.currentValue, { color: tone }]}>
                          {currentStreak}d
                        </Text>
                      </View>
                      <Text style={styles.bestValue}>Best {longestStreak}d</Text>
                    </View>
                  </View>
                );
              })}

              <View style={styles.tipCard}>
                <Ionicons name="flame" size={18} color={ACCENT} />
                <Text style={styles.tipText}>
                  Complete a habit each app-day (after 4am) to keep your streak alive.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  streakCardActive: {
    borderColor: '#E5E7EB',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitTextCol: {
    flex: 1,
  },
  habitLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  habitMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  bestValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tipCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 18,
  },
});
