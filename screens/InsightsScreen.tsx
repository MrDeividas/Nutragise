import React, { useState, useRef, useEffect } from 'react';
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function InsightsScreen({ route }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { shouldOpenGraphs, setShouldOpenGraphs } = useActionStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDataRequirements, setShowDataRequirements] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What habits can I improve?",
    "Summarise my week",
    "How can I balance my habits better?",
    "Tell me about my sleep patterns"
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-open graphs if flag is set in action store
  useEffect(() => {
    if (shouldOpenGraphs) {
      setShowProgressModal(true);
      setShouldOpenGraphs(false); // Reset the flag
    }
  }, [shouldOpenGraphs, setShouldOpenGraphs]);

  const loadInsights = async () => {
    if (!user) return;
    
    setIsLoadingInsights(true);
    setInsightError(null);
    
    try {
      const userInsights = await insightService.generateInsights(user.id);
      setInsights(userInsights);
    } catch (error) {
      console.error('Failed to load insights:', error);
      setInsightError('Failed to load insights. Please try again.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const toggleInsightExpansion = (insightIndex: number) => {
    setInsights(prev => prev.map((insight, index) => 
      index === insightIndex 
        ? { ...insight, expanded: !insight.expanded }
        : insight
    ));
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) {
      setInputText('');
    }
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await aiService.generateResponse(user.id, textToSend);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.response,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble analyzing your data right now. Please try again in a moment! 🤖",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize AI with API key
    initializeAI();
    loadInsights();
  }, [user]);

  // Initialize chat with simple greeting
  useEffect(() => {
    const initializeChat = () => {
      if (user && messages.length === 0) {
        const welcomeMessage: Message = {
          id: '1',
          text: "Hello! I'm Neutro, your AI assistant. What can I do for you?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    };

    initializeChat();
  }, [user, messages.length]);

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container}>
        {/* Collapsible Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderSecondary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Insights</Text>
                <Ionicons 
                  name={isHeaderExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.textSecondary} 
                  style={styles.expandIcon}
                />
              </View>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Neutro AI Assistant Beta V1.0
              </Text>
            </View>
          </TouchableOpacity>
          

        </View>
        
        {/* Expandable Content */}
        {isHeaderExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: theme.borderSecondary }]}>
            {/* Dropdown Header */}
            <View style={styles.dropdownHeader}>
              <TouchableOpacity 
                style={styles.dropdownHeaderButton}
                onPress={() => setShowProgressModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="analytics" size={20} color={theme.primary} />
                <Text style={[styles.dropdownHeaderText, { color: theme.textPrimary }]}>
                  View Progress Charts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownHeaderButton}
                onPress={() => setShowDataRequirements(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle" size={20} color={theme.textSecondary} />
                <Text style={[styles.dropdownHeaderText, { color: theme.textSecondary }]}>
                  Data Requirements
                </Text>
              </TouchableOpacity>
            </View>
            {isLoadingInsights ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Analyzing your wellness data...
                </Text>
              </View>
            ) : insightError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color={theme.error || '#ff6b6b'} />
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                  {insightError}
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                  onPress={loadInsights}
                >
                  <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : insights.length > 0 ? (
              insights.map((insight, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.insightCard}
                  onPress={() => insight.expandable && toggleInsightExpansion(index)}
                  activeOpacity={insight.expandable ? 0.7 : 1}
                >
                  <View style={styles.insightHeader}>
                    <Ionicons name={insight.icon as any} size={20} color={theme.primary} />
                    <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>
                      {insight.title || 'Insight'}
                    </Text>
                    {insight.expandable && (
                      <Ionicons 
                        name={insight.expanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={theme.textSecondary}
                        style={styles.expandIcon}
                      />
                    )}
                  </View>
                  {insight.expanded && (
                    <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                      {insight.description || 'No description available'}
                    </Text>
                  )}
                  
                  {/* Expanded content */}
                  {insight.expanded && insight.data && (
                    <View style={styles.expandedData}>
                                             {insight.type === 'streak' && insight.data?.streaks && Array.isArray(insight.data.streaks) && (
                         <View style={styles.streakData}>
                           {insight.data.streaks.map((streak: any, streakIndex: number) => (
                             <View key={streakIndex} style={styles.streakItem}>
                               <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                                 {streak?.habit_type || 'Unknown'}:
                               </Text>
                               <Text style={[styles.streakValue, { color: theme.primary }]}>
                                 {streak?.current_streak || 0} days
                               </Text>
                             </View>
                           ))}
                         </View>
                       )}
                      
                                             {insight.type === 'pattern' && (
                         <View style={styles.patternData}>
                           {insight.data?.consistencyScore !== undefined && insight.data.consistencyScore > 0 ? (
                             <View>
                               {/* Weekly Consistency Section */}
                               <View style={styles.patternSection}>
                                 <View style={styles.patternHeader}>
                                   <Text style={[styles.patternLabel, { color: theme.textSecondary }]}>
                                     Weekly Consistency:
                                   </Text>
                                   <TouchableOpacity 
                                     style={styles.infoButton}
                                     onPress={() => {
                                       // Toggle the expanded state for this specific insight
                                       const updatedInsights = insights.map((ins, i) => 
                                         i === index ? { ...ins, showConsistencyInfo: !ins.showConsistencyInfo } : ins
                                       );
                                       setInsights(updatedInsights);
                                     }}
                                   >
                                     <Ionicons name="information-circle" size={16} color={theme.textSecondary} />
                                   </TouchableOpacity>
                                 </View>
                                 <Text style={[styles.patternValue, { color: theme.primary }]}>
                                   {insight.data.consistencyScore.toFixed(1)}%
                                 </Text>
                                 {insight.showConsistencyInfo && (
                                   <View>
                                     <Text style={[styles.patternDescription, { color: theme.textSecondary }]}>
                                       How evenly you complete habits across all days of the week
                                     </Text>
                                     <View style={styles.patternBreakdown}>
                                       <Text style={[styles.patternBreakdownTitle, { color: theme.textPrimary }]}>
                                         What this means:
                                       </Text>
                                       <Text style={[styles.patternBreakdownItem, { color: theme.textSecondary }]}>
                                         • Higher score = More consistent across all days
                                       </Text>
                                       <Text style={[styles.patternBreakdownItem, { color: theme.textSecondary }]}>
                                         • Lower score = Some days much better than others
                                       </Text>
                                       <Text style={[styles.patternBreakdownItem, { color: theme.textSecondary }]}>
                                         • Based on sleep, water, exercise, and reflection data
                                       </Text>
                                     </View>
                                   </View>
                                 )}
                               </View>

                               {/* Sleep Quality Pattern */}
                               {insight.data?.sleepPatterns?.peakDay && (
                                 <View style={styles.patternSection}>
                                   <Text style={[styles.patternLabel, { color: theme.textSecondary }]}>
                                     Sleep Quality Pattern:
                                   </Text>
                                   <Text style={[styles.patternValue, { color: theme.primary }]}>
                                     Best on {insight.data.sleepPatterns.peakDay.charAt(0).toUpperCase() + insight.data.sleepPatterns.peakDay.slice(1)}s
                                   </Text>
                                 </View>
                               )}

                               {/* Water Intake Pattern */}
                               {insight.data?.waterPatterns?.peakDay && (
                                 <View style={styles.patternSection}>
                                   <Text style={[styles.patternLabel, { color: theme.textSecondary }]}>
                                     Water Intake Pattern:
                                   </Text>
                                   <Text style={[styles.patternValue, { color: theme.primary }]}>
                                     Best on {insight.data.waterPatterns.peakDay.charAt(0).toUpperCase() + insight.data.waterPatterns.peakDay.slice(1)}s
                                   </Text>
                                 </View>
                               )}
                             </View>
                           ) : (
                             <View style={styles.patternNoData}>
                               <Ionicons name="calendar" size={24} color={theme.textSecondary} style={styles.patternNoDataIcon} />
                               <Text style={[styles.patternNoDataTitle, { color: theme.textPrimary }]}>
                                 Not Enough Data Yet
                               </Text>
                               <Text style={[styles.patternNoDataDescription, { color: theme.textSecondary }]}>
                                 Complete at least 7 days of habits to discover your weekly patterns and consistency trends.
                               </Text>
                               <View style={styles.patternNoDataRequirements}>
                                 <Text style={[styles.patternNoDataRequirementsTitle, { color: theme.textPrimary }]}>
                                   What you can discover:
                                 </Text>
                                 <View style={styles.patternNoDataRequirementsList}>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Your best days of the week
                                   </Text>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Consistency scores
                                   </Text>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Weekly trends
                                   </Text>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Peak performance days
                                   </Text>
                                 </View>
                               </View>
                               <View style={styles.patternNoDataRequirements}>
                                 <Text style={[styles.patternNoDataRequirementsTitle, { color: theme.textPrimary }]}>
                                   What you need:
                                 </Text>
                                 <View style={styles.patternNoDataRequirementsList}>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • At least 7 days of habit data
                                   </Text>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Multiple habit types completed
                                   </Text>
                                   <Text style={[styles.patternNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Consistent tracking
                                   </Text>
                                 </View>
                               </View>
                             </View>
                           )}
                         </View>
                       )}
                       
                       {insight.type === 'recommendation' && insight.data?.recommendations && Array.isArray(insight.data.recommendations) && (
                         <View style={styles.recommendationData}>
                           {insight.data.recommendations.slice(1).map((rec: string, recIndex: number) => (
                             <Text key={recIndex} style={[styles.recommendationItem, { color: theme.textSecondary }]}>
                               • {rec || 'No recommendation'}
                             </Text>
                           ))}
                         </View>
                       )}
                       
                       {insight.type === 'correlation' && (
                         <View style={styles.correlationData}>
                           {insight.data?.correlations && Array.isArray(insight.data.correlations) && insight.data.correlations.length > 0 ? (
                             insight.data.correlations.map((correlation: any, corrIndex: number) => (
                               <View key={corrIndex} style={styles.correlationItem}>
                                 <View style={styles.correlationHeader}>
                                   <View style={[
                                     styles.correlationStrength, 
                                     { backgroundColor: correlation.type === 'positive' ? '#10B981' : correlation.type === 'negative' ? '#EF4444' : '#6B7280' }
                                   ]}>
                                     <Text style={styles.correlationStrengthText}>
                                       {correlation.strength.toUpperCase()}
                                     </Text>
                                   </View>
                                   <Text style={[styles.correlationDescription, { color: theme.textPrimary }]}>
                                     {correlation.description}
                                   </Text>
                                 </View>
                                 <Text style={[styles.correlationRecommendation, { color: theme.textSecondary }]}>
                                   {correlation.recommendation}
                                 </Text>
                               </View>
                             ))
                           ) : (
                             <View style={styles.correlationNoData}>
                               <Ionicons name="link" size={24} color={theme.textSecondary} style={styles.correlationNoDataIcon} />
                               <Text style={[styles.correlationNoDataTitle, { color: theme.textPrimary }]}>
                                 Not Enough Data Yet
                               </Text>
                               <Text style={[styles.correlationNoDataDescription, { color: theme.textSecondary }]}>
                                 Complete at least 5 days of habits with mood and energy ratings to discover how your habits affect each other.
                               </Text>
                               <View style={styles.correlationNoDataRequirements}>
                                 <Text style={[styles.correlationNoDataRequirementsTitle, { color: theme.textPrimary }]}>
                                   What you need:
                                 </Text>
                                 <View style={styles.correlationNoDataRequirementsList}>
                                   <Text style={[styles.correlationNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Sleep data (quality or hours)
                                   </Text>
                                   <Text style={[styles.correlationNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Mood ratings (1-5 scale)
                                   </Text>
                                   <Text style={[styles.correlationNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • Energy ratings (1-5 scale)
                                   </Text>
                                   <Text style={[styles.correlationNoDataRequirementsItem, { color: theme.textSecondary }]}>
                                     • At least 5 days of data
                                   </Text>
                                 </View>
                               </View>
                             </View>
                           )}
                         </View>
                       )}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="analytics" size={32} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Complete some habits to see personalized insights!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Ionicons name="hardware-chip" size={16} color="#ffffff" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isUser
                    ? [styles.userBubble, { backgroundColor: theme.primary }]
                    : [styles.aiBubble, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: message.isUser ? '#ffffff' : theme.textPrimary },
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: message.isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                  ]}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          
          {isTyping && (
            <View style={styles.messageContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                 <Ionicons name="hardware-chip" size={16} color="#ffffff" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                <View style={styles.typingIndicator}>
                  <Text style={[styles.typingText, { color: theme.textSecondary }]}>
                    Neutro is typing
                  </Text>
                  <View style={styles.typingDots}>
                    <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
                    <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
                    <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
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
                    borderColor: theme.borderSecondary 
                  }]}
                  onPress={() => handleSuggestionClick(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionText, { color: theme.textPrimary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: theme.borderSecondary }]}>
          <TextInput
            style={[
              styles.textInput,
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderSecondary,
                color: '#ffffff',
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me about your wellness journey..."
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            onFocus={() => setIsHeaderExpanded(false)}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: inputText.trim() ? theme.primary : theme.borderSecondary,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#ffffff' : theme.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Progress Chart Modal */}
      <Modal visible={showProgressModal} transparent animationType="fade" onRequestClose={() => setShowProgressModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.cardBackground, 
            padding: 0,
            width: '90%',
            maxWidth: 400,
            height: 600,
            maxHeight: '80%',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.borderSecondary
          }]}> 
            <ProgressChart onClose={() => setShowProgressModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Data Requirements Modal */}
      <Modal visible={showDataRequirements} transparent animationType="fade" onRequestClose={() => setShowDataRequirements(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.cardBackground, 
            padding: 24,
            width: '90%',
            maxWidth: 400,
            maxHeight: '80%',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.borderSecondary
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Data Requirements
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDataRequirements(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.requirementSection}>
                <Text style={[styles.requirementTitle, { color: theme.textPrimary }]}>
                  Weekly Patterns
                </Text>
                <Text style={[styles.requirementDescription, { color: theme.textSecondary }]}>
                  Complete at least 7 days of habits to discover your weekly patterns and consistency trends.
                </Text>
                <View style={styles.requirementList}>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • At least 7 days of habit data
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Multiple habit types completed
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Consistent tracking
                  </Text>
                </View>
              </View>

              <View style={styles.requirementSection}>
                <Text style={[styles.requirementTitle, { color: theme.textPrimary }]}>
                  Habit Correlations
                </Text>
                <Text style={[styles.requirementDescription, { color: theme.textSecondary }]}>
                  Complete at least 5 days of habits with mood and energy ratings to discover how your habits affect each other.
                </Text>
                <View style={styles.requirementList}>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Sleep data (quality or hours)
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Mood ratings (1-5 scale)
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Energy ratings (1-5 scale)
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • At least 5 days of data
                  </Text>
                </View>
              </View>

              <View style={styles.requirementSection}>
                <Text style={[styles.requirementTitle, { color: theme.textPrimary }]}>
                  Progress Charts
                </Text>
                <Text style={[styles.requirementDescription, { color: theme.textSecondary }]}>
                  View detailed progress charts for all your habits over time.
                </Text>
                <View style={styles.requirementList}>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Any completed habit data
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
                    • Historical tracking
                  </Text>
                  <Text style={[styles.requirementItem, { color: theme.textSecondary }]}>
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
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    gap: 16,
  },
  dropdownHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownHeaderText: {
    fontSize: 14,
    fontWeight: '500',
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
  expandIcon: {
    marginLeft: 'auto',
  },
  expandedData: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakData: {
    gap: 8,
  },
  streakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternData: {
    gap: 16,
  },
  patternSection: {
    gap: 8,
  },
  patternLabel: {
    fontSize: 12,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 2,
  },
  patternValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternDescription: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  patternBreakdown: {
    marginTop: 12,
    gap: 6,
  },
  patternBreakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  patternBreakdownItem: {
    fontSize: 11,
    lineHeight: 14,
  },
  patternNoData: {
    alignItems: 'center',
    padding: 16,
  },
  patternNoDataIcon: {
    marginBottom: 12,
  },
  patternNoDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  patternNoDataDescription: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  patternNoDataRequirements: {
    width: '100%',
    marginBottom: 12,
  },
  patternNoDataRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  patternNoDataRequirementsList: {
    gap: 4,
  },
  patternNoDataRequirementsItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationData: {
    gap: 6,
  },
  recommendationItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  correlationData: {
    gap: 8,
  },
  correlationItem: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  correlationStrength: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  correlationStrengthText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  correlationDescription: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  correlationRecommendation: {
    fontSize: 11,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  correlationNoData: {
    alignItems: 'center',
    padding: 16,
  },
  correlationNoDataIcon: {
    marginBottom: 12,
  },
  correlationNoDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  correlationNoDataDescription: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  correlationNoDataRequirements: {
    width: '100%',
  },
  correlationNoDataRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  correlationNoDataRequirementsList: {
    gap: 4,
  },
  correlationNoDataRequirementsItem: {
    fontSize: 12,
    lineHeight: 16,
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
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
    textAlignVertical: 'top',
    opacity: 0.7,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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