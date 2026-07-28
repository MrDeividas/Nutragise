import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyPostsService, DailyPost } from '../lib/dailyPostsService';
import { formatJourneyDate, formatDate, calculateDayNumber } from '../lib/timeService';
import { supabase } from '../lib/supabase';
import GesturePhotoCarousel from './GesturePhotoCarousel';

const { width } = Dimensions.get('window');

interface JourneyPreviewProps {
  userId: string;
  onViewAll: () => void;
  emptyStateText?: string;
}

export default function JourneyPreview({
  userId,
  onViewAll,
  emptyStateText = 'Start your journey by posting your first daily update!',
}: JourneyPreviewProps) {
  const [recentDays, setRecentDays] = useState<DailyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyPost | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(0);
  const { theme } = useTheme();

  useEffect(() => {
    loadRecentJourney();
    loadAccountCreationDate();
  }, [userId]);

  const loadAccountCreationDate = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        return;
      }
      
      if (data) {
        setAccountCreatedAt(data.created_at);
      }
    } catch (error) {
      // Don't block loading if this fails
    }
  };

  const loadRecentJourney = async () => {
    try {
      setLoading(true);
      // Load last 10 days - service handles errors internally
      const days = await dailyPostsService.getRecentJourney(userId, 10);
      setRecentDays(days || []);
    } catch (error) {
      // Set empty array on error to show empty state
      setRecentDays([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.journeyPreview}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Posts</Text>
        </View>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (recentDays.length === 0) {
    return (
      <View style={styles.journeyPreview}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Posts</Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {emptyStateText}
        </Text>
      </View>
    );
  }

  // Calculate day numbers from account creation date
  // Use account creation date if available, otherwise fall back to first post date
  const baseDate = accountCreatedAt || recentDays[recentDays.length - 1]?.date;

  return (
    <View style={styles.journeyPreview}>
      <View style={styles.journeyHeader}>
        <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Posts</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllText, { color: theme.textSecondary }]}>View All →</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.journeyDays}
        style={styles.journeyScrollView}
      >
        {recentDays.map((day, index) => {
          const dayNumber = baseDate ? calculateDayNumber(baseDate, day.date) : index + 1;
          return (
            <JourneyDayPreview 
              key={day.id}
              day={day}
              dayNumber={dayNumber}
              theme={theme}
              onPress={() => {
                setSelectedDay(day);
                setSelectedDayNumber(dayNumber);
              }}
            />
          );
        })}
      </ScrollView>

      {/* Day Detail Modal */}
      {selectedDay && (
        <DayDetailModal
          visible={!!selectedDay}
          day={selectedDay}
          dayNumber={selectedDayNumber}
          onClose={() => setSelectedDay(null)}
          theme={theme}
        />
      )}
    </View>
  );
}

interface JourneyDayPreviewProps {
  day: DailyPost;
  dayNumber: number;
  theme: any;
  onPress: () => void;
}

