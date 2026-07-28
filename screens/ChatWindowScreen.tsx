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
  Keyboard,
  RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';
import { dmService } from '../lib/dmService';
import { supabase } from '../lib/supabase';
import { Message } from '../types/database';
import CustomBackground from '../components/CustomBackground';

const PAGE_SIZE = 15;

export default function ChatWindowScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, otherUserId } = route.params as { chatId: string; otherUserId: string };
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTypingUpdateRef = useRef<number>(0);
  const initialScrollDoneRef = useRef(false);
  const loadingOlderRef = useRef(false);

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

  // Load latest messages only
  const loadMessages = useCallback(async () => {
    initialScrollDoneRef.current = false;
    const chatMessages = await dmService.getChatMessages(chatId, PAGE_SIZE);
    setMessages(chatMessages);
    setHasMore(chatMessages.length >= PAGE_SIZE);
    setLoading(false);

    if (user) {
      await dmService.markMessagesAsRead(chatId, user.id);
    }
  }, [chatId, user]);

  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingOlderRef.current || messages.length === 0) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const older = await dmService.getOlderChatMessages(
        chatId,
        oldest.created_at,
        PAGE_SIZE
      );
      setHasMore(older.length >= PAGE_SIZE);
      if (older.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = older.filter((m) => !existingIds.has(m.id));
          return [...unique, ...prev];
        });
      }
    } finally {
      setLoadingOlder(false);
      // Keep flag briefly so onContentSizeChange doesn't jump to bottom
      setTimeout(() => {
        loadingOlderRef.current = false;
      }, 250);
    }
  }, [chatId, hasMore, messages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!user) return;

    const messageSubscription = dmService.subscribeToMessages(chatId, (newMessage) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id);
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

    const typingSubscription = dmService.subscribeToTyping(chatId, (typingData) => {
      if (typingData.user_id !== user.id) {
        setIsTyping(typingData.is_typing);
      }
    });

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [chatId, user]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleTyping = (text: string) => {
    setInputText(text);

    if (!user) return;

    if (!text.trim()) {
      dmService.setTypingIndicator(chatId, user.id, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastTypingUpdateRef.current;

    if (timeSinceLastUpdate < 1000) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        dmService.setTypingIndicator(chatId, user.id, false);
      }, 2000);
      return;
    }

    lastTypingUpdateRef.current = now;
    dmService.setTypingIndicator(chatId, user.id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      dmService.setTypingIndicator(chatId, user.id, false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const content = inputText.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    dmService.setTypingIndicator(chatId, user.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    lastTypingUpdateRef.current = 0;

    const optimisticMessage: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const result = await dmService.sendMessage(chatId, user.id, content);

      if (result) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? result : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showAvatar =
      !isOwnMessage && (index === 0 || messages[index - 1].sender_id !== item.sender_id);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {showAvatar && !isOwnMessage && (
          <Image
            source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/32' }}
            style={styles.messageAvatar}
          />
        )}
        {!showAvatar && !isOwnMessage && <View style={styles.avatarPlaceholder} />}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerUser}
            onPress={() => (navigation as any).navigate('UserProfile', { userId: otherUserId })}
          >
            <Image
              source={{ uri: otherUser.avatar_url || 'https://via.placeholder.com/36' }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>
                {otherUser.display_name || otherUser.username}
              </Text>
              {isTyping && <Text style={styles.typingText}>typing...</Text>}
            </View>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            onContentSizeChange={() => {
              // Only auto-scroll to bottom on first paint — not when loading older history
              if (
                !initialScrollDoneRef.current &&
                !loadingOlderRef.current &&
                messages.length > 0
              ) {
                flatListRef.current?.scrollToEnd({ animated: false });
                initialScrollDoneRef.current = true;
              }
            }}
            refreshControl={
              <RefreshControl
                refreshing={loadingOlder}
                onRefresh={loadOlderMessages}
                tintColor={theme.primary}
                colors={[theme.primary]}
                enabled={hasMore}
              />
            }
            ListHeaderComponent={
              hasMore ? (
                <Text style={[styles.loadOlderHint, { color: theme.textTertiary }]}>
                  Pull down for earlier messages
                </Text>
              ) : messages.length > 0 ? (
                <Text style={[styles.loadOlderHint, { color: theme.textTertiary }]}>
                  Beginning of conversation
                </Text>
              ) : null
            }
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Start your conversation with {otherUser.display_name || otherUser.username}
                </Text>
              </View>
            }
          />

          <View
            style={[
              styles.inputContainer,
              {
                borderTopColor: theme.border,
                paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 8),
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: '#1f2937' }]}
              placeholder="Message..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={handleTyping}
              multiline
              maxLength={500}
              autoCapitalize="sentences"
              autoCorrect={true}
              autoComplete="off"
              textContentType="none"
              keyboardType="default"
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  typingText: {
    fontSize: 12,
    color: '#14b8a6',
    fontStyle: 'italic',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
    flexGrow: 1,
  },
  loadOlderHint: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 8,
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
    borderRadius: 8,
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
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'left',
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#0F172A',
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
    color: 'rgba(255,255,255,0.8)',
  },
  otherMessageTime: {
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    marginRight: 8,
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
