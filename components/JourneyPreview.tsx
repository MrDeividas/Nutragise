import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../state/themeStore';
import { dailyPostsService, DailyPost } from '../lib/dailyPostsService';
import { formatJourneyDate, calculateDayNumber } from '../lib/timeService';
import { supabase } from '../lib/supabase';

interface JourneyPreviewProps {
  userId: string;
  onViewAll: () => void;
}

export default function JourneyPreview({ userId, onViewAll }: JourneyPreviewProps) {
  const [recentDays, setRecentDays] = useState<DailyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
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
    }
  };

  const loadRecentJourney = async () => {
    try {
      const days = await dailyPostsService.getRecentJourney(userId, 3);
      setRecentDays(days);
    } catch (error) {
      console.error('Error loading recent journey:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.journeyPreview, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Journey</Text>
        </View>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (recentDays.length === 0) {
    return (
      <View style={[styles.journeyPreview, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.journeyHeader}>
          <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>Journey</Text>
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
      
      <View style={styles.journeyDays}>
        {recentDays.map((day, index) => {
          const dayNumber = baseDate ? calculateDayNumber(baseDate, day.date) : index + 1;
          return (
            <JourneyDayPreview 
              key={day.id}
              day={day}
              dayNumber={dayNumber}
              theme={theme}
            />
          );
        })}
      </View>
    </View>
  );
}

interface JourneyDayPreviewProps {
  day: DailyPost;
  dayNumber: number;
  theme: any;
}

function JourneyDayPreview({ day, dayNumber, theme }: JourneyDayPreviewProps) {
  return (
    <View style={styles.dayPreview}>
      {/* Single Photo Thumbnail - Most Recent */}
      <View style={styles.photoThumbnails}>
        {day.photos.length > 0 && (
          <View style={styles.singlePhotoContainer}>
            <Image 
              source={{ uri: day.photos[0] }}
              style={[styles.singlePhotoThumbnail, { borderColor: theme.borderSecondary }]}
              resizeMode="cover"
              blurRadius={0}
            />
            {day.photos.length > 1 && (
              <View style={[styles.photoCountBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                <Text style={[styles.photoCountText, { color: '#ffffff' }]}>
                  {day.photos.length}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Day Info */}
      <Text style={[styles.dayLabel, { color: '#ffffff' }]}>
        Day {dayNumber} • {formatJourneyDate(day.date)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  journeyPreview: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'transparent',
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
  journeyDays: {
    flexDirection: 'row',
    gap: 16,
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
});