function JourneyDayPreview({ day, dayNumber, theme, onPress }: JourneyDayPreviewProps) {
  // Ensure photos is always an array
  const photos = Array.isArray(day.photos) ? day.photos : (day.photos ? [day.photos] : []);
  
  // Calculate photo size to fit exactly 4 photos
  // Container: width - 48 (margins) - 32 (padding) = width - 80
  // Gaps: 3 gaps of 8px = 24px
  // Available: width - 80 - 24 = width - 104
  // Per photo: (width - 104) / 4
  const photoSize = Math.floor((width - 104) / 4);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dayPreview}>
      {/* Single Photo Thumbnail - Most Recent */}
      <View style={styles.photoThumbnails}>
        {photos.length > 0 && photos[0] ? (
          <View style={styles.singlePhotoContainer}>
            <Image 
              source={{ uri: photos[0] }}
              style={[styles.singlePhotoThumbnail, { width: photoSize, height: photoSize }]}
              resizeMode="cover"
              blurRadius={0}
            />
            {photos.length > 1 && (
              <View style={[styles.photoCountBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                <Text style={[styles.photoCountText, { color: '#ffffff' }]}>
                  {photos.length}
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Show placeholder if no photos
          <View style={[styles.singlePhotoThumbnail, { 
            backgroundColor: '#F3F4F6',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            width: Math.floor((width - 104) / 4),
            height: Math.floor((width - 104) / 4),
          }]}>
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>
      
      {/* Day Info */}
      <Text style={[styles.dayLabel, { color: theme.textSecondary, width: Math.floor((width - 104) / 4) }]}>
        Day {dayNumber} • {formatJourneyDate(day.date)}
      </Text>
      </View>
    </TouchableOpacity>
  );
}

// Day Detail Modal Component
interface DayDetailModalProps {
  visible: boolean;
  day: DailyPost;
  dayNumber: number;
  onClose: () => void;
  theme: any;
}

function DayDetailModal({ visible, day, dayNumber, onClose, theme }: DayDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Map habit names to their display info
  const habitMap: Record<string, { label: string }> = {
    gym: { label: '🏋️ Gym' },
    meditation: { label: '🧘 Meditation' },
    microlearn: { label: '📚 Microlearn' },
    sleep: { label: '😴 Sleep' },
    water: { label: '💧 Water' },
    run: { label: '🏃 Run' },
    reflect: { label: '✍️ Reflect' },
    cold_shower: { label: '🚿 Cold Shower' },
  };

  // Create habits list from habits_completed array
  const allHabits = Object.keys(habitMap);
  const habitsList = allHabits.map(key => ({
    key,
    label: habitMap[key].label,
    value: day.habits_completed?.includes(key) || false,
  }));

  const completedHabits = habitsList.filter(h => h.value).length;
  const photos = Array.isArray(day.photos) ? day.photos : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Day {dayNumber}</Text>
              <Text style={styles.headerSubtitle}>{formatDate(day.date)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Summary strip */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Ionicons name="images-outline" size={16} color="#10B981" />
              <Text style={styles.summaryText}>
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.summaryText}>{completedHabits}/8 habits</Text>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {/* Photos */}
            {photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress Photos</Text>
                <View style={styles.photoCarouselContainer}>
                  <GesturePhotoCarousel 
                    photos={photos}
                    currentIndex={currentPhotoIndex}
                    onIndexChange={setCurrentPhotoIndex}
                    photoWidth={190}
                    photoHeight={240}
                  />
                </View>
              </View>
            )}

            {/* Daily Habits */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Daily Habits</Text>
                <Text style={styles.sectionCount}>{completedHabits}/8</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(completedHabits / 8) * 100}%` }]} />
              </View>
              <View style={styles.habitsGrid}>
                {habitsList.map((habit) => (
                  <View 
                    key={habit.key} 
                    style={[
                      styles.habitItemCompact,
                      habit.value ? styles.habitItemDone : styles.habitItemTodo,
                    ]}
                  >
                    <View style={[
                      styles.habitCheckbox, 
                      { backgroundColor: habit.value ? '#10B981' : '#E5E7EB' }
                    ]}>
                      {habit.value && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.habitTextCompact,
                        { color: habit.value ? '#1F2937' : '#9CA3AF' },
                      ]}
                      numberOfLines={1}
                    >
                      {habit.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Captions */}
            {day.captions && day.captions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                {day.captions.map((caption, index) => (
                  <View key={index} style={styles.noteCard}>
                    <Text style={styles.noteText}>{caption}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  journeyPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 24,
    marginBottom: 0,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journeyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  journeyScrollView: {
    flexGrow: 0,
  },
  journeyDays: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24, // Add padding to the right for better scrolling experience
  },
  dayPreview: {
    gap: 6,
    alignItems: 'center',
  },
  photoThumbnails: {
    flexDirection: 'row',
    gap: 6,
  },
  singlePhotoContainer: {
    position: 'relative',
  },
  singlePhotoThumbnail: {
    borderRadius: 12,
  },
  photoCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal Styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    width: '92%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
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
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  summaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  section: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  photoCarouselContainer: {
    width: '100%',
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
  },
  habitItemDone: {
    backgroundColor: '#F0FDF4',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  habitItemTodo: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  habitCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTextCompact: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  noteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
});
