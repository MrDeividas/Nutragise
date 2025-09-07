import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { useActionStore } from '../state/actionStore';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { insightService } from '../lib/insightService';
import { aiService } from '../lib/aiService';
import { initializeAI } from '../lib/config';
import { InsightCard } from '../types/insights';
import ProgressChart from '../components/ProgressChart';
import { 
  StreakInsight, 
  PatternInsight, 
  CorrelationInsight, 
  RecommendationInsight 
} from '../components/InsightComponents';
import { InsightSkeleton } from '../components/InsightSkeleton';
import CacheService from '../lib/cacheService';
import ConversationCacheService from '../lib/conversationCacheService';
import { smartSuggestionEngine } from '../lib/smartSuggestionEngine';
import TimePeriodUtils from '../lib/timePeriodUtils';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type ModalType = 'progress' | 'requirements' | null;

export default function InsightsScreen({ route }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { shouldOpenGraphs, setShouldOpenGraphs } = useActionStore();
  
  // Optimized state management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'past7' | 'currentWeek' | 'last30'>('past7');
  
  // Lazy loading states
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'basic' | 'detailed' | 'complete'>('initial');
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{
    exists: boolean;
    isValid: boolean;
    expiresIn: number | null;
  } | null>(null);
  
  const [suggestions, setSuggestions] = useState<string[]>([
    "How do I systematically build all core wellness habits?",
    "What's the best order to add habits to my routine?",
    "How can I master each core habit one by one?",
    "What's my biggest wellness opportunity?"
  ]);
  
  
  // Animated typing dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Destructure theme for efficiency
  const { textPrimary, textSecondary, primary, cardBackground, borderSecondary } = theme;

  // Optimized message ID generation with timestamp for uniqueness
  const generateMessageId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `msg_${timestamp}_${random}`;
  }, []);

  // Optimized state updates - batch message additions
  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => [...prev, ...newMessages]);
  }, []);

  // Optimized scroll management - only scroll on new messages
  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount, scrollToBottom]);

  // Auto-open graphs if flag is set in action store
  useEffect(() => {
    if (shouldOpenGraphs) {
      setActiveModal('progress');
      setShouldOpenGraphs(false);
    }
  }, [shouldOpenGraphs, setShouldOpenGraphs]);


  // Combined useEffect for initialization
  useEffect(() => {
    if (user) {
      initializeAI();
      loadInsights();
      loadSmartSuggestions();
      if (messages.length === 0) {
        initializeChat();
      }
    }
  }, [user]);

  // Reload insights when period changes
  useEffect(() => {
    if (user) {
      loadInsights(true);
    }
  }, [selectedPeriod, user]);

  const loadSmartSuggestions = async () => {
    if (!user) return;
    
    try {
      const smartSuggestions = await smartSuggestionEngine.generateSuggestions(user.id);
      setSuggestions(smartSuggestions);
    } catch (error) {
      // Keep fallback suggestions if smart suggestions fail
    }
  };

  const loadInsights = async (forceRefresh = false) => {
    if (!user) return;
    
    setIsLoadingInsights(true);
    setInsightError(null);
    setLoadingPhase('initial');
    
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        setIsLoadingFromCache(true);
        const cached = await CacheService.getCachedInsights(user.id);
        
        if (cached) {
          setInsights(cached.insights);
          setLoadingPhase('complete');
          setIsLoadingInsights(false);
          setIsLoadingFromCache(false);
          
          // Update cache status
          const status = await CacheService.getCacheStatus(user.id);
          setCacheStatus(status);
          
          return;
        }
      }
      
      setIsLoadingFromCache(false);
      
      // Preserve current expansion state
      const currentExpansionState = insights.map(insight => insight.expanded);
      
      // Phase 1: Load basic insights immediately
      setLoadingPhase('basic');
      const basicInsights = await insightService.generateBasicInsights(user.id);
      setInsights(basicInsights);
      
      // Phase 2: Load detailed insights progressively
      setLoadingPhase('detailed');
      const detailedInsights = await insightService.generateInsights(user.id, selectedPeriod);
      
      // Restore expansion state
      const insightsWithExpansion = detailedInsights.map((insight, index) => ({
        ...insight,
        expanded: currentExpansionState[index] || false
      }));
      
      setInsights(insightsWithExpansion);
      
      // Cache the results
      await CacheService.cacheInsights(user.id, insightsWithExpansion, {});
      
      setLoadingPhase('complete');
      
      // Update cache status
      const status = await CacheService.getCacheStatus(user.id);
      setCacheStatus(status);
      
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          setInsightError('Loading took too long. Please check your connection and try again.');
        } else if (error.message.includes('Service timeout')) {
          setInsightError('Some services are taking too long to respond. Please try again.');
        } else {
          setInsightError('Failed to load insights. Please try again.');
        }
      } else {
        setInsightError('Failed to load insights. Please try again.');
      }
    } finally {
      setIsLoadingInsights(false);
      setIsLoadingFromCache(false);
    }
  };

  const refreshInsights = async () => {
    // Clear cache first
    if (user) {
      await CacheService.clearCache(user.id);
    }
    await loadInsights(true);
  };

  const toggleInsightExpansion = useCallback((insightIndex: number) => {
    setInsights(prev => prev.map((insight, index) => 
      index === insightIndex 
        ? { ...insight, expanded: !insight.expanded }
        : insight
    ));
  }, []);

  // Reusable error handler
  const handleAsyncOperation = useCallback(async <T,>(
    operation: () => Promise<T>, 
    fallback: T
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      return fallback;
    }
  }, []);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !user) return;

    const userMessage: Message = {
      id: generateMessageId(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message to conversation cache
    await ConversationCacheService.addMessage(user.id, {
      id: userMessage.id,
      text: textToSend,
      isUser: true,
      timestamp: Date.now()
    });

    addMessages([userMessage]);
    if (!messageText) {
      setInputText('');
    }
    setIsTyping(true);

    try {
      // Get conversation context for AI
      const conversationContext = await ConversationCacheService.getConversationContext(user.id);
      
      const aiResponse = await handleAsyncOperation(
        () => aiService.generateResponse(user.id, textToSend, conversationContext),
        { response: "I'm having trouble analyzing your data right now. Please try again in a moment! 🤖" }
      );
      
      const aiMessage: Message = {
        id: generateMessageId(),
        text: aiResponse.response,
        isUser: false,
        timestamp: new Date(),
      };

      // Add AI message to conversation cache
      await ConversationCacheService.addMessage(user.id, {
        id: aiMessage.id,
        text: aiResponse.response,
        isUser: false,
        timestamp: Date.now()
      });
      
      addMessages([aiMessage]);
      
      // Update suggestions if AI response suggests new questions
      if (aiResponse.suggestions && Array.isArray(aiResponse.suggestions) && aiResponse.suggestions.length > 0) {
        setSuggestions(prev => [...prev.slice(0, 2), ...(aiResponse.suggestions || []).slice(0, 2)]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: generateMessageId(),
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      addMessages([errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, []);

  // Initialize chat with simple greeting
  const initializeChat = useCallback(() => {
    if (user && messages.length === 0) {
      const welcomeMessage: Message = {
        id: `welcome_${Date.now()}`,
        text: "Hello! I'm Neutro, your AI assistant. What can I do for you?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

  // Animate typing dots
  const animateTypingDots = useCallback(() => {
    const animationSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    Animated.loop(animationSequence).start();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  // Start/stop typing animation
  useEffect(() => {
    if (isTyping) {
      animateTypingDots();
    } else {
      // Reset dots to initial state
      dot1Opacity.setValue(0.3);
      dot2Opacity.setValue(0.3);
      dot3Opacity.setValue(0.3);
    }
  }, [isTyping, animateTypingDots, dot1Opacity, dot2Opacity, dot3Opacity]);

  // Memoized style calculations
  const getMessageBubbleStyle = useMemo(() => (isUser: boolean) => [
    styles.messageBubble,
    isUser ? styles.userBubble : styles.aiBubble,
    { 
      backgroundColor: isUser ? primary : cardBackground,
      borderColor: isUser ? 'transparent' : borderSecondary
    }
  ], [primary, cardBackground, borderSecondary]);

  // Memoized style calculations
  const getMessageTextStyle = useMemo(() => (isUser: boolean) => [
    styles.messageText,
    { color: isUser ? '#ffffff' : textPrimary }
  ], [textPrimary]);

  const getTimestampStyle = useMemo(() => (isUser: boolean) => [
    styles.timestamp,
    { color: isUser ? 'rgba(255,255,255,0.7)' : textSecondary }
  ], [textSecondary]);

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container}>
        {/* Collapsible Header */}
        <View style={[styles.header, { borderBottomColor: borderSecondary }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.headerContent}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: textPrimary }]}>Insights</Text>
                  <Ionicons 
                    name={isHeaderExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={textSecondary} 
                    style={styles.expandIcon}
                  />
                </View>
                <Text style={[styles.subtitle, { color: textSecondary }]}>
                  Neutro AI Assistant Beta V1.0
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Expandable Content */}
          {isHeaderExpanded && (
            <View style={[styles.expandedContent, { borderTopColor: borderSecondary }]}>
            {/* Dropdown Header */}
            <View style={styles.dropdownHeader}>
              <TouchableOpacity 
                style={styles.dropdownHeaderButton}
                onPress={() => setActiveModal('progress')}
                activeOpacity={0.7}
              >
                <Ionicons name="analytics" size={20} color={primary} />
                <Text style={[styles.dropdownHeaderText, { color: textPrimary }]}>
                  View Progress Charts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownHeaderButton}
                onPress={() => setActiveModal('requirements')}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle" size={20} color={textSecondary} />
                <Text style={[styles.dropdownHeaderText, { color: textSecondary }]}>
                  Data Requirements
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.refreshIconButton}
                onPress={refreshInsights}
                activeOpacity={0.7}
                disabled={isLoadingInsights}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={isLoadingInsights ? textSecondary : primary} 
                />
              </TouchableOpacity>
            </View>

            {/* Cache Status Indicator */}
            {cacheStatus && (
              <View style={styles.cacheStatusContainer}>
                <Ionicons 
                  name={cacheStatus.isValid ? "checkmark-circle" : "time"} 
                  size={16} 
                  color={cacheStatus.isValid ? "#10B981" : textSecondary} 
                />
                <Text style={[styles.cacheStatusText, { color: textSecondary }]}>
                  {cacheStatus.isValid 
                    ? `Cached (expires in ${Math.round((cacheStatus.expiresIn || 0) / (1000 * 60 * 60))}h)`
                    : 'No cache'
                  }
                </Text>
              </View>
            )}
            {isLoadingInsights ? (
              <View style={styles.loadingContainer}>
                {isLoadingFromCache ? (
                  <>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={[styles.loadingText, { color: textSecondary }]}>
                      Loading cached insights...
                    </Text>
                  </>
                ) : loadingPhase === 'initial' ? (
                  <>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={[styles.loadingText, { color: textSecondary }]}>
                      Checking for cached data...
                    </Text>
                  </>
                ) : loadingPhase === 'basic' ? (
                  <>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={[styles.loadingText, { color: textSecondary }]}>
                      Loading basic insights...
                    </Text>
                    <InsightSkeleton type="card" />
                  </>
                ) : loadingPhase === 'detailed' ? (
                  <>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={[styles.loadingText, { color: textSecondary }]}>
                      Analyzing detailed patterns...
                    </Text>
                    <InsightSkeleton type="list" />
                  </>
                ) : (
                  <>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={[styles.loadingText, { color: textSecondary }]}>
                      Analyzing your wellness data...
                    </Text>
                  </>
                )}
              </View>
            ) : insightError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
                <Text style={[styles.errorText, { color: textSecondary }]}>
                  {insightError}
                </Text>
                                  <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: primary }]}
                    onPress={refreshInsights}
                  >
                  <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : insights.length > 0 ? (
              <ScrollView 
                style={[
                  styles.insightsScrollView,
                  insights.some(insight => insight.expanded) && styles.insightsScrollViewExpanded
                ]}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {insights.map((insight, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.insightCard}
                  onPress={() => insight.expandable && toggleInsightExpansion(index)}
                  activeOpacity={insight.expandable ? 0.7 : 1}
                >
                  <View style={styles.insightHeader}>
                    <Ionicons name={insight.icon as any} size={20} color={primary} />
                                          <Text style={[styles.insightTitle, { color: textPrimary }]}>
                      {insight.title || 'Insight'}
                    </Text>
                    {insight.expandable && (
                      <Ionicons 
                        name={insight.expanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={textSecondary}
                        style={styles.insightExpandIcon}
                      />
                    )}
                  </View>
                  {insight.expanded && (
                                          <Text style={[styles.insightText, { color: textSecondary }]}>
                      {insight.description || 'No description available'}
                    </Text>
                  )}
                  
                  {/* Expanded content */}
                  {insight.expanded && insight.data && (
                    <View style={styles.expandedData}>
                      {insight.type === 'streak' && (
                        <StreakInsight 
                          data={insight.data} 
                          textPrimary={textPrimary} 
                          textSecondary={textSecondary} 
                          primary={primary}
                          selectedPeriod={selectedPeriod}
                          onPeriodChange={setSelectedPeriod}
                        />
                      )}
                      
                      {insight.type === 'pattern' && (
                        <PatternInsight 
                          data={insight.data} 
                          textPrimary={textPrimary} 
                          textSecondary={textSecondary} 
                          primary={primary} 
                          insights={insights}
                          setInsights={setInsights}
                          index={index}
                        />
                      )}
                       
                      {insight.type === 'recommendation' && (
                        <RecommendationInsight 
                          data={insight.data} 
                          textSecondary={textSecondary} 
                        />
                      )}
                       
                                             {insight.type === 'correlation' && (
                        <CorrelationInsight 
                          data={insight.data} 
                          textPrimary={textPrimary} 
                          textSecondary={textSecondary} 
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="analytics" size={32} color={textSecondary} />
                <Text style={[styles.emptyText, { color: textSecondary }]}>
                  Complete some habits to see personalized insights!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Messages - Only show when header is not expanded */}
        {!isHeaderExpanded && (
          <KeyboardAvoidingView 
            style={styles.content} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 0}
          >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              {!message.isUser && (
                <View style={[styles.avatar, { backgroundColor: primary }]}>
                  <Ionicons name="hardware-chip" size={16} color="#ffffff" />
                </View>
              )}
              <View style={getMessageBubbleStyle(message.isUser)}>
                <Text style={getMessageTextStyle(message.isUser)}>
                  {message.text}
                </Text>
                <Text style={getTimestampStyle(message.isUser)}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          
          
          {isTyping && (
            <View style={styles.messageContainer}>
                            <View style={[styles.avatar, { backgroundColor: primary }]}>
                <Ionicons name="hardware-chip" size={16} color="#ffffff" />
              </View>
              <View style={getMessageBubbleStyle(false)}>
                <View style={styles.typingIndicator}>
                  <Text style={[styles.typingText, { color: textSecondary }]}>
                    Neutro is typing
                  </Text>
                  <View style={styles.typingDots}>
                    <Animated.View style={[styles.dot, { backgroundColor: textSecondary, opacity: dot1Opacity }]} />
                    <Animated.View style={[styles.dot, { backgroundColor: textSecondary, opacity: dot2Opacity }]} />
                    <Animated.View style={[styles.dot, { backgroundColor: textSecondary, opacity: dot3Opacity }]} />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Buttons - Above Input */}
        {messages.length === 1 && !isTyping && (
          <View style={styles.suggestionsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScrollContent}
            >
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionButton, { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: borderSecondary 
                  }]}
                  onPress={() => handleSuggestionClick(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionText, { color: textPrimary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: borderSecondary }]}>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[
                styles.textInput,
                { 
                  color: '#ffffff',
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Neutro anything..."
              placeholderTextColor={textSecondary}
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              onFocus={() => setIsHeaderExpanded(false)}
              autoCorrect={true}
              autoCapitalize="sentences"
              textContentType="none"
              autoComplete="off"
              spellCheck={true}
            />
            
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: 'rgba(128, 128, 128, 0.1)',
              },
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? primary : textSecondary} 
            />
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>
        )}

      {/* Progress Chart Modal */}
      <Modal visible={activeModal === 'progress'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: cardBackground, 
            padding: 0,
            width: '90%',
            maxWidth: 400,
            height: 600,
            maxHeight: '80%',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderSecondary
          }]}> 
            <ProgressChart onClose={() => setActiveModal(null)} />
          </View>
        </View>
      </Modal>

        </View>

      {/* Data Requirements Modal */}
      <Modal visible={activeModal === 'requirements'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: cardBackground, 
            padding: 24,
            width: '90%',
            maxWidth: 400,
            maxHeight: '80%',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderSecondary
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Data Requirements
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setActiveModal(null)}
              >
                <Ionicons name="close" size={24} color={textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.requirementSection}>
                <Text style={[styles.requirementTitle, { color: textPrimary }]}>
                  Weekly Patterns
                </Text>
                <Text style={[styles.requirementDescription, { color: textSecondary }]}>
                  Complete at least 7 days of habits to discover your weekly patterns and consistency trends.
                </Text>
                <View style={styles.requirementList}>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • At least 7 days of habit data
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Multiple habit types completed
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Consistent tracking
                  </Text>
                </View>
              </View>

              <View style={styles.requirementSection}>
                <Text style={[styles.requirementTitle, { color: textPrimary }]}>
                  Habit Correlations
                </Text>
                <Text style={[styles.requirementDescription, { color: textSecondary }]}>
                  Complete at least 5 days of habits with mood and energy ratings to discover how your habits affect each other.
                </Text>
                <View style={styles.requirementList}>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Sleep data (quality or hours)
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Mood ratings (1-5 scale)
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Energy ratings (1-5 scale)
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • At least 5 days of data
                  </Text>
                </View>
              </View>

              <View style={styles.requirementSection}>
                <Text style={[styles.requirementTitle, { color: textPrimary }]}>
                  Progress Charts
                </Text>
                <Text style={[styles.requirementDescription, { color: textSecondary }]}>
                  View detailed progress charts for all your habits over time.
                </Text>
                <View style={styles.requirementList}>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Any completed habit data
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Historical tracking
                  </Text>
                  <Text style={[styles.requirementItem, { color: textSecondary }]}>
                    • Trend analysis
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    alignItems: 'center',
    position: 'relative',
  },
  headerButton: {
    alignItems: 'center',
    width: '100%',
  },

  headerContent: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expandIcon: {
    marginLeft: 8,
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
  insightsScrollView: {
    maxHeight: 400,
  },
  insightsScrollViewExpanded: {
    maxHeight: '100%',
    flex: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    gap: 8,
  },
  dropdownHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  refreshIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 32,
    height: 32,
  },
  dropdownHeaderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cacheStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  cacheStatusText: {
    fontSize: 12,
    opacity: 0.8,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  insightExpandIcon: {
    marginLeft: 'auto',
  },
  expandedData: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  errorText: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    height: 600,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },


  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  userBubble: {
    borderColor: 'transparent',
  },
  aiBubble: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 12,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#ffffff',
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  requirementSection: {
    marginBottom: 24,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  requirementList: {
    gap: 6,
  },
  requirementItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionsContainer: {
    paddingVertical: 8,
  },
  suggestionsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 120,
  },
  suggestionText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
}); 