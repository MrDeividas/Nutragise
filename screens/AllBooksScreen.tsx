import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';

const DARK = '#1f2937';
const PAGE_BG = '#F8F9FB';

export default function AllBooksScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();
  const category: string = route?.params?.category === 'Core Habits' ? 'Core Habits' : 'Books';
  const isCoreHabits = category === 'Core Habits';
  const screenTitle = isCoreHabits ? 'All Core Habits' : 'All Books';
  const itemLabel = isCoreHabits ? 'habit' : 'book';
  const itemLabelPlural = isCoreHabits ? 'habits' : 'books';

  const [books, setBooks] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const HORIZONTAL_PADDING = 20;
  const BOOK_GAP = 12;
  const columns = 3;
  const bookWidth = (screenWidth - HORIZONTAL_PADDING * 2 - BOOK_GAP * (columns - 1)) / columns;

  const loadItems = async () => {
    try {
      setError('');
      const { data, error: fetchError } = await supabase
        .from('information')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('title', { ascending: true });

      if (fetchError) throw fetchError;
      setBooks(data || []);
    } catch (err) {
      console.error(`Error fetching ${itemLabelPlural}:`, err);
      setError(`Failed to load ${itemLabelPlural}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [category]);

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

  useFocusEffect(
    React.useCallback(() => {
      if (user) fetchUserProgress();
    }, [user])
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter((book) => {
      const title = (book.title || '').toLowerCase();
      const description = (book.short_description || '').toLowerCase();
      return title.includes(q) || description.includes(q);
    });
  }, [books, searchQuery]);

  const renderBook = (info: any) => {
    const progress = userProgress[info.id];
    const isCompleted = progress?.completed;
    const isPassed = progress?.passed;
    const isInProgress = !isCompleted && !!(progress?.started_at || progress);
    const bookCoverImage = info.cover_image_url || null;

    return (
      <View key={info.id} style={[styles.bookContainer, { width: bookWidth }]}>
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
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.bookName} numberOfLines={2}>
          {info.title}
        </Text>
        <View style={styles.bookMeta}>
          <Text style={styles.durationText}>{info.duration_minutes} min</Text>
          {isCompleted ? (
            <Ionicons
              name={isPassed ? 'checkmark-circle' : 'close-circle'}
              size={14}
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
              <Text style={styles.headerTitle}>{screenTitle}</Text>
              <Text style={styles.headerSubtitle}>
                {loading
                  ? 'Loading…'
                  : `${filteredBooks.length} ${filteredBooks.length === 1 ? itemLabel : itemLabelPlural}`}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={isCoreHabits ? 'Search habits…' : 'Search books…'}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={DARK} />
            <Text style={styles.stateText}>Loading {itemLabelPlural}…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                loadItems();
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {filteredBooks.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={isCoreHabits ? 'fitness-outline' : 'book-outline'}
                    size={26}
                    color={DARK}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim()
                    ? 'No matches'
                    : isCoreHabits
                      ? 'No core habits yet'
                      : 'No books yet'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery.trim()
                    ? 'Try a different title or clear your search.'
                    : isCoreHabits
                      ? 'Check back later for new core habits.'
                      : 'Check back later for new books.'}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredBooks.map((book) => renderBook(book))}
              </View>
            )}
          </ScrollView>
        )}
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
    paddingBottom: 10,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: DARK,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookContainer: {
    marginBottom: 8,
  },
  book: {
    height: 168,
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
  bookSpine: {
    flex: 1,
    padding: 12,
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
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  bookName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: DARK,
    lineHeight: 16,
    minHeight: 32,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  continueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
});
