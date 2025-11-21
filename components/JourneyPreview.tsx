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
import { formatJourneyDate, calculateDayNumber } from '../lib/timeService';
import { supabase } from '../lib/supabase';
import GesturePhotoCarousel from './GesturePhotoCarousel';

const { width } = Dimensions.get('window');

interface JourneyPreviewProps {
  userId: string;
  onViewAll: () => void;
}

export default function JourneyPreview({ userId, onViewAll }: JourneyPreviewProps) {
  const [recentDays, setRecentDays] = useState<DailyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyPost | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(0);
  const theme = useTheme();

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
        console.error('Error fetching account creation date:', error);
        return;
      }
      
      if (data) {
        setAccountCreatedAt(data.created_at);
      }
    } catch (error) {
      console.error('Error loading account creation date:', error);
      // Don't block loading if this fails
    }
  };

  const loadRecentJourney = async () => {
    try {
      setLoading(true);
      console.log('📸 Loading recent journey for user:', userId);
      // Load last 10 days - service handles errors internally
      const days = await dailyPostsService.getRecentJourney(userId, 10);
      console.log('📸 Received days from service:', days?.length || 0);
      if (days && days.length > 0) {
        console.log('📸 First day sample:', {
          id: days[0].id,
          date: days[0].date,
          photos: days[0].photos
        });
      }
      setRecentDays(days || []);
    } catch (error) {
      console.error('❌ Error loading recent journey:', error);
      // Set empty array on error to show empty state
      setRecentDays([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.journeyPreview, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: '#ffffff' }]}>Journey</Text>
        </View>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (recentDays.length === 0) {
    return (
      <View style={[styles.journeyPreview, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: '#ffffff' }]}>Journey</Text>
        </View>
        <Text style={[styles.emptyText, { color: '#ffffff' }]}>
          Start your journey by posting your first daily update!
        </Text>
      </View>
    );
  }

  // Calculate day numbers from account creation date
  // Use account creation date if available, otherwise fall back to first post date
  const baseDate = accountCreatedAt || recentDays[recentDays.length - 1]?.date;

  return (
    <View style={[styles.journeyPreview, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
      <View style={styles.journeyHeader}>
        <Text style={[styles.journeyTitle, { color: '#ffffff' }]}>Journey</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllText, { color: '#ffffff' }]}>View All →</Text>
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
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dayPreview}>
      {/* Single Photo Thumbnail - Most Recent */}
      <View style={styles.photoThumbnails}>
        {photos.length > 0 && photos[0] ? (
          <View style={styles.singlePhotoContainer}>
            <Image 
              source={{ uri: photos[0] }}
              style={[styles.singlePhotoThumbnail, { borderColor: theme.borderSecondary }]}
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
            backgroundColor: 'rgba(128, 128, 128, 0.2)', 
            borderColor: theme.borderSecondary,
            justifyContent: 'center',
            alignItems: 'center'
          }]}>
            <Ionicons name="image-outline" size={24} color="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
      </View>
      
      {/* Day Info */}
      <Text style={[styles.dayLabel, { color: '#ffffff' }]}>
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
  
  const habitsList = [
    { key: 'gym', label: '🏋️ Gym', value: day.gym_completed },
    { key: 'meditation', label: '🧘 Meditation', value: day.meditation_completed },
    { key: 'microlearn', label: '📚 Microlearn', value: day.microlearn_completed },
    { key: 'sleep', label: '😴 Sleep', value: day.sleep_completed },
    { key: 'water', label: '💧 Water', value: day.water_completed },
    { key: 'run', label: '🏃 Run', value: day.run_completed },
    { key: 'reflect', label: '✍️ Reflect', value: day.reflect_completed },
    { key: 'cold_shower', label: '🚿 Cold Shower', value: day.cold_shower_completed },
  ];

  const completedHabits = habitsList.filter(h => h.value).length;

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
            <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
              Day {dayNumber}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {/* Photos */}
            {day.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
                  Progress Photos ({day.photos.length})
                </Text>
                <View style={styles.photoCarouselContainer}>
                  <GesturePhotoCarousel 
                    photos={day.photos}
                    currentIndex={currentPhotoIndex}
                    onIndexChange={setCurrentPhotoIndex}
                  />
                </View>
              </View>
            )}

            {/* Daily Habits */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
                Daily Habits ({completedHabits}/8)
              </Text>
              <View style={styles.habitsGrid}>
                {habitsList.map((habit) => (
                  <View 
                    key={habit.key} 
                    style={[
                      styles.habitItemCompact,
                      { backgroundColor: habit.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(128, 128, 128, 0.1)' }
                    ]}
                  >
                    <View style={[
                      styles.habitCheckbox, 
                      { backgroundColor: habit.value ? '#10B981' : 'rgba(128, 128, 128, 0.3)' }
                    ]}>
                      {habit.value && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                    </View>
                    <Text style={[styles.habitTextCompact, { color: '#ffffff' }]}>
                      {habit.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Mood & Energy */}
            {(day.mood_rating || day.energy_level) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
                  Mood & Energy
                </Text>
                <View style={styles.moodEnergyContainer}>
                  {day.mood_rating && (
                    <View style={[styles.moodEnergyItem, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
                      <Text style={[styles.moodEnergyLabel, { color: '#ffffff' }]}>
                        Mood
                      </Text>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= day.mood_rating! ? "star" : "star-outline"}
                            size={20}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  {day.energy_level && (
                    <View style={[styles.moodEnergyItem, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
                      <Text style={[styles.moodEnergyLabel, { color: '#ffffff' }]}>
                        Energy
                      </Text>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= day.energy_level! ? "flash" : "flash-outline"}
                            size={20}
                            color="#10B981"
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Caption */}
            {day.caption && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>
                  Note
                </Text>
                <Text style={[styles.sectionContent, { color: '#ffffff' }]}>
                  {day.caption}
                </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff', // Match other section titles
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff', // Match other section text
  },
  journeyScrollView: {
    flexGrow: 0,
  },
  journeyDays: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 24, // Add padding to the right for better scrolling experience
  },
  dayPreview: {
    gap: 8,
  },
  photoThumbnails: {
    flexDirection: 'row',
    gap: 6,
  },
  singlePhotoContainer: {
    position: 'relative',
  },
  singlePhotoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff', // Match other section text
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#ffffff', // Match other section text
  },
  // Modal Styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: 'rgba(50, 50, 50, 1)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '100%',
    overflow: 'hidden',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 600,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  levelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  habitItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
    minWidth: '45%',
    flex: 0,
  },
  habitCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTextCompact: {
    fontSize: 13,
    flex: 1,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  photoCarouselContainer: {
    height: 300,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: '47%',
  },
  habitLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodEnergyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  moodEnergyItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  moodEnergyLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
