import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';

export default function MicrolearningScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  
  const [information, setInformation] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Optimized initialization - move heavy operations to background
  useEffect(() => {
    // Set initial loading state immediately
    setLoading(true);
    
    // Use setTimeout to move heavy operations to next tick
    const timer = setTimeout(() => {
      const initializeScreen = async () => {
        try {
          // Run operations in parallel for better performance
          const [informationResult, progressResult] = await Promise.allSettled([
            fetchInformation(),
            fetchUserProgress()
          ]);
          
          // Handle results independently
          if (informationResult.status === 'fulfilled') {
            // Information already handled in fetchInformation
          }
          
          if (progressResult.status === 'fulfilled') {
            // Progress already handled in fetchUserProgress
          }
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      };
      
      initializeScreen();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [user]);

  // Optimized focus effect - only refresh progress, not full data
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh user progress, not full information
      if (user) {
        fetchUserProgress();
      }
    }, [user])
  );

  const fetchInformation = async () => {
    try {
      setError('');
      
      const { data, error } = await supabase
        .from('information')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInformation(data || []);
    } catch (error) {
      console.error('Error fetching information:', error);
      setError('Failed to load microlearning content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap: {[key: string]: any} = {};
      data?.forEach((progress) => {
        progressMap[progress.information_id] = progress;
      });

      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const renderLearningCard = (info: any) => {
    const progress = userProgress[info.id];
    const isCompleted = progress?.completed;
    const isPassed = progress?.passed;

    return (
      <TouchableOpacity
        key={info.id}
        style={[
          styles.card, 
          { 
            backgroundColor: isCompleted 
              ? 'rgba(34, 197, 94, 0.1)' // Green tint for completed
              : 'rgba(128, 128, 128, 0.15)' 
          }
        ]}
              onPress={() => {
        navigation.navigate('InformationDetail', { information: info });
      }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>📚</Text>
            {isCompleted && (
              <View style={[
                styles.completionBadge,
                isPassed ? { backgroundColor: '#22C55E' } : { backgroundColor: '#EF4444' }
              ]}>
                <Ionicons 
                  name={isPassed ? "checkmark" : "close"} 
                  size={12} 
                  color="white" 
                />
              </View>
            )}
          </View>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardDuration, { color: theme.textSecondary }]}>
              {info.duration_minutes} min read
            </Text>
            <Text style={[styles.cardCategory, { color: theme.textTertiary }]}>
              {info.category || 'General'}
            </Text>
            {isCompleted && (
              <Text style={[
                styles.completionStatus,
                isPassed ? { color: '#22C55E' } : { color: '#EF4444' }
              ]}>
                {isPassed ? '✓ Passed' : '✗ Failed'}
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          {info.title}
        </Text>
      </TouchableOpacity>
    );
  };

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
            <Ionicons name="book-outline" size={28} color={theme.textPrimary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Microlearning
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Quick insights for personal growth
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading microlearning content...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchInformation}
            >
              <Text style={[styles.retryButtonText, { color: theme.primary }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : information.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No microlearning content available yet.
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Check back later for new content!
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {/* Incomplete Items */}
            {information.filter(info => !userProgress[info.id]?.completed).length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
                  To Complete
                </Text>
                {information
                  .filter(info => !userProgress[info.id]?.completed)
                  .map(renderLearningCard)}
              </>
            )}

            {/* Completed Items */}
            {information.filter(info => userProgress[info.id]?.completed).length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                  Completed
                </Text>
                {information
                  .filter(info => userProgress[info.id]?.completed)
                  .map(renderLearningCard)}
              </>
            )}
          </View>
        )}
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardsContainer: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardIconContainer: {
    position: 'relative',
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardCategory: {
    fontSize: 10,
    marginTop: 2,
  },
  completionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 