import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyPostsService, DailyPost } from '../lib/dailyPostsService';
import { calculateDayNumber } from '../lib/timeService';
import { supabase } from '../lib/supabase';
import GesturePhotoCarousel from './GesturePhotoCarousel';

const { width } = Dimensions.get('window');
const H_PAD = 24;
const GAP = 12;
/** Fit exactly 3 large thumbs in the viewport */
const PHOTO_SIZE = Math.floor((width - H_PAD * 2 - GAP * 2) / 3);
const SNAP = PHOTO_SIZE + GAP;

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

      if (error) return;
      if (data) setAccountCreatedAt(data.created_at);
    } catch {
      // Don't block loading if this fails
    }
  };

  const loadRecentJourney = async () => {
    try {
      setLoading(true);
      const days = await dailyPostsService.getRecentJourney(userId, 30);
      setRecentDays(days || []);
    } catch {
      setRecentDays([]);
    } finally {
      setLoading(false);
    }
  };

  const baseDate = accountCreatedAt || recentDays[recentDays.length - 1]?.date;

  const dayItems = useMemo(
    () =>
      recentDays.map((day, index) => ({
        day,
        dayNumber: baseDate ? calculateDayNumber(baseDate, day.date) : index + 1,
      })),
    [recentDays, baseDate]
  );

  if (loading) {
    return (
      <View style={styles.journeyPreview}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Posts</Text>
        </View>
        <ActivityIndicator size="small" color="#1f2937" />
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

  return (
    <View style={styles.journeyPreview}>
      <View style={styles.journeyHeader}>
        <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Posts</Text>
        <TouchableOpacity
          onPress={onViewAll}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward-outline" size={20} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="normal"
        snapToInterval={SNAP}
        snapToAlignment="start"
        bounces
        alwaysBounceHorizontal
        nestedScrollEnabled
        contentContainerStyle={styles.carouselContent}
      >
        {dayItems.map((item) => (
          <JourneyDayPreview
            key={item.day.id}
            day={item.day}
            onPress={() => {
              setSelectedDay(item.day);
              setSelectedDayNumber(item.dayNumber);
            }}
          />
        ))}
      </ScrollView>

      {selectedDay ? (
        <DayDetailModal
          visible={!!selectedDay}
          day={selectedDay}
          dayNumber={selectedDayNumber}
          onClose={() => setSelectedDay(null)}
          theme={theme}
        />
      ) : null}
    </View>
  );
}

interface JourneyDayPreviewProps {
  day: DailyPost;
  onPress: () => void;
}

function JourneyDayPreview({ day, onPress }: JourneyDayPreviewProps) {
  const photos = Array.isArray(day.photos)
    ? day.photos
    : day.photos
      ? [day.photos]
      : [];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.dayPreview}>
      {photos.length > 0 && photos[0] ? (
        <View style={styles.singlePhotoContainer}>
          <Image
            source={{ uri: photos[0] }}
            style={styles.singlePhotoThumbnail}
            resizeMode="cover"
          />
          {photos.length > 1 ? (
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>{photos.length}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.singlePhotoThumbnail, styles.photoPlaceholder]}>
          <Ionicons name="image-outline" size={28} color="#9CA3AF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

interface DayDetailModalProps {
  visible: boolean;
  day: DailyPost;
  dayNumber: number;
  onClose: () => void;
  theme: any;
}

function DayDetailModal({ visible, day, dayNumber, onClose }: DayDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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

  const allHabits = Object.keys(habitMap);
  const habitsList = allHabits.map((key) => ({
    key,
    label: habitMap[key].label,
    value: day.habits_completed?.includes(key) || false,
  }));

  const completedHabits = habitsList.filter((h) => h.value).length;
  const photos = Array.isArray(day.photos) ? day.photos : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalWrapper}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Day {dayNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

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
                    <View
                      style={[
                        styles.habitCheckbox,
                        { backgroundColor: habit.value ? '#10B981' : '#E5E7EB' },
                      ]}
                    >
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
    marginHorizontal: 0,
    marginBottom: 0,
    paddingTop: 4,
    paddingBottom: 4,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: H_PAD,
  },
  journeyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  carouselContent: {
    paddingHorizontal: H_PAD,
  },
  dayPreview: {
    width: PHOTO_SIZE,
    marginRight: GAP,
  },
  singlePhotoContainer: {
    position: 'relative',
  },
  singlePhotoThumbnail: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: H_PAD,
  },
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
