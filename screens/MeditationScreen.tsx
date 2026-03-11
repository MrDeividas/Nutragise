import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import CustomBackground from '../components/CustomBackground';
import { pointsService } from '../lib/pointsService';
import { useAuthStore } from '../state/authStore';
import { useActionStore } from '../state/actionStore';
import { supabase } from '../lib/supabase';
import { meditationService, MeditationStats } from '../lib/meditationService';

export default function MeditationScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<MeditationStats>({
    totalSessions: 0,
    averageSessionMinutes: 0,
    totalTimeMinutes: 0,
  });

  // Load meditation stats
  useEffect(() => {
    const loadStats = async () => {
      if (user?.id) {
        const meditationStats = await meditationService.getStats(user.id);
        setStats(meditationStats);
      }
    };
    loadStats();
  }, [user?.id]);

  // Refresh stats when screen is focused (after completing a meditation)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        meditationService.getStats(user.id).then(setStats);
      }
    }, [user?.id])
  );
  
  // Format total time for display
  const formatTotalTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get public URL for meditation audio files
  const getMeditationAudioUrl = (fileName: string): string | null => {
    try {
      // Try to list files first to verify the file exists
      const { data: files, error: listError } = supabase.storage
        .from('meditation-audio')
        .list('', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (listError) {
        console.error('Error listing files:', listError);
      } else if (files) {
        console.log('Files in meditation-audio bucket:', files.map(f => f.name));
        const fileExists = files.some(f => f.name === fileName);
        if (!fileExists) {
          console.warn(`File ${fileName} not found. Available files:`, files.map(f => f.name).join(', '));
        }
      }
      
      const { data } = supabase.storage
        .from('meditation-audio')
        .getPublicUrl(fileName);
      
      const url = data.publicUrl;
      console.log(`Generated URL for ${fileName}:`, url);
      
      // Verify the URL format
      if (!url || !url.startsWith('http')) {
        console.error('Invalid URL generated:', url);
        return null;
      }
      
      // Try to verify the file is accessible (async, don't block)
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log(`✅ File ${fileName} is accessible`);
          } else {
            console.warn(`⚠️ File ${fileName} returned HTTP ${response.status}`);
          }
        })
        .catch(err => {
          console.warn(`⚠️ Could not verify file ${fileName}:`, err);
        });
      
      return url;
    } catch (error) {
      console.error('Error getting meditation audio URL:', error);
      return null;
    }
  };
  
  const handleCompleteMeditation = async () => {
    try {
      // Get user from auth store (same way actionStore does it)
      const { user: authUser } = useAuthStore.getState();
      const userId = authUser?.id;
      
      console.log('🧘 Button pressed, user from getState():', userId);
      
      if (!userId) {
        console.error('❌ No user ID found');
        Alert.alert('Error', 'You must be logged in. Please try restarting the app.');
        return;
      }
      
      console.log('🧘 Completing meditation for user:', userId);
      const success = await pointsService.trackDailyHabit(userId, 'meditation');
      
      if (success) {
        // Reload daily habits to update the segments properly
        const today = new Date();
        const hour = today.getHours();
        const dateToUse = hour < 4 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
        const dateString = dateToUse.toISOString().split('T')[0];
        
        await useActionStore.getState().loadDailyHabits(dateString);
        
        Alert.alert('Success', 'Meditation completed! +15 points\n\nCheck the Action page to see it highlighted.');
        console.log('✅ Meditation tracked successfully and daily habits reloaded');
      } else {
        Alert.alert('Info', 'Meditation already completed today or not eligible for points');
        console.log('ℹ️ Meditation tracking returned false');
      }
    } catch (error) {
      console.error('Error completing meditation:', error);
      Alert.alert('Error', 'Failed to complete meditation: ' + error);
    }
  };

  const meditationSessions = [
    {
      id: '1',
      title: 'Gratitude',
      duration: '5 min',
      category: 'Mindfulness & Compassion',
      icon: 'heart-outline',
      // Use direct URL - note the filename is .MP3 (uppercase) not .mp3
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/gratitude-5min.MP3',
    },
    {
      id: '2',
      title: 'Reduce Anxiety',
      duration: '9 min',
      category: 'Relaxation & Sleep',
      icon: 'leaf-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/reduce-stress-9min.MP3',
    },
    {
      id: '3',
      title: 'Calm',
      duration: '23 min',
      category: 'Overactive Mind',
      icon: 'moon-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/23min%20overactive%20mind.MP3',
    },
    {
      id: '4',
      title: 'Focus',
      duration: '11 min',
      category: 'Productivity & Performance',
      icon: 'eye-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/11min%20focus.MP3',
    },
    {
      id: '5',
      title: 'Growth',
      duration: '23 min',
      category: 'Self-Development & Growth',
      icon: 'trending-up-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/23min%20personal%20development.MP3',
    },
    {
      id: '6',
      title: 'Breath Work',
      duration: '10 min',
      category: 'Mindfulness & Compassion',
      icon: 'heart-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/10min%20breath%20work.MP3',
    },
    {
      id: '7',
      title: 'Morning Self-Healing',
      duration: '15 min',
      category: 'Self-Development & Growth',
      icon: 'sunny-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/morning-15min.MP3',
    },
    {
      id: '8',
      title: 'Being Present',
      duration: '20 min',
      category: 'Mindfulness & Compassion',
      icon: 'time-outline',
      audioUrl: 'https://gtnjrauujrzkesaulius.supabase.co/storage/v1/object/public/meditation-audio/20min%20being%20present.MP3',
    },
  ];

  const renderMeditationCard = (session: any) => (
    <TouchableOpacity
      key={session.id}
      style={styles.card}
      onPress={() => {
        // Navigate to meditation player if audio is available
        if (session.audioUrl) {
          navigation.navigate('MeditationPlayer', { session });
        } else {
          Alert.alert('Coming Soon', 'This meditation session will be available soon.');
        }
      }}
    >
      <View style={styles.cardContent}>
        <Text 
          style={[styles.cardTitle, { color: theme.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {session.title}
        </Text>
        {session.id === '1' ? (
          <View>
            <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>
              Relaxation
            </Text>
            <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>
              & Sleep
            </Text>
          </View>
        ) : (
          <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>
            {session.category}
          </Text>
        )}
        <View style={styles.cardDurationContainer}>
          <Ionicons name="time-outline" size={14} color={theme.textTertiary} />
          <Text style={[styles.cardDuration, { color: theme.textTertiary }]}>
            {session.duration}
          </Text>
        </View>
      </View>
      <View style={styles.cardIconContainer}>
        <Ionicons name={session.icon as any} size={24} color={theme.textPrimary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Meditation
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
                Find peace and clarity with guided sessions
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.cardsContainer, Platform.OS === 'android' && { gap: undefined }] }>
          <View style={styles.gridRow}>
            {meditationSessions.slice(0, 2).map((session, idx) => (
              <View key={session.id} style={[styles.gridRowItem, Platform.OS === 'android' && idx === 0 && { marginRight: 12 }]}>
                {renderMeditationCard(session)}
              </View>
            ))}
          </View>
          <View style={styles.gridRow}>
            {meditationSessions.slice(2, 4).map((session, idx) => (
              <View key={session.id} style={[styles.gridRowItem, Platform.OS === 'android' && idx === 0 && { marginRight: 12 }]}>
                {renderMeditationCard(session)}
              </View>
            ))}
          </View>
          {/* Row for 5th and 6th meditations */}
          {meditationSessions.length > 4 && (
            <View style={styles.gridRow}>
              {meditationSessions.slice(4, 6).map((session, idx) => (
                <View key={session.id} style={[styles.gridRowItem, Platform.OS === 'android' && idx === 0 && { marginRight: 12 }]}>
                  {renderMeditationCard(session)}
                </View>
              ))}
            </View>
          )}
          {/* Row for 7th and 8th meditations */}
          {meditationSessions.length > 6 && (
            <View style={styles.gridRow}>
              {meditationSessions.slice(6, 8).map((session, idx) => (
                <View key={session.id} style={[styles.gridRowItem, Platform.OS === 'android' && idx === 0 && { marginRight: 12 }]}>
                  {renderMeditationCard(session)}
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>
            Your Meditation Stats
          </Text>
          <View style={[styles.statsGrid, Platform.OS === 'android' && { gap: undefined }]}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stats.averageSessionMinutes > 0 ? `${stats.averageSessionMinutes} min` : '0 min'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Avg Session
              </Text>
            </View>
            
            <View style={[styles.statCard, Platform.OS === 'android' && { marginRight: 12 }]}>
              <Ionicons name="timer-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stats.totalTimeMinutes > 0 ? formatTotalTime(stats.totalTimeMinutes) : '0m'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Time
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stats.totalSessions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Sessions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: Platform.select({ android: 34 }),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardsContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridRowItem: {
    flex: 1,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: Platform.select({ android: 20 }),
  },
  cardCategory: {
    fontSize: 10,
    marginBottom: 4,
  },
  cardDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: Platform.select({ android: 22 }),
  },
  statLabel: {
    fontSize: 12,
    lineHeight: Platform.select({ android: 16 }),
  },
}); 