import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import RenderHtml from 'react-native-render-html';

export default function InformationDetailScreen({ route, navigation }: any) {
  const { theme } = useTheme();
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
  const isBook = memoizedInformation.category === 'Books' || memoizedInformation.is_book;
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const pageScrollViewRef = useRef<any>(null);

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
      
      // Find all h3 sections
      const h3Matches = part2Content.match(/<h3>[^<]+<\/h3>/g);
      
      if (h3Matches && h3Matches.length > 0) {
        h3Matches.forEach((match: string, index: number) => {
          const sectionStart = part2Content.indexOf(match);
          const nextMatch = index < h3Matches.length - 1 ? h3Matches[index + 1] : null;
          const sectionEnd = nextMatch 
            ? part2Content.indexOf(nextMatch, sectionStart + 1)
            : part2Content.length;
          
          const sectionContent = part2Content.substring(sectionStart, sectionEnd);
          const sectionTitle = match.match(/<h3>([^<]+)<\/h3>/)?.[1]?.trim() || `Section ${index + 1}`;
          
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

  // Auto-scroll to center the active page dot
  useEffect(() => {
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
    // Set initial loading state immediately
    setLoading(true);
    
    // Parse lessons if it's a book
    if (isBook) {
      const parsedLessons = parseLessons();
      setLessons(parsedLessons);
      // If no preview needed, go straight to reading
      if (parsedLessons.length === 0) {
        setCurrentStep('reading');
      }
    } else {
      setCurrentStep('reading');
    }
    
    // Use setTimeout to move heavy operations to next tick
    const timer = setTimeout(() => {
      const initializeScreen = async () => {
        try {
          // Run operations in parallel for better performance
          const [questionsResult, progressResult] = await Promise.allSettled([
            fetchQuestions(),
            checkUserProgress()
          ]);
          
          // Handle results independently
          if (questionsResult.status === 'fulfilled') {
            // Questions already handled in fetchQuestions
          }
          
          if (progressResult.status === 'fulfilled') {
            // Progress already handled in checkUserProgress
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

  const checkUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('information_id', memoizedInformation.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setUserProgress({
          hasCompleted: true,
          passed: data.passed,
          score: data.score_percentage,
          attempts_count: data.attempts_count || 0
        });
      }
    } catch (error) {
      console.error('Error checking user progress:', error);
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

      // Save user progress (removed points_earned)
      if (user) {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            information_id: memoizedInformation.id,
            completed: true,
            passed: isPassed,
            score_percentage: percentage,
            correct_answers: correct,
            user_answers: userAnswers, // Save the actual user answers
            completed_at: new Date().toISOString(),
            attempts_count: (userProgress.attempts_count || 0) + 1, // Increment attempts
          }, {
            onConflict: 'user_id,information_id' // Specify the conflict resolution
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
    
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
              {memoizedInformation.title}
            </Text>
            <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
              {memoizedInformation.duration_minutes} min read
            </Text>
          </View>

          <View style={styles.previewDescription}>
            <Text style={[styles.previewDescriptionText, { color: theme.textPrimary }]}>
              A comprehensive guide to financial literacy and wealth building. Learn the fundamental principles that separate the rich from the poor and discover how to make money work for you.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.startReadingButton, { backgroundColor: theme.primary }]}
            onPress={() => setCurrentStep('reading')}
          >
            <Text style={styles.startReadingButtonText}>Start Reading</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          {bookLessons.length > 0 && (
            <View style={styles.lessonsPreview}>
              <Text style={[styles.lessonsPreviewTitle, { color: theme.textPrimary }]}>
                Pages
              </Text>
              {bookLessons.map((lesson, index) => (
                <View key={lesson.id} style={styles.lessonPreviewItem}>
                  <Text style={[styles.lessonPreviewNumber, { color: theme.primary }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.lessonPreviewTitle, { color: theme.textPrimary }]}>
                    {lesson.title}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderReadingContent = () => {
    // If it's a book with lessons, show lesson navigation
    if (isBook && lessons.length > 0) {
      const currentLesson = lessons[currentLessonIndex];
      
      return (
        <View style={styles.content}>
          {/* Lesson Content */}
          <ScrollView 
            style={styles.lessonContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lessonScrollContent}
          >
            <View style={styles.readingContainer}>
              <RenderHtml
                contentWidth={300}
                source={{ html: currentLesson.content }}
                baseStyle={{
                  color: theme.textPrimary,
                  fontSize: 16,
                  lineHeight: 24,
                }}
                tagsStyles={{
                  h1: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, marginTop: 0 },
                  h2: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 16 },
                  h3: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 14 },
                  p: { marginBottom: 12 },
                  ul: { marginBottom: 12, paddingLeft: 0, listStyleType: 'none' },
                  ol: { marginBottom: 12, paddingLeft: 20 },
                  li: { marginBottom: 4 },
                  strong: { fontWeight: 'bold' },
                  em: { fontStyle: 'italic' },
                  u: { textDecorationLine: 'underline' },
                }}
              />
            </View>
          </ScrollView>

          {/* Fixed Navigation at Bottom */}
          <View style={[styles.fixedBottomNav, { backgroundColor: theme.background }]}>
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
                      { 
                        backgroundColor: index === currentLessonIndex ? theme.primary : 'rgba(128, 128, 128, 0.3)',
                      }
                    ]}
                    onPress={() => setCurrentLessonIndex(index)}
                  >
                    <Text style={[
                      styles.pageDotText,
                      { color: index === currentLessonIndex ? 'white' : theme.textSecondary }
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
                  style={[styles.lessonNavButton, { borderColor: theme.primary }]}
                  onPress={() => setCurrentLessonIndex(currentLessonIndex - 1)}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.primary} />
                  <Text style={[styles.lessonNavButtonText, { color: theme.primary }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.lessonNavButtonPlaceholder} />
              )}
              
              {currentLessonIndex < lessons.length - 1 ? (
                <TouchableOpacity
                  style={[styles.lessonNavButton, { backgroundColor: theme.primary }]}
                  onPress={() => setCurrentLessonIndex(currentLessonIndex + 1)}
                >
                  <Text style={styles.lessonNavButtonTextWhite}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.startQuizButton, { backgroundColor: theme.primary }]}
                  onPress={() => setCurrentStep('quiz')}
                >
                  <Text style={styles.startQuizButtonText}>Start Quiz</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
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
          <Text style={[styles.duration, { color: theme.textSecondary }]}>
            {memoizedInformation.duration_minutes} min read
          </Text>
          <Text style={[styles.category, { color: theme.textTertiary }]}>
            {information.category || 'General'}
          </Text>
        </View>



        <RenderHtml
          contentWidth={300}
          source={{ html: memoizedInformation.content_text }}
          baseStyle={{
            color: theme.textPrimary,
            fontSize: 16,
            lineHeight: 24,
          }}
          tagsStyles={{
            h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 20 },
            h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
            h3: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 14 },
            p: { marginBottom: 12 },
            ul: { marginBottom: 12, paddingLeft: 20 },
            ol: { marginBottom: 12, paddingLeft: 20 },
            li: { marginBottom: 4 },
            strong: { fontWeight: 'bold' },
            em: { fontStyle: 'italic' },
            u: { textDecorationLine: 'underline' },
          }}
        />

        <View style={styles.actionContainer}>
          {userProgress.hasCompleted ? (
            <>
              {userProgress.passed ? (
                <View style={[
                  styles.completedContainer, 
                  { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
                ]}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color="#22C55E" 
                  />
                  <Text style={[
                    styles.completedText, 
                    { color: '#22C55E' }
                  ]}>
                    Completed
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.completedContainer, 
                    { backgroundColor: 'rgba(239, 68, 68, 0.2)' }
                  ]}
                  onPress={() => setCurrentStep('quiz')}
                >
                  <Ionicons 
                    name="refresh" 
                    size={24} 
                    color="#EF4444" 
                  />
                  <Text style={[
                    styles.completedText, 
                    { color: '#EF4444' }
                  ]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.reviewButton, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}
                onPress={() => setCurrentStep('review')}
              >
                <Text style={[styles.reviewButtonText, { color: theme.textPrimary }]}>Review Questions</Text>
                <Ionicons name="eye-outline" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.startQuizButton, { backgroundColor: theme.primary }]}
              onPress={() => setCurrentStep('quiz')}
            >
              <Text style={styles.startQuizButtonText}>Start Quiz</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
  };

  const renderQuiz = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.quizContainer}>
        <Text style={[styles.quizTitle, { color: theme.textPrimary }]}>
          Quiz: {memoizedInformation.title}
        </Text>
        <Text style={[styles.quizSubtitle, { color: theme.textSecondary }]}>
          Answer all 5 questions to test your knowledge
        </Text>

        {questions.map((question, index) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
              Question {index + 1} of {questions.length}
            </Text>
            <Text style={[styles.questionText, { color: theme.textPrimary }]}>
              {question.question_text}
            </Text>

            <View style={styles.optionsContainer}>
              {['A', 'B', 'C', 'D'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    userAnswers[question.id] === option && styles.selectedOption
                  ]}
                  onPress={() => handleAnswerSelect(question.id, option)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: theme.textPrimary },
                    userAnswers[question.id] === option && styles.selectedOptionText
                  ]}>
                    {option}. {question[`option_${option.toLowerCase()}`]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.quizActions}>
          <TouchableOpacity
            style={styles.backToReadingButton}
            onPress={() => setCurrentStep('reading')}
          >
            <Text style={[styles.backToReadingText, { color: theme.textSecondary }]}>
              Back to Reading
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitQuizButton,
              { backgroundColor: theme.primary },
              quizLoading && styles.disabledButton
            ]}
            onPress={submitQuiz}
            disabled={quizLoading}
          >
            {quizLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitQuizButtonText}>Submit Quiz</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderResults = () => (
    <View style={styles.content}>
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: theme.textPrimary }]}>
          Quiz Results
        </Text>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: theme.textPrimary }]}>
            {userProgress.score}%
          </Text>
          <Text style={[
            styles.passFailText,
            userProgress.passed ? { color: '#10B981' } : { color: '#EF4444' }
          ]}>
            {userProgress.passed ? 'PASSED! 🎉' : 'FAILED ❌'}
          </Text>
          <Text style={[styles.pointsText, { color: theme.textSecondary }]}>
            {userProgress.passed ? `You earned ${memoizedInformation.points_reward || 1} point!` : 'You need 80% or higher to pass (4/5 or 5/5 correct).'}
          </Text>
        </View>

        <View style={styles.resultsActions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={resetQuiz}
          >
            <Text style={[styles.retryButtonText, { color: theme.textSecondary }]}>
              Try Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backToMicrolearningButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToMicrolearningButtonText}>Back to Microlearning</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

    const renderReview = () => {
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewContainer}>
          <Text style={[styles.reviewTitle, { color: theme.textPrimary }]}>
            Quiz Review: {memoizedInformation.title}
          </Text>
          
          {loadingAnswers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading review data...
              </Text>
            </View>
          ) : Object.keys(previousAnswers).length === 0 ? (
            <View style={styles.noReviewContainer}>
              <Ionicons name="information-circle-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.noReviewTitle, { color: theme.textPrimary }]}>
                Review Not Available
              </Text>
              <Text style={[styles.noReviewText, { color: theme.textSecondary }]}>
                This quiz was completed before the review feature was added. 
                Future quizzes will include detailed review information.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.reviewSubtitle, { color: theme.textSecondary }]}>
                Your answers and the correct answers
              </Text>

              {questions.map((question, index) => {
                const userAnswer = previousAnswers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <View key={question.id} style={styles.reviewQuestionContainer}>
                    <Text style={[styles.reviewQuestionNumber, { color: theme.textSecondary }]}>
                      Question {index + 1} of {questions.length}
                    </Text>
                    <Text style={[styles.reviewQuestionText, { color: theme.textPrimary }]}>
                      {question.question_text}
                    </Text>

                    <View style={styles.reviewOptionsContainer}>
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
                              { color: theme.textPrimary },
                              isUserAnswer && isCorrectAnswer && styles.correctAnswerText,
                              isUserAnswer && !isCorrectAnswer && styles.incorrectAnswerText,
                              !isUserAnswer && isCorrectAnswer && styles.correctAnswerText
                            ]}>
                              {option}. {optionText}
                            </Text>
                            {isUserAnswer && (
                              <Ionicons 
                                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                                size={20} 
                                color={isCorrect ? "#22C55E" : "#EF4444"} 
                              />
                            )}
                            {!isUserAnswer && isCorrectAnswer && (
                              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={[styles.backToReadingButton, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}
                  onPress={() => setCurrentStep('reading')}
                >
                  <Text style={[styles.backToReadingText, { color: theme.textSecondary }]}>
                    Back to Reading
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {currentStep === 'preview' ? memoizedInformation.title :
             currentStep === 'reading' ? memoizedInformation.title :
             currentStep === 'quiz' ? 'Quiz' : 
             currentStep === 'results' ? 'Results' :
             currentStep === 'review' ? 'Review' : memoizedInformation.title}
          </Text>
          {userProgress.hasCompleted && (
            <View style={[
              styles.completionBadge,
              userProgress.passed ? { backgroundColor: '#10B981' } : { backgroundColor: '#EF4444' }
            ]}>
              <Text style={styles.completionBadgeText}>
                {userProgress.passed ? '✓' : '✗'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading content...
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  completionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  readingContainer: {
    padding: 24,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  duration: {
    fontSize: 14,
    fontWeight: '500',
  },
  category: {
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  actionContainer: {
    alignItems: 'center',
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startQuizButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quizContainer: {
    padding: 24,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  quizSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  questionContainer: {
    marginBottom: 32,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  selectedOption: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  quizActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backToReadingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backToReadingText: {
    fontSize: 14,
  },
  submitQuizButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitQuizButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  passFailText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backToMicrolearningButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToMicrolearningButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewContainer: {
    flex: 1,
    padding: 24,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  reviewSubtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  reviewQuestionContainer: {
    marginBottom: 32,
  },
  reviewQuestionNumber: {
    fontSize: 14,
    marginBottom: 8,
  },
  reviewQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  reviewOptionsContainer: {
    gap: 8,
  },
  reviewOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  correctAnswer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22C55E',
  },
  incorrectAnswer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  reviewOptionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  correctAnswerText: {
    color: '#22C55E',
    fontWeight: '600',
  },
  incorrectAnswerText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  reviewActions: {
    marginTop: 32,
    alignItems: 'center',
  },
  noReviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noReviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noReviewText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  previewContainer: {
    padding: 24,
  },
  previewHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewDescription: {
    marginBottom: 32,
  },
  previewDescriptionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  startReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  lessonsPreview: {
    marginBottom: 32,
  },
  lessonsPreviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  lessonPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  lessonPreviewNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  lessonPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  startReadingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  lessonContent: {
    flex: 1,
  },
  lessonScrollContent: {
    paddingBottom: 20,
  },
  fixedBottomNav: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  pageNavigationFixed: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pageDotsContainer: {
    gap: 10,
    justifyContent: 'center',
  },
  pageDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageDotActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pageDotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 32,
  },
  lessonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lessonNavButtonPlaceholder: {
    flex: 1,
  },
  lessonNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  lessonNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lessonNavButtonTextWhite: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
 