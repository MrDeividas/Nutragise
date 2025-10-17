import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';
import { dmService } from '../lib/dmService';
import { supabase } from '../lib/supabase';
import { Message } from '../types/database';
import CustomBackground from '../components/CustomBackground';

export default function ChatWindowScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, otherUserId } = route.params as { chatId: string; otherUserId: string };
  const { user } = useAuthStore();
  const { theme } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTypingUpdateRef = useRef<number>(0);

  // Load other user profile
  useEffect(() => {
    const loadOtherUser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      
      setOtherUser(data);
    };
    loadOtherUser();
  }, [otherUserId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    const chatMessages = await dmService.getChatMessages(chatId);
    setMessages(chatMessages);
    setLoading(false);
    
    // Mark as read
    if (user) {
      await dmService.markMessagesAsRead(chatId, user.id);
    }
  }, [chatId, user]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to new messages (separate from loadMessages to avoid re-subscription)
  useEffect(() => {
    if (!user) return;
    
    const messageSubscription = dmService.subscribeToMessages(chatId, (newMessage) => {
      // Prevent duplicates - check if message already exists
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      
      if (newMessage.sender_id !== user.id) {
        dmService.markMessagesAsRead(chatId, user.id);
      }
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Monitor subscription status
    const statusInterval = setInterval(() => {
      const status = messageSubscription.state;
      setIsConnected(status === 'joined');
    }, 2000);

    const typingSubscription = dmService.subscribeToTyping(chatId, (typingData) => {
      if (typingData.user_id !== user.id) {
        setIsTyping(typingData.is_typing);
      }
    });

    return () => {
      clearInterval(statusInterval);
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [chatId, user]);

  // Scroll to bottom when keyboard shows
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Handle typing indicator with throttling (max 1 update per second)
  const handleTyping = (text: string) => {
    setInputText(text);
    
    if (!user) return;
    
    // If input is empty, clear typing indicator immediately
    if (!text.trim()) {
      dmService.setTypingIndicator(chatId, user.id, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastTypingUpdateRef.current;
    
    // Throttle: only update typing status once per second
    if (timeSinceLastUpdate < 1000) {
      // Still clear and reset the timeout to keep typing active
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        dmService.setTypingIndicator(chatId, user.id, false);
      }, 2000);
      return;
    }

    // Update typing indicator
    lastTypingUpdateRef.current = now;
    dmService.setTypingIndicator(chatId, user.id, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      dmService.setTypingIndicator(chatId, user.id, false);
    }, 2000);
  };

  // Send message with optimistic UI
  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const content = inputText.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Clear typing indicator FIRST (before clearing input)
    dmService.setTypingIndicator(chatId, user.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    lastTypingUpdateRef.current = 0; // Reset throttle
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Show message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setInputText('');
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Send to server
    try {
      const result = await dmService.sendMessage(chatId, user.id, content);
      
      if (result) {
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempId ? result : m));
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showAvatar = !isOwnMessage && (
      index === 0 || messages[index - 1].sender_id !== item.sender_id
    );

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {showAvatar && !isOwnMessage && (
          <Image
            source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/32' }}
            style={styles.messageAvatar}
          />
        )}
        {!showAvatar && !isOwnMessage && <View style={styles.avatarPlaceholder} />}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isOwnMessage && item.is_read && (
              <Ionicons name="checkmark-done" size={14} color="#14b8a6" />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading || !otherUser) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerUser}
            onPress={() => navigation.navigate('UserProfile' as never, { userId: otherUserId } as never)}
          >
            <Image
              source={{ uri: otherUser.avatar_url || 'https://via.placeholder.com/36' }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>
                {otherUser.display_name || otherUser.username}
              </Text>
              {isTyping && (
                <Text style={styles.typingText}>typing...</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        {!isConnected && (
          <View style={{ backgroundColor: '#FFA500', padding: 8, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>Connecting to real-time...</Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Start your conversation with {otherUser.display_name || otherUser.username}
              </Text>
            </View>
          }
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={[
            styles.inputContainer, 
            { 
              borderTopColor: theme.border,
              marginBottom: Platform.OS === 'android' ? 10 : 0 
            }
          ]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="Message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={handleTyping}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled
              ]}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#14b8a6' : theme.textSecondary} 
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  typingText: {
    fontSize: 12,
    color: '#14b8a6',
    fontStyle: 'italic',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#14b8a6',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#ffffff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: 'rgba(255,255,255,0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

