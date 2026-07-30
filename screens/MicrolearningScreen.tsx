import React, { useState, useEffect, useMemo } from 'react';
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
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { pointsService } from '../lib/pointsService';
import { useActionStore } from '../state/actionStore';

const DARK = '#1f2937';
const PAGE_BG = '#F8F9FB';
const TRENDING_TOP_N = 5;

export default function MicrolearningScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();

  const [information, setInformation] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<{ [key: string]: any }>({});
  const [engagementCounts, setEngagementCounts] = useState<{
    [id: string]: { completion_count: number; start_count: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const HORIZONTAL_PADDING = 20;
  const BOOK_GAP = 12;
  const bookWidth = (screenWidth - HORIZONTAL_PADDING * 2 - BOOK_GAP * 2.3) / 3.3;

  const handleCompleteMicrolearn = async () => {
    try {
      const { user: authUser } = useAuthStore.getState();
      const userId = authUser?.id;

      if (!userId) {
        Alert.alert('Error', 'You must be logged in. Please try restarting the app.');
        return;
      }

      const success = await pointsService.trackDailyHabit(userId, 'microlearn');

      if (success) {
        const today = new Date();
        const hour = today.getHours();
        const dateToUse = hour < 4 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
        const dateString = dateToUse.toISOString().split('T')[0];

        await useActionStore.getState().loadDailyHabits(dateString);

        Alert.alert('Success', 'Microlearn completed! +15 EXP\n\nCheck the Action page to see it highlighted.');
      } else {
        Alert.alert('Info', 'Microlearn already completed today or not eligible for EXP');
      }
    } catch (err) {
      console.error('Error completing microlearn:', err);
      Alert.alert('Error', 'Failed to complete microlearn: ' + err);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const initializeScreen = async () => {
        try {
          await Promise.allSettled([
            fetchInformation(),
            fetchUserProgress(),
            fetchEngagementCounts(),
          ]);
        } catch (err) {
          console.error('Error during initialization:', err);
        }
      };
      initializeScreen();
    }, 0);

    return () => clearTimeout(timer);
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchUserProgress();
      }
      fetchEngagementCounts();
    }, [user])
  );

  const fetchInformation = async () => {
    try {
      setError('');

      const { data, error: fetchError } = await supabase
        .from('information')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInformation(data || []);
    } catch (err) {
      console.error('Error fetching information:', err);
      setError('Failed to load microlearning content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      const progressMap: { [key: string]: any } = {};
      data?.forEach((progress) => {
        progressMap[progress.information_id] = progress;
      });

      setUserProgress(progressMap);
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  const fetchEngagementCounts = async () => {
    try {
      const { data, error: countsError } = await supabase.rpc(
        'get_microlearn_completion_counts'
      );
      if (countsError) throw countsError;

      const map: { [id: string]: { completion_count: number; start_count: number } } = {};
      (data || []).forEach((row: any) => {
        map[row.information_id] = {
          completion_count: Number(row.completion_count) || 0,
          start_count: Number(row.start_count) || 0,
        };
      });
      setEngagementCounts(map);
    } catch (err) {
      console.error('Error fetching microlearn engagement counts:', err);
    }
  };

  const isStructuredCategory = (info: any) =>
    info.category === 'Books' || info.category === 'Core Habits' || info.is_book;

  const books = useMemo(() => {
    const list = information.filter((info) => info.category === 'Books' || info.is_book);

    const rankEngagement = (id: string) => {
      const stats = engagementCounts[id] || { completion_count: 0, start_count: 0 };
      return stats.completion_count * 1000 + stats.start_count;
    };

    const byEngagement = [...list].sort((a, b) => {
      const diff = rankEngagement(b.id) - rankEngagement(a.id);
      if (diff !== 0) return diff;
      return (a.title || '').localeCompare(b.title || '');
    });

    const trending = new Set<string>();
    for (const book of byEngagement) {
      if (trending.size >= TRENDING_TOP_N) break;
      if (rankEngagement(book.id) > 0) trending.add(book.id);
    }

    const isStarted = (id: string) => {
      const progress = userProgress[id];
      return !!(progress?.started_at || progress);
    };

    return [...list].sort((a, b) => {
      const aStarted = isStarted(a.id);
      const bStarted = isStarted(b.id);
      if (aStarted !== bStarted) return aStarted ? -1 : 1;

      if (aStarted && bStarted) {
        const aDone = !!userProgress[a.id]?.completed;
        const bDone = !!userProgress[b.id]?.completed;
        if (aDone !== bDone) return aDone ? 1 : -1;
      }

      const aTrend = trending.has(a.id);
      const bTrend = trending.has(b.id);
      if (aTrend !== bTrend) return aTrend ? -1 : 1;

      const eng = rankEngagement(b.id) - rankEngagement(a.id);
      if (eng !== 0) return eng;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [information, engagementCounts, userProgress]);

  const coreHabits = useMemo(() => {
    const order = [
      'Sleep',
      'Workout',
      'Exercise',
      'Meditation',
      'Water',
      'Focus',
      'Reflect',
      'Cold Shower',
      'Screen Time',
      'Microlearn',
      'Update Goal',
    ];
    const list = information.filter((info) => info.category === 'Core Habits');
    return [...list].sort((a, b) => {
      const ai = order.indexOf(a.title);
      const bi = order.indexOf(b.title);
      const ao = ai === -1 ? 999 : ai;
      const bo = bi === -1 ? 999 : bi;
      if (ao !== bo) return ao - bo;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [information]);

  const trendingIds = useMemo(() => {
    const list = information.filter((info) => info.category === 'Books' || info.is_book);
    const rankEngagement = (id: string) => {
      const stats = engagementCounts[id] || { completion_count: 0, start_count: 0 };
      return stats.completion_count * 1000 + stats.start_count;
    };
    const byEngagement = [...list].sort((a, b) => rankEngagement(b.id) - rankEngagement(a.id));
    const ids = new Set<string>();
    for (const book of byEngagement) {
      if (ids.size >= TRENDING_TOP_N) break;
      if (rankEngagement(book.id) > 0) ids.add(book.id);
    }
    return ids;
  }, [information, engagementCounts]);

  const renderBookCard = (info: any, index: number, listLength: number, opts?: { showTrending?: boolean }) => {
    const progress = userProgress[info.id];
    const isCompleted = progress?.completed;
    const isPassed = progress?.passed;
    const isInProgress = !isCompleted && !!(progress?.started_at || progress);
    const isTrending = !!opts?.showTrending && trendingIds.has(info.id);

    const bookCoverImage = info.cover_image_url || null;

    return (
      <View
        key={info.id}
        style={[
          styles.bookContainer,
          { width: bookWidth, marginRight: index === listLength - 1 ? 0 : BOOK_GAP },
        ]}
      >
        <View style={styles.bookTitleRow}>
          <Text style={styles.bookNameAbove} numberOfLines={2}>
            {info.title}
          </Text>
          {isTrending ? (
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingBadgeText}>Trending</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.book, { width: bookWidth }, isTrending && styles.bookTrending]}
          onPress={() => navigation.navigate('InformationDetail', { information: info })}
          activeOpacity={0.88}
        >
          {bookCoverImage ? (
            <Image
              source={{ uri: bookCoverImage }}
              style={styles.bookCoverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookSpine}>
              <Text style={styles.bookTitle} numberOfLines={4}>
                {info.title}
              </Text>
              {!!info.category && (
                <Text style={styles.bookCategory} numberOfLines={1}>
                  {info.category}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.bookMeta}>
          <Text style={styles.durationText}>{info.duration_minutes} min</Text>
          {isCompleted ? (
            <Ionicons
              name={isPassed ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isPassed ? '#16A34A' : '#DC2626'}
            />
          ) : isInProgress ? (
            <Text style={styles.continueLabel}>Continue</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const completed = information.filter(
    (info) => !isStructuredCategory(info) && userProgress[info.id]?.completed
  );

  const renderSection = (
    title: string,
    items: any[],
    muted?: boolean,
    onViewAll?: () => void,
    mode?: 'books' | 'core' | 'simple'
  ) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, muted && styles.sectionHeaderMuted]}>{title}</Text>
          {onViewAll ? (
            <TouchableOpacity onPress={onViewAll} activeOpacity={0.75} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={bookWidth + BOOK_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.booksCarousel}
        >
          {items.map((info, index) => {
            if (mode === 'books') return renderBookCard(info, index, items.length, { showTrending: true });
            if (mode === 'core') return renderBookCard(info, index, items.length, { showTrending: false });
            return renderSimpleCard(info, index, items.length);
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSimpleCard = (info: any, index: number, listLength: number) => {
    const progress = userProgress[info.id];
    const isCompleted = progress?.completed;
    const isPassed = progress?.passed;
    const isInProgress = !isCompleted && !!(progress?.started_at || progress);
    const bookCoverImage = info.cover_image_url || null;

    return (
      <View
        key={info.id}
        style={[
          styles.bookContainer,
          { marginRight: index === listLength - 1 ? 0 : BOOK_GAP },
        ]}
      >
        <TouchableOpacity
          style={[styles.book, { width: bookWidth }]}
          onPress={() => navigation.navigate('InformationDetail', { information: info })}
          activeOpacity={0.88}
        >
          {bookCoverImage ? (
            <Image
              source={{ uri: bookCoverImage }}
              style={styles.bookCoverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookSpine}>
              <Text style={styles.bookTitle} numberOfLines={4}>
                {info.title}
              </Text>
              {!!info.category && (
                <Text style={styles.bookCategory} numberOfLines={1}>
                  {info.category}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.bookMeta}>
          <Text style={styles.durationText}>{info.duration_minutes} min</Text>
          {isCompleted ? (
            <Ionicons
              name={isPassed ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isPassed ? '#16A34A' : '#DC2626'}
            />
          ) : isInProgress ? (
            <Text style={styles.continueLabel}>Continue</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <CustomBackground>
      <View style={[styles.container, { backgroundColor: PAGE_BG }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={DARK} />
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Microlearning</Text>
              <Text style={styles.headerSubtitle}>Quick insights for personal growth</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {__DEV__ && (
            <TouchableOpacity
              style={styles.devBtn}
              onPress={handleCompleteMicrolearn}
              activeOpacity={0.88}
            >
              <Text style={styles.devBtnText}>Complete Microlearn (+15 EXP)</Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={DARK} />
              <Text style={styles.stateText}>Loading microlearning content...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchInformation} activeOpacity={0.88}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : information.length === 0 ? (
            <View style={[styles.card, styles.emptyCard]}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={26} color={DARK} />
              </View>
              <Text style={styles.emptyTitle}>No content yet</Text>
              <Text style={styles.emptySubtext}>Check back later for new microlearning.</Text>
            </View>
          ) : (
            <>
              {renderSection('Books', books, false, () => navigation.navigate('AllBooks'), 'books')}
              {renderSection(
                'Core Habits',
                coreHabits,
                false,
                () => navigation.navigate('AllBooks', { category: 'Core Habits' }),
                'core'
              )}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>Podcasts</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.booksCarousel}
                >
                  <View style={[styles.bookContainer, { width: bookWidth }]}>
                    <View style={styles.bookTitleRow}>
                      <Text style={styles.bookNameAbove} numberOfLines={2}>
                        Coming soon
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.book, { width: bookWidth }]}
                      activeOpacity={0.88}
                      onPress={() =>
                        Alert.alert(
                          'Podcasts coming soon',
                          'Written breakdowns of great podcasts — key ideas, lessons, and takeaways.'
                        )
                      }
                    >
                      <View style={styles.podcastCover}>
                        <Ionicons name="mic-outline" size={28} color="#FFFFFF" />
                        <Text style={styles.podcastCoverLabel}>PODCAST</Text>
                        <Text style={styles.podcastCoverTitle}>Coming soon</Text>
                        <Text style={styles.podcastCoverInfo} numberOfLines={4}>
                          Written breakdowns of great podcasts — key ideas, lessons, and takeaways.
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.bookMeta}>
                      <Text style={styles.durationText}>Soon</Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
              <View style={[styles.section, styles.completedSection]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, styles.sectionHeaderMuted]}>Completed</Text>
                </View>
                {completed.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={bookWidth + BOOK_GAP}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    contentContainerStyle={styles.booksCarousel}
                  >
                    {completed.map((info, index) => renderSimpleCard(info, index, completed.length))}
                  </ScrollView>
                ) : (
                  <View style={styles.completedEmpty}>
                    <Text style={styles.completedEmptyText}>Nothing completed yet</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  sectionHeaderMuted: {
    color: '#6B7280',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  podcastCover: {
    flex: 1,
    backgroundColor: DARK,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastCoverLabel: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.55)',
  },
  podcastCoverTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  podcastCoverInfo: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  completedSection: {
    marginBottom: 12,
  },
  completedEmpty: {
    marginHorizontal: 20,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  completedEmptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  booksCarousel: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  bookContainer: {
    alignItems: 'center',
  },
  bookTitleRow: {
    width: '100%',
    minHeight: 40,
    marginBottom: 6,
    justifyContent: 'flex-end',
    gap: 4,
  },
  bookNameAbove: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
    lineHeight: 15,
    textAlign: 'center',
  },
  trendingBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C2410C',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  book: {
    height: 180,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  bookTrending: {
    borderColor: '#FDBA74',
    shadowColor: '#EA580C',
    shadowOpacity: 0.18,
  },
  bookSpine: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DARK,
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
  },
  bookTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  bookCategory: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  continueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    marginTop: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: DARK,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  devBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: DARK,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  devBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
