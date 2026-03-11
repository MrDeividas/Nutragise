import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import CustomBackground from '../components/CustomBackground';
import { pointsService } from '../lib/pointsService';
import { useAuthStore } from '../state/authStore';
import { useActionStore } from '../state/actionStore';
import { meditationService } from '../lib/meditationService';

interface MeditationPlayerScreenProps {
  route: {
    params: {
      session: {
        id: string;
        title: string;
        duration: string;
        category: string;
        icon: string;
        audioUrl: string | null;
      };
    };
  };
  navigation: any;
}

export default function MeditationPlayerScreen({ route, navigation }: MeditationPlayerScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { session } = route.params;
  
  const player = useAudioPlayer(session.audioUrl || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!session.audioUrl) {
      Alert.alert('Error', 'Audio file not available');
      navigation.goBack();
      return;
    }

    // Set loading to false once player is ready
    const timer = setTimeout(() => setIsLoading(false), 500);
    
    return () => {
      clearTimeout(timer);
      player.remove();
    };
  }, [session.audioUrl]);

  const handlePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSeek = (seconds: number) => {
    player.seekTo(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      // Stop audio if playing
      if (player.playing) {
        player.pause();
      }

      // Get user from auth store
      const { user: authUser } = useAuthStore.getState();
      const userId = authUser?.id;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in. Please try restarting the app.');
        setIsCompleting(false);
        return;
      }

      // Calculate duration in minutes
      const durationMinutes = Math.round(player.duration / 60);
      
      // Record meditation session
      await meditationService.recordSession(userId, session.title, durationMinutes);
      
      // Complete meditation
      const success = await pointsService.trackDailyHabit(userId, 'meditation');
      
      if (success) {
        // Reload daily habits to update the segments properly
        const today = new Date();
        const hour = today.getHours();
        const dateToUse = hour < 4 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
        const dateString = dateToUse.toISOString().split('T')[0];
        
        await useActionStore.getState().loadDailyHabits(dateString);
        
        Alert.alert(
          'Success',
          'Meditation completed! +15 points\n\nCheck the Action page to see it highlighted.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Info', 'Meditation already completed today or not eligible for points');
        setIsCompleting(false);
      }
    } catch (error) {
      console.error('Error completing meditation:', error);
      Alert.alert('Error', 'Failed to complete meditation: ' + error);
      setIsCompleting(false);
    }
  };

  const position = player.currentTime;
  const duration = player.duration;
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const timeRemaining = duration - position;
  const canComplete = progress >= 90; // Allow completion at 90%
  const isPlaying = player.playing;

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              // Stop audio if playing
              if (player.playing) {
                player.pause();
              }
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {session.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
              {session.category}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading meditation...
              </Text>
            </View>
          ) : (
            <>
              {/* Icon/Visual */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons 
                    name={session.icon as any} 
                    size={64} 
                    color={theme.primary} 
                  />
                </View>
              </View>

              {/* Time Display */}
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: theme.textPrimary }]}>
                  {formatTime(position)}
                </Text>
                <Text style={[styles.timeSeparator, { color: theme.textSecondary }]}>/</Text>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatTime(duration)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressBarContainer, { backgroundColor: theme.borderSecondary }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${progress}%`,
                      backgroundColor: theme.primary,
                    }
                  ]} 
                />
              </View>

              {/* Controls */}
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleSeek(Math.max(0, position - 10))}
                >
                  <Ionicons name="play-skip-back" size={24} color={theme.textPrimary} />
                  <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>-10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.primary }]}
                  onPress={handlePlayPause}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={40} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleSeek(Math.min(duration, position + 10))}
                >
                  <Ionicons name="play-skip-forward" size={24} color={theme.textPrimary} />
                  <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>+10s</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Hint */}
              {!canComplete && (
                <Text style={[styles.progressHint, { color: theme.textSecondary }]}>
                  Complete 90% to finish
                </Text>
              )}

              {/* Done Button */}
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  { 
                    backgroundColor: isCompleting || !canComplete ? theme.borderSecondary : theme.primary,
                    opacity: isCompleting || !canComplete ? 0.6 : 1,
                  }
                ]}
                onPress={handleComplete}
                disabled={isCompleting || !canComplete}
              >
                {isCompleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.doneButtonText}>
                      {canComplete ? 'Done' : `${Math.round(progress)}%`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 48,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    gap: 24,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  controlLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  progressHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
});
