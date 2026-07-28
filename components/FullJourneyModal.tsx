import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyPostsService, DailyPost } from '../lib/dailyPostsService';
import { formatDate, calculateDayNumber } from '../lib/timeService';
import GesturePhotoCarousel from './GesturePhotoCarousel';
import { supabase } from '../lib/supabase';

interface FullJourneyModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  readOnly?: boolean; // New prop to make the modal read-only (for public profiles)
}

export default function FullJourneyModal({ visible, userId, onClose, readOnly = false }: FullJourneyModalProps) {
  const [allDays, setAllDays] = useState<DailyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      loadAllJourney();
      loadStats();
      loadAccountCreationDate();
    }
  }, [visible, userId]);

  const loadAccountCreationDate = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching account creation date:', error);
        return;
      }
      
      if (data) {
        setAccountCreatedAt(data.created_at);
      }
    } catch (error) {
      console.error('Error loading account creation date:', error);
    }
  };

  const loadAllJourney = async () => {
    try {
      const days = await dailyPostsService.getAllJourney(userId);
      setAllDays(days);
    } catch (error) {
      console.error('Error loading all journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const dailyStats = await dailyPostsService.getDailyPostStats(userId);
      setStats(dailyStats);
    } catch (error) {
      console.error('Error loading journey stats:', error);
    }
  };

  const handleDeleteDay = async (dayId: string, dayNumber: number) => {
    Alert.alert(
      'Delete Day',
      `Are you sure you want to delete Day ${dayNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await dailyPostsService.deleteDailyPost(dayId);
            if (success) {
              // Remove the day from the list
              setAllDays(prev => prev.filter(day => day.id !== dayId));
              // Reload stats
              loadStats();
              Alert.alert('Success', 'Day deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete day. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Calculate day numbers from account creation date
  // Use account creation date if available, otherwise fall back to first post date
  const baseDate = accountCreatedAt || allDays[allDays.length - 1]?.date;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['left', 'right']}>
        <StatusBar barStyle="dark-content" />
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>Journey</Text>
            {stats?.totalDays > 0 && (
              <Text style={styles.modalSubtitle}>
                {stats.totalDays} {stats.totalDays === 1 ? 'day' : 'days'} logged
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        {stats && (
          <View style={styles.statsContainer}>
            <StatItem icon="calendar-outline" value={stats.totalDays} label="Days" />
            <View style={styles.statDivider} />
            <StatItem icon="images-outline" value={stats.totalPhotos} label="Photos" />
            <View style={styles.statDivider} />
            <StatItem icon="checkmark-circle-outline" value={stats.totalHabits} label="Habits" />
            <View style={styles.statDivider} />
            <StatItem icon="trending-up-outline" value={stats.averagePhotosPerDay} label="Avg/Day" />
          </View>
        )}
        
        {/* Journey Content */}
        <ScrollView
          style={styles.journeyScroll}
          contentContainerStyle={styles.journeyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading your journey...</Text>
            </View>
          ) : allDays.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={40} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>No Journey Yet</Text>
              <Text style={styles.emptyText}>
                Start your wellness journey by posting your first daily update!
              </Text>
            </View>
          ) : (
            allDays.map((day, index) => {
              const dayNumber = baseDate ? calculateDayNumber(baseDate, day.date) : allDays.length - index;
              return (
                <JourneyDayCard
                  key={day.id}
                  day={day}
                  dayNumber={dayNumber}
                  theme={theme}
                  onDelete={() => handleDeleteDay(day.id, dayNumber)}
                  readOnly={readOnly}
                />
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function StatItem({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon as any} size={16} color="#10B981" />
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface JourneyDayCardProps {
  day: DailyPost;
  dayNumber: number;
  theme: any;
  onDelete: () => void;
  readOnly?: boolean;
}

const HABIT_META: Record<string, { icon: string; label: string }> = {
  microlearn: { icon: 'book-outline', label: 'Microlearn' },
  meditation: { icon: 'leaf-outline', label: 'Meditation' },
  water: { icon: 'water-outline', label: 'Water' },
  run: { icon: 'walk-outline', label: 'Run' },
  gym: { icon: 'barbell-outline', label: 'Gym' },
  coldshower: { icon: 'snow-outline', label: 'Cold Shower' },
  cold_shower: { icon: 'snow-outline', label: 'Cold Shower' },
  sleep: { icon: 'moon-outline', label: 'Sleep' },
  reflect: { icon: 'create-outline', label: 'Reflect' },
};

function JourneyDayCard({ day, dayNumber, theme, onDelete, readOnly = false }: JourneyDayCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const getHabitMeta = (habit: string) =>
    HABIT_META[habit.toLowerCase()] ?? {
      icon: 'checkmark-circle-outline',
      label: habit.replace(/_/g, ' '),
    };

  return (
    <View style={styles.dayCard}>
      {/* Day Header */}
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>Day {dayNumber}</Text>
          </View>
          <Text style={styles.dayDate}>
            {formatDate(day.date)} • {day.post_count} {day.post_count === 1 ? 'post' : 'posts'}
          </Text>
        </View>

        {!readOnly && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Habit Summary */}
      {day.total_habits > 0 && (
        <View style={styles.habitSummary}>
          {day.habits_completed.map((habit, index) => {
            const meta = getHabitMeta(habit);
            return (
              <View key={index} style={styles.habitChip}>
                <Ionicons name={meta.icon as any} size={13} color="#047857" />
                <Text style={styles.habitChipText}>{meta.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Photo Gallery */}
      {day.photos.length > 0 && (
        <View style={styles.photoSection}>
          <GesturePhotoCarousel
            photos={day.photos}
            currentIndex={currentPhotoIndex}
            onIndexChange={setCurrentPhotoIndex}
            photoWidth={170}
            photoHeight={210}
          />
        </View>
      )}

      {/* Captions */}
      {day.captions.length > 0 && (
        <View style={styles.captionSection}>
          <Text style={styles.captionText}>{day.captions.join(' • ')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FCFAF9',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3F4F6',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  journeyScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  journeyScrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  dayCard: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayInfo: {
    flex: 1,
    gap: 6,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  dayBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  habitSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  habitChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  photoSection: {
    marginBottom: 12,
  },
  captionSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
