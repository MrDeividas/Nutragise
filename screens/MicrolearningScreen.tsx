import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { pointsService } from '../lib/pointsService';
import { useActionStore } from '../state/actionStore';

export default function MicrolearningScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();
  
  const [information, setInformation] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate book dimensions (show ~3.3 books)
  const HORIZONTAL_PADDING = 24;
  const BOOK_GAP = 12;
  const bookWidth = (screenWidth - (HORIZONTAL_PADDING * 2) - (BOOK_GAP * 2.3)) / 3.3;

  const handleCompleteMicrolearn = async () => {
    try {
      // Get user from auth store (same way actionStore does it)
      const { user: authUser } = useAuthStore.getState();
      const userId = authUser?.id;
      
      console.log('📚 Button pressed, user from getState():', userId);
      
      if (!userId) {
        console.error('❌ No user ID found');
        Alert.alert('Error', 'You must be logged in. Please try restarting the app.');
        return;
      }
      
      console.log('📚 Completing microlearn for user:', userId);
      const success = await pointsService.trackDailyHabit(userId, 'microlearn');
      
      if (success) {
        // Reload daily habits to update the segments properly
        const today = new Date();
        const hour = today.getHours();
        const dateToUse = hour < 4 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
        const dateString = dateToUse.toISOString().split('T')[0];
        
        await useActionStore.getState().loadDailyHabits(dateString);
        
        Alert.alert('Success', 'Microlearn completed! +15 points\n\nCheck the Action page to see it highlighted.');
        console.log('✅ Microlearn tracked successfully and daily habits reloaded');
      } else {
        Alert.alert('Info', 'Microlearn already completed today or not eligible for points');
        console.log('ℹ️ Microlearn tracking returned false');
      }
    } catch (error) {
      console.error('Error completing microlearn:', error);
      Alert.alert('Error', 'Failed to complete microlearn: ' + error);
    }
  };

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

  // Book colors based on category or completion
  const getBookColor = (info: any) => {
    const progress = userProgress[info.id];
    const isCompleted = progress?.completed;
    const isPassed = progress?.passed;

    if (isCompleted && isPassed) return '#22C55E'; // Green for passed
    if (isCompleted && !isPassed) return '#EF4444'; // Red for failed
    
    // Different colors for different categories
    const categoryColors: { [key: string]: string } = {
      'Nutrition': '#3B82F6',
      'Fitness': '#EC4899',
      'Mindfulness': '#8B5CF6',
      'General': '#F59E0B',
      'Health': '#10B981',
      'Productivity': '#6366F1',
    };
    
    return categoryColors[info.category] || '#6B7280';
  };

  const renderBookCard = (info: any, index: number) => {
    const progress = userProgress[info.id];
    const isCompleted = progress?.completed;
    const isPassed = progress?.passed;
    const bookColor = getBookColor(info);
    const totalBooks = information.length;
    
    // Rich Dad Poor Dad book cover image
    const isRichDadBook = info.title === 'Rich Dad Poor Dad';
    const bookCoverImage = isRichDadBook 
      ? 'https://images-na.ssl-images-amazon.com/images/I/81bsw6fnUiL.jpg'
      : null;

    return (
      <View
        key={info.id}
        style={[
          styles.bookContainer,
          {
            marginRight: index === totalBooks - 1 ? 0 : BOOK_GAP,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.book,
            {
              width: bookWidth,
            }
          ]}
          onPress={() => {
            navigation.navigate('InformationDetail', { information: info });
          }}
          activeOpacity={0.85}
        >
          {bookCoverImage ? (
            // Book cover image
            <Image
              source={{ uri: bookCoverImage }}
              style={styles.bookCoverImage}
              resizeMode="cover"
            />
          ) : (
            // Book spine with title (fallback for books without images)
            <View style={styles.bookSpine}>
              <Text 
                style={styles.bookTitle}
                numberOfLines={3}
              >
                {info.title}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Duration and completion indicator below book */}
        <View style={styles.bookMeta}>
          <Text style={[styles.durationText, { color: theme.textSecondary }]}>
            {info.duration_minutes} min
          </Text>
          {isCompleted && (
            <Ionicons 
              name={isPassed ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isPassed ? '#22C55E' : '#EF4444'} 
              style={styles.completionIcon}
            />
          )}
        </View>
      </View>
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
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Microlearning
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Quick insights for personal growth
          </Text>
        </View>
      </View>

      {/* TEST BUTTON - Complete Microlearn */}
      <View style={{ padding: 20, backgroundColor: 'rgba(255, 193, 7, 0.1)', margin: 16, borderRadius: 12 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          TEST MODE
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>
          User: {user ? user.id.substring(0, 8) + '...' : 'Not loaded'}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={handleCompleteMicrolearn}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            ✓ Complete Microlearn (+15 pts)
          </Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          Click to mark microlearn as complete and award points
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
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
          <>
            {/* Books Section */}
            {information.filter(info => info.category === 'Books' || info.is_book).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
                  Books
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={bookWidth + BOOK_GAP}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.booksCarousel}
                >
                  {information
                    .filter(info => info.category === 'Books' || info.is_book)
                    .map((info, index) => renderBookCard(info, index))}
                </ScrollView>
              </View>
            )}

            {/* To Complete Section */}
            {information.filter(info => (info.category !== 'Books' && !info.is_book) && !userProgress[info.id]?.completed).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
                  To Complete
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={bookWidth + BOOK_GAP}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.booksCarousel}
                >
                  {information
                    .filter(info => (info.category !== 'Books' && !info.is_book) && !userProgress[info.id]?.completed)
                    .map((info, index) => renderBookCard(info, index))}
                </ScrollView>
              </View>
            )}

            {/* Completed Section */}
            {information.filter(info => (info.category !== 'Books' && !info.is_book) && userProgress[info.id]?.completed).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                  Completed
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={bookWidth + BOOK_GAP}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.booksCarousel}
                >
                  {information
                    .filter(info => (info.category !== 'Books' && !info.is_book) && userProgress[info.id]?.completed)
                    .map((info, index) => renderBookCard(info, index))}
                </ScrollView>
              </View>
            )}
          </>
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
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  booksCarousel: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingLeft: 20,
    paddingRight: 20,
  },
  bookContainer: {
    alignItems: 'center',
  },
  book: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  bookSpine: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  bookTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completionIcon: {
    marginLeft: 4,
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