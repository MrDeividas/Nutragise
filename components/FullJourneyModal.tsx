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
  const theme = useTheme();

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
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: 'rgba(20, 19, 19, 0.95)' }]} edges={['left', 'right']}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Text style={[styles.modalTitle, { color: '#ffffff' }]}>Journey</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        {stats && (
          <View style={[styles.statsContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#14b8a6' }]}>{stats.totalDays}</Text>
              <Text style={[styles.statLabel, { color: '#ffffff' }]}>Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#14b8a6' }]}>{stats.totalPhotos}</Text>
              <Text style={[styles.statLabel, { color: '#ffffff' }]}>Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#14b8a6' }]}>{stats.totalHabits}</Text>
              <Text style={[styles.statLabel, { color: '#ffffff' }]}>Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#14b8a6' }]}>{stats.averagePhotosPerDay}</Text>
              <Text style={[styles.statLabel, { color: '#ffffff' }]}>Avg/Day</Text>
            </View>
          </View>
        )}
        
        {/* Journey Content */}
        <ScrollView style={styles.journeyScroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: '#ffffff' }]}>
                Loading your journey...
              </Text>
            </View>
          ) : allDays.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ffffff" />
              <Text style={[styles.emptyTitle, { color: '#ffffff' }]}>
                No Journey Yet
              </Text>
              <Text style={[styles.emptyText, { color: '#ffffff' }]}>
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

interface JourneyDayCardProps {
  day: DailyPost;
  dayNumber: number;
  theme: any;
  onDelete: () => void;
  readOnly?: boolean;
}

function JourneyDayCard({ day, dayNumber, theme, onDelete, readOnly = false }: JourneyDayCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Get habit icons
  const getHabitIcon = (habit: string) => {
    switch (habit.toLowerCase()) {
      case 'microlearn':
        return 'book-outline';
      case 'meditation':
        return 'leaf-outline';
      case 'water':
        return 'water-outline';
      case 'run':
        return 'walk-outline';
      case 'gym':
        return 'barbell-outline';
      case 'coldshower':
        return 'snow-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  return (
    <View style={[styles.dayCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
      {/* Day Header */}
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <Text style={[styles.dayNumber, { color: '#14b8a6' }]}>Day {dayNumber}</Text>
          <Text style={[styles.dayDate, { color: '#ffffff' }]}>
            {formatDate(day.date)} • {day.post_count} posts
          </Text>
        </View>
        
        <View style={styles.dayActions}>
          {/* Habit Summary */}
          <View style={styles.habitSummary}>
            {day.habits_completed.map((habit, index) => (
              <Ionicons 
                key={index}
                name={getHabitIcon(habit) as any}
                size={16}
                color="#14b8a6"
                style={styles.habitIcon}
              />
            ))}
            <Text style={[styles.habitCount, { color: '#ffffff' }]}>
              {day.total_habits} habits
            </Text>
          </View>
          
          {/* Delete Button - Only show if not read-only */}
          {!readOnly && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Photo Gallery */}
      {day.photos.length > 0 && (
        <View style={styles.photoSection}>
          <GesturePhotoCarousel
            photos={day.photos}
            currentIndex={currentPhotoIndex}
            onIndexChange={setCurrentPhotoIndex}
          />
        </View>
      )}
      
      {/* Captions */}
      {day.captions.length > 0 && (
        <View style={styles.captionSection}>
          <Text style={[styles.captionText, { color: '#ffffff' }]}>
            {day.captions.join(' • ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  journeyScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  dayCard: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  habitSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitIcon: {
    marginRight: 2,
  },
  habitCount: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  photoSection: {
    marginBottom: 12,
  },
  captionSection: {
    paddingTop: 8,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
