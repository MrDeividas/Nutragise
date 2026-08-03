import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import RenderHtml from 'react-native-render-html';
import { ensureMicrolearnStart, getMicrolearnLimitHint } from '../lib/microlearnAccess';
const DARK = '#1f2937';
const PAGE_BG = '#F8F9FB';

export default function InformationDetailScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const { information } = route.params;

  // Memoize the information to prevent unnecessary re-renders
  const memoizedInformation = React.useMemo(() => information, [information]);

  // Consolidated state for better performance
  const [currentStep, setCurrentStep] = useState<'preview' | 'reading' | 'quiz' | 'results' | 'review'>('preview');
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [limitHint, setLimitHint] = useState(
    '1 microlearn per day · Level 3 unlocks 2 · Level 5 unlocks 3 · Pro is unlimited'
  );
  const [userProgress, setUserProgress] = useState<{
    hasCompleted: boolean;
    passed: boolean;
    score: number;
    attempts_count?: number;
  }>({
    hasCompleted: false,
    passed: false,
    score: 0,
    attempts_count: 0
  });
  
  // Review state
  const [previousAnswers, setPreviousAnswers] = useState<{[key: string]: string}>({});
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  // Book/Lesson state
  const isLessonContent =
    memoizedInformation.category === 'Books' ||
    memoizedInformation.category === 'Core Habits' ||
    memoizedInformation.is_book;
  const isBook = isLessonContent;
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const pageScrollViewRef = useRef<any>(null);
  const lessonScrollViewRef = useRef<ScrollView>(null);
  const [lessonScrollProgress, setLessonScrollProgress] = useState(0);
  const [lessonContentHeight, setLessonContentHeight] = useState(0);
  const [lessonViewportHeight, setLessonViewportHeight] = useState(0);

  // Parse lessons from book content
  const parseLessons = () => {
    if (!isBook || !memoizedInformation.content_text) return [];
    
    const content = memoizedInformation.content_text;
    const lessons: any[] = [];
    let lessonOrder = 0;
    
    // Split content by PART (h1 tags)
    const part1Match = content.match(/<h1>PART 1[^<]*<\/h1>([\s\S]*?)(?=<h1>PART 2|$)/);
    const part2Match = content.match(/<h1>PART 2[^<]*<\/h1>([\s\S]*)/);
    
    // Add Part 1 as a single lesson
    if (part1Match) {
      const part1Title = content.match(/<h1>(PART 1[^<]*)<\/h1>/)?.[1]?.trim() || 'Part 1';
      const part1Content = '<h1>' + part1Title + '</h1>' + part1Match[1];
      
      lessons.push({
        id: `lesson-${lessonOrder}`,
        title: part1Title,
        content: part1Content,
        order: lessonOrder
      });
      lessonOrder++;
    }
    
    // Split Part 2 by h3 sections (Introduction, Lesson 1, Lesson 2, etc.)
    if (part2Match) {
      const part2Content = part2Match[0];
      
      // Extract Part 2 title and subtitle
      const part2Title = part2Content.match(/<h1>(PART 2[^<]*)<\/h1>/)?.[1]?.trim() || 'Part 2';
      const part2Subtitle = part2Content.match(/<h2>([^<]+)<\/h2>/)?.[1]?.trim() || '';
      
      // Split Part 2 into sequential h3 sections (avoid indexOf so duplicate titles stay distinct)
      const h3Regex = /<h3>[^<]+<\/h3>/g;
      const h3Matches: { match: string; index: number }[] = [];
      let h3Match: RegExpExecArray | null;
      while ((h3Match = h3Regex.exec(part2Content)) !== null) {
        h3Matches.push({ match: h3Match[0], index: h3Match.index });
      }
      
      if (h3Matches.length > 0) {
        h3Matches.forEach((entry, index) => {
          const sectionStart = entry.index;
          const sectionEnd = index < h3Matches.length - 1
            ? h3Matches[index + 1].index
            : part2Content.length;
          
          const sectionContent = part2Content.substring(sectionStart, sectionEnd);
          const sectionTitle = entry.match.match(/<h3>([^<]+)<\/h3>/)?.[1]?.trim() || `Section ${index + 1}`;
          
          // Include Part 2 header on first section only
          const fullContent = index === 0 
            ? `<h1>${part2Title}</h1><h2>${part2Subtitle}</h2>${sectionContent}`
            : sectionContent;
          
          lessons.push({
            id: `lesson-${lessonOrder}`,
            title: sectionTitle,
            content: fullContent,
            order: lessonOrder
          });
          lessonOrder++;
        });
      } else {
        // Fallback: Add Part 2 as a single lesson if no h3 sections found
        lessons.push({
          id: `lesson-${lessonOrder}`,
          title: part2Title,
          content: part2Content,
          order: lessonOrder
        });
      }
    }
    
    return lessons;
  };

  // Auto-scroll page dots to center the active page, and reset reading scroll to top
  useEffect(() => {
    lessonScrollViewRef.current?.scrollTo({ y: 0, animated: false });
    setLessonScrollProgress(0);

    if (pageScrollViewRef.current && lessons.length > 0) {
      // Small delay to ensure ScrollView is rendered
      setTimeout(() => {
        // Calculate scroll position to center the active dot
        const dotWidth = 40; // Width of inactive dot
        const activeDotWidth = 44; // Width of active dot
        const gap = 10; // Gap between dots
        
        // Calculate the x position of the current dot
        let xPosition = 0;
        for (let i = 0; i < currentLessonIndex; i++) {
          xPosition += dotWidth + gap;
        }
        
        // Add half of the active dot width to center it
        xPosition += activeDotWidth / 2;
        
        // Calculate the offset to center in viewport
        // Assuming viewport width is around 350px (adjust based on device)
        const viewportWidth = 350;
        const centerOffset = viewportWidth / 2;
        
        // Calculate final scroll position
        const scrollX = Math.max(0, xPosition - centerOffset);
        
        pageScrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
      }, 100);
    }
  }, [currentLessonIndex, lessons.length]);

  // Optimized initialization - move heavy operations to background
  useEffect(() => {
    setLoading(true);

    if (isBook) {
      setLessons(parseLessons());
    }

    // Always land on preview first. Auto-enter reading only after access check
    // (non-books / books with no parseable lessons), so free-tier limits apply.
    const timer = setTimeout(() => {
      const initializeScreen = async () => {
        try {
          const [, progress] = await Promise.all([
            fetchQuestions(),
            checkUserProgress(),
          ]);
          setLimitHint(await getMicrolearnLimitHint(user?.id));

          const parsed = isBook ? parseLessons() : [];
          const shouldAutoEnter = !isBook || parsed.length === 0;

          if (shouldAutoEnter) {
            if (progress?.hasStarted) {
              setCurrentStep('reading');
            } else {
              await enterReading({ silentLimit: true });
            }
          }
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      };

      initializeScreen();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Load previous answers when entering review mode
  useEffect(() => {
    if (currentStep === 'review' && userProgress.hasCompleted) {
      const loadPreviousAnswers = async () => {
        if (!user) return;
        
        try {
          setLoadingAnswers(true);
          const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('information_id', memoizedInformation.id)
            .single();
            
          if (data) {
            if (data.user_answers) {
              setPreviousAnswers(data.user_answers);
            } else {
              console.log('No user answers stored for this quiz');
            }
          }
        } catch (error) {
          console.error('Error loading previous answers:', error);
        } finally {
          setLoadingAnswers(false);
        }
      };
      
      loadPreviousAnswers();
    }
  }, [currentStep, userProgress.hasCompleted, user, memoizedInformation.id]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('information_id', memoizedInformation.id)
        .order('question_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to load quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserProgress = async (): Promise<{ hasStarted: boolean; hasCompleted: boolean } | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('information_id', memoizedInformation.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const started = !!(data.started_at || data.id);
        setHasStarted(started);
        setStartedAt(data.started_at || data.created_at || null);
        setUserProgress({
          hasCompleted: !!data.completed,
          passed: !!data.passed,
          score: data.score_percentage || 0,
          attempts_count: data.attempts_count || 0,
        });
        return { hasStarted: started, hasCompleted: !!data.completed };
      }

      setHasStarted(false);
      setStartedAt(null);
      return { hasStarted: false, hasCompleted: false };
    } catch (error) {
      console.error('Error checking user progress:', error);
      return null;
    }
  };

  const enterReading = async (opts?: { silentLimit?: boolean }) => {
    if (!user) {
      Alert.alert('Sign in required', 'You must be logged in to start a microlearn.');
      return false;
    }

    setStarting(true);
    try {
      const result = await ensureMicrolearnStart(user.id, memoizedInformation.id);
      if (!result.allowed) {
        if (result.reason === 'daily_limit') {
          // Open shared Pro modal on explicit Start; stay on preview for silent auto-enter
          if (!opts?.silentLimit) {
            navigation.navigate('UpgradeToPro', {
              subtitle:
                "You've hit today's new-microlearn limit. Level up for more daily starts, or upgrade to Pro for unlimited — anything you've already started stays unlocked.",
            });
          }
        } else if (!opts?.silentLimit) {
          Alert.alert('Unable to start', result.message);
        }
        return false;
      }

      setHasStarted(true);
      if (!startedAt) setStartedAt(new Date().toISOString());
      setCurrentStep('reading');
      return true;
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (userAnswers[question.id] === question.correct_answer) {
        correct++;
      }
    });
    const percentage = (correct / questions.length) * 100;
    return { correct, percentage };
  };

  const submitQuiz = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      Alert.alert('Incomplete Quiz', 'Please answer all questions before submitting.');
      return;
    }

    setQuizLoading(true);
    try {
      const { correct, percentage } = calculateScore();
      const isPassed = percentage >= 80; // 4/5 or 5/5 = pass

      // Save user progress — keep started_at so free users can always reopen this item
      if (user) {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            information_id: memoizedInformation.id,
            completed: true,
            passed: isPassed,
            score_percentage: percentage,
            correct_answers: correct,
            user_answers: userAnswers,
            completed_at: now,
            started_at: startedAt || now,
            attempts_count: (userProgress.attempts_count || 0) + 1,
          }, {
            onConflict: 'user_id,information_id'
          });

        if (error) throw error;
      }

      setUserProgress({
        hasCompleted: true,
        passed: isPassed,
        score: percentage
      });
      setCurrentStep('results');

      if (isPassed) {
        Alert.alert(
          'Congratulations! 🎉',
          `You passed with ${percentage}%!`,
          [{ text: 'OK' }]
        );
        // Refresh profile data
        navigation.setParams({ refreshProfile: true });
      } else {
        Alert.alert(
          'Quiz Completed',
          `You scored ${percentage}%. You need 80% or higher to pass.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setCurrentStep('reading');
  };

  const handleBackPress = () => {
    if (isBook && (currentStep === 'reading' || currentStep === 'preview')) {
      Alert.alert(
        'Exit Reading?',
        'Are you sure you want to exit? Your progress will be saved.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderPreview = () => {
    const bookLessons = parseLessons();
    const coverUri = memoizedInformation.cover_image_url || null;
    const description =
      memoizedInformation.short_description ||
      `${memoizedInformation.duration_minutes || 15}-minute summary of key ideas from ${memoizedInformation.title}.`;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <View style={styles.previewCard}>
          {coverUri ? (
            <View style={styles.coverWrap}>
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book-outline" size={28} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.previewTitle}>{memoizedInformation.title}</Text>
          <Text style={styles.previewSubtitle}>
            {memoizedInformation.duration_minutes} min read
            {memoizedInformation.category ? ` · ${memoizedInformation.category}` : ''}
          </Text>
          <Text style={styles.previewDescriptionText}>
            {description}
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, starting && styles.disabledButton]}
            onPress={() => enterReading()}
            disabled={starting}
            activeOpacity={0.88}
          >
            {starting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {hasStarted || userProgress.hasCompleted ? 'Continue Reading' : 'Start Reading'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
          {!hasStarted && !userProgress.hasCompleted && (
            <Text style={styles.limitHint}>
              {limitHint} · Started items stay unlocked
            </Text>
          )}
        </View>

        {bookLessons.length > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.cardLabel}>Pages</Text>
            {bookLessons.map((lesson, index) => (
              <View
                key={lesson.id}
                style={[
                  styles.lessonPreviewItem,
                  index === bookLessons.length - 1 && { marginBottom: 0 },
                ]}
              >
                <View style={styles.lessonPreviewNumberWrap}>
                  <Text style={styles.lessonPreviewNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.lessonPreviewTitle} numberOfLines={2}>
                  {lesson.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderReadingContent = () => {
    // If it's a book with lessons, show lesson navigation
    if (isBook && lessons.length > 0) {
      const currentLesson = lessons[currentLessonIndex];
      
      const canScrollLesson = lessonContentHeight > lessonViewportHeight + 8;
      const thumbHeight = canScrollLesson
        ? Math.max(28, (lessonViewportHeight / lessonContentHeight) * lessonViewportHeight)
        : lessonViewportHeight;
      const thumbTravel = Math.max(lessonViewportHeight - thumbHeight, 0);
      const thumbOffset = lessonScrollProgress * thumbTravel;

      return (
        <View style={styles.content}>
          {/* Chapter reading progress (how far through this page) */}
          <View style={styles.readProgressTrack}>
            <View
              style={[
                styles.readProgressFill,
                { width: `${Math.min(100, Math.max(0, lessonScrollProgress * 100))}%` },
              ]}
            />
          </View>

          {/* Lesson Content */}
          <View style={styles.lessonContentWrap}>
            <ScrollView 
              ref={lessonScrollViewRef}
              style={styles.lessonContent} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.lessonScrollContent}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                const maxScroll = contentSize.height - layoutMeasurement.height;
                setLessonScrollProgress(maxScroll > 0 ? Math.min(1, Math.max(0, contentOffset.y / maxScroll)) : 1);
              }}
              onContentSizeChange={(_w, h) => setLessonContentHeight(h)}
              onLayout={(e) => setLessonViewportHeight(e.nativeEvent.layout.height)}
            >
              <View style={styles.readingContainer}>
                <RenderHtml
                  contentWidth={300}
                  source={{ html: currentLesson.content }}
                  baseStyle={{
                    color: DARK,
                    fontSize: 16,
                    lineHeight: 24,
                  }}
                  tagsStyles={{
                    h1: { fontSize: 20, fontWeight: '700', marginBottom: 16, marginTop: 0, color: DARK },
                    h2: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 16, color: DARK },
                    h3: { fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 14, color: DARK },
                    p: { marginBottom: 12, color: '#374151' },
                    ul: { marginBottom: 12, paddingLeft: 0, listStyleType: 'none' },
                    ol: { marginBottom: 12, paddingLeft: 20 },
                    li: { marginBottom: 4, color: '#374151' },
                    strong: { fontWeight: '700' },
                    em: { fontStyle: 'italic' },
                    u: { textDecorationLine: 'underline' },
                  }}
                />
              </View>
            </ScrollView>

            {canScrollLesson && (
              <View style={styles.scrollBarTrack} pointerEvents="none">
                <View
                  style={[
                    styles.scrollBarThumb,
                    {
                      height: thumbHeight,
                      transform: [{ translateY: thumbOffset }],
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Fixed Navigation at Bottom */}
          <View style={styles.fixedBottomNav}>
            {/* Page Navigation Dots */}
            <View style={styles.pageNavigationFixed}>
              <ScrollView 
                ref={pageScrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pageDotsContainer}
              >
                {lessons.map((lesson, index) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[
                      styles.pageDot,
                      index === currentLessonIndex && styles.pageDotActive,
                    ]}
                    onPress={() => setCurrentLessonIndex(index)}
                    activeOpacity={0.88}
                  >
                    <Text style={[
                      styles.pageDotText,
                      index === currentLessonIndex && styles.pageDotTextActive,
                    ]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Lesson Navigation Buttons */}
            <View style={styles.lessonActions}>
              {currentLessonIndex > 0 ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setCurrentLessonIndex(currentLessonIndex - 1)}
                  activeOpacity={0.88}
                >
                  <Ionicons name="arrow-back" size={18} color={DARK} />
                  <Text style={styles.secondaryBtnText}>Previous</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.lessonNavButtonPlaceholder} />
              )}
              
              {currentLessonIndex < lessons.length - 1 ? (
                <TouchableOpacity
                  style={styles.primaryBtnFlex}
                  onPress={() => setCurrentLessonIndex(currentLessonIndex + 1)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryBtnFlex}
                  onPress={() => setCurrentStep('quiz')}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>Start Quiz</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }
    
    // Regular content (non-book)
    return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.readingContainer}>
        <View style={styles.metaInfo}>
          <Text style={styles.duration}>
            {memoizedInformation.duration_minutes} min read
          </Text>
          <Text style={styles.category}>
            {information.category || 'General'}
          </Text>
        </View>

        <RenderHtml
          contentWidth={300}
          source={{ html: memoizedInformation.content_text }}
          baseStyle={{
            color: DARK,
            fontSize: 16,
            lineHeight: 24,
          }}
          tagsStyles={{
            h1: { fontSize: 22, fontWeight: '700', marginBottom: 16, marginTop: 12, color: DARK },
            h2: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 16, color: DARK },
            h3: { fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 14, color: DARK },
            p: { marginBottom: 12, color: '#374151' },
            ul: { marginBottom: 12, paddingLeft: 20 },
            ol: { marginBottom: 12, paddingLeft: 20 },
            li: { marginBottom: 4, color: '#374151' },
            strong: { fontWeight: '700' },
            em: { fontStyle: 'italic' },
            u: { textDecorationLine: 'underline' },
          }}
        />

        <View style={styles.actionContainer}>
          {userProgress.hasCompleted ? (
            <>
              {userProgress.passed ? (
                <View style={[styles.statusPill, styles.statusPassed]}>
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  <Text style={[styles.statusPillText, { color: '#16A34A' }]}>Completed</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.statusPill, styles.statusFailed]}
                  onPress={() => setCurrentStep('quiz')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="refresh" size={20} color="#DC2626" />
                  <Text style={[styles.statusPillText, { color: '#DC2626' }]}>Try Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.secondaryBtnFull}
                onPress={() => setCurrentStep('review')}
                activeOpacity={0.88}
              >
                <Text style={styles.secondaryBtnText}>Review Questions</Text>
                <Ionicons name="eye-outline" size={18} color={DARK} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setCurrentStep('quiz')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Start Quiz</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
  };

  const renderQuiz = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={styles.quizHeaderCard}>
        <Text style={styles.quizTitle}>Quiz: {memoizedInformation.title}</Text>
        <Text style={styles.quizSubtitle}>Answer all 5 questions to test your knowledge</Text>
      </View>

      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>
            Question {index + 1} of {questions.length}
          </Text>
          <Text style={styles.questionText}>{question.question_text}</Text>

          <View style={styles.optionsContainer}>
            {['A', 'B', 'C', 'D'].map((option) => {
              const selected = userAnswers[question.id] === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, selected && styles.selectedOption]}
                  onPress={() => handleAnswerSelect(question.id, option)}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                    {option}. {question[`option_${option.toLowerCase()}`]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.quizActions}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setCurrentStep('reading')}
          activeOpacity={0.88}
        >
          <Text style={styles.secondaryBtnText}>Back to Reading</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtnFlex, quizLoading && styles.disabledButton]}
          onPress={submitQuiz}
          disabled={quizLoading}
          activeOpacity={0.88}
        >
          {quizLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Submit Quiz</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderResults = () => (
    <View style={[styles.content, styles.scrollPad]}>
      <View style={styles.resultsCard}>
        <Text style={styles.resultsTitle}>Quiz Results</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{userProgress.score}%</Text>
          <Text
            style={[
              styles.passFailText,
              userProgress.passed ? { color: '#16A34A' } : { color: '#DC2626' },
            ]}
          >
            {userProgress.passed ? 'Passed' : 'Not passed'}
          </Text>
          <Text style={styles.pointsText}>
            {userProgress.passed
              ? `You earned ${memoizedInformation.points_reward || 1} point!`
              : 'You need 80% or higher to pass (4/5 or 5/5 correct).'}
          </Text>
        </View>

        <View style={styles.resultsActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={resetQuiz} activeOpacity={0.88}>
            <Text style={styles.secondaryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtnFlex}
            onPress={() => navigation.goBack()}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

    const renderReview = () => {
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <View style={styles.quizHeaderCard}>
          <Text style={styles.quizTitle}>Quiz Review</Text>
          <Text style={styles.quizSubtitle}>{memoizedInformation.title}</Text>
        </View>
          
          {loadingAnswers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={DARK} />
              <Text style={styles.loadingText}>Loading review data...</Text>
            </View>
          ) : Object.keys(previousAnswers).length === 0 ? (
            <View style={styles.previewCard}>
              <Ionicons name="information-circle-outline" size={40} color="#6B7280" />
              <Text style={[styles.emptyTitle, { marginTop: 12 }]}>Review Not Available</Text>
              <Text style={styles.emptySubtext}>
                This quiz was completed before the review feature was added. 
                Future quizzes will include detailed review information.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.reviewHint}>Your answers and the correct answers</Text>

              {questions.map((question, index) => {
                const userAnswer = previousAnswers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <View key={question.id} style={styles.questionCard}>
                    <Text style={styles.questionNumber}>
                      Question {index + 1} of {questions.length}
                    </Text>
                    <Text style={styles.questionText}>{question.question_text}</Text>

                    <View style={styles.optionsContainer}>
                      {['A', 'B', 'C', 'D'].map((option) => {
                        const optionText = question[`option_${option.toLowerCase()}`];
                        const isUserAnswer = userAnswer === option;
                        const isCorrectAnswer = question.correct_answer === option;
                        
                        return (
                          <View
                            key={option}
                            style={[
                              styles.reviewOptionContainer,
                              isUserAnswer && isCorrectAnswer && styles.correctAnswer,
                              isUserAnswer && !isCorrectAnswer && styles.incorrectAnswer,
                              !isUserAnswer && isCorrectAnswer && styles.correctAnswer
                            ]}
                          >
                            <Text style={[
                              styles.reviewOptionText,
                              isUserAnswer && isCorrectAnswer && styles.correctAnswerText,
                              isUserAnswer && !isCorrectAnswer && styles.incorrectAnswerText,
                              !isUserAnswer && isCorrectAnswer && styles.correctAnswerText
                            ]}>
                              {option}. {optionText}
                            </Text>
                            {isUserAnswer && (
                              <Ionicons 
                                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                                size={18} 
                                color={isCorrect ? "#16A34A" : "#DC2626"} 
                              />
                            )}
                            {!isUserAnswer && isCorrectAnswer && (
                              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.secondaryBtnFull}
                onPress={() => setCurrentStep('reading')}
                activeOpacity={0.88}
              >
                <Text style={styles.secondaryBtnText}>Back to Reading</Text>
              </TouchableOpacity>
            </>
          )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: PAGE_BG }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentStep === 'preview'
            ? memoizedInformation.title
            : currentStep === 'reading'
              ? memoizedInformation.title
              : currentStep === 'quiz'
                ? 'Quiz'
                : currentStep === 'results'
                  ? 'Results'
                  : currentStep === 'review'
                    ? 'Review'
                    : memoizedInformation.title}
        </Text>
        {userProgress.hasCompleted ? (
          <View
            style={[
              styles.completionBadge,
              userProgress.passed ? styles.badgePassed : styles.badgeFailed,
            ]}
          >
            <Ionicons
              name={userProgress.passed ? 'checkmark' : 'close'}
              size={14}
              color="#FFFFFF"
            />
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DARK} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : (
        <>
          {currentStep === 'preview' && renderPreview()}
          {currentStep === 'reading' && renderReadingContent()}
          {currentStep === 'quiz' && renderQuiz()}
          {currentStep === 'results' && renderResults()}
          {currentStep === 'review' && renderReview()}
        </>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  completionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePassed: {
    backgroundColor: '#16A34A',
  },
  badgeFailed: {
    backgroundColor: '#DC2626',
  },
  content: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  readingContainer: {
    padding: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  duration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  actionContainer: {
    alignItems: 'stretch',
    marginTop: 24,
    gap: 10,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  coverWrap: {
    width: 120,
    height: 168,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
  },
  previewSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  previewDescriptionText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
  },
  limitHint: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  cardLabel: {
    alignSelf: 'flex-start',
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },
  lessonPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    gap: 10,
  },
  lessonPreviewNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonPreviewNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lessonPreviewTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  primaryBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryBtnFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  lessonContentWrap: {
    flex: 1,
    position: 'relative',
  },
  lessonContent: {
    flex: 1,
  },
  lessonScrollContent: {
    paddingBottom: 20,
  },
  readProgressTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  readProgressFill: {
    height: 3,
    backgroundColor: DARK,
  },
  scrollBarTrack: {
    position: 'absolute',
    right: 4,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(31, 41, 55, 0.12)',
    overflow: 'hidden',
  },
  scrollBarThumb: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(31, 41, 55, 0.45)',
  },
  fixedBottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pageNavigationFixed: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pageDotsContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  pageDot: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageDotActive: {
    backgroundColor: DARK,
  },
  pageDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  pageDotTextActive: {
    color: '#FFFFFF',
  },
  lessonActions: {
    flexDirection: 'row',
    gap: 10,
  },
  lessonNavButtonPlaceholder: {
    flex: 1,
  },
  quizHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  quizSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 14,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
  },
  selectedOption: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    lineHeight: 20,
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  quizActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.55,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: DARK,
    marginBottom: 6,
  },
  passFailText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  statusPassed: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  statusFailed: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  statusPillText: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    gap: 8,
  },
  correctAnswer: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#16A34A',
  },
  incorrectAnswer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#DC2626',
  },
  reviewOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    lineHeight: 20,
    flex: 1,
  },
  correctAnswerText: {
    color: '#16A34A',
  },
  incorrectAnswerText: {
    color: '#DC2626',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

