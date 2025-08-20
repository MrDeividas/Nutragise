import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import CustomBackground from '../components/CustomBackground';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function InsightsScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI wellness assistant. I can help you understand your habits, track progress, and provide personalized insights. What would you like to know about your wellness journey?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response (this will be replaced with actual AI logic)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm analyzing your data to provide personalized insights. This feature is coming soon as part of Step 3c! 🤖✨",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container}>
        {/* Collapsible Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderSecondary }]}>
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
              AI-powered wellness analysis
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Expandable Content */}
        {isHeaderExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: theme.borderSecondary }]}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="trending-up" size={20} color={theme.primary} />
                <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>Today's Overview</Text>
              </View>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                You're on a 3-day streak with sleep habits! Keep it up by completing today's sleep log.
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb" size={20} color={theme.primary} />
                <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>Weekly Pattern</Text>
              </View>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                Your water intake peaks on Wednesdays. Consider setting reminders for other days.
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="trophy" size={20} color={theme.primary} />
                <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>Achievement</Text>
              </View>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                You've completed 15 out of 21 possible habits this week. Great consistency!
              </Text>
            </View>
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
                    AI is thinking
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

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: theme.borderSecondary }]}>
          <TextInput
            style={[
              styles.textInput,
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderSecondary,
                color: theme.textPrimary,
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
  headerButton: {
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
    paddingTop: 16,
    marginTop: 16,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
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
}); 