import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';
import { dmService } from '../lib/dmService';
import { socialService } from '../lib/socialService';
import { ChatWithProfile } from '../types/database';
import CustomBackground from '../components/CustomBackground';

const DARK = '#1f2937';

type MessageFilter = 'all' | 'following' | 'others';

const FILTER_TABS: {
  key: MessageFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'all', label: 'All', icon: 'chatbubbles' },
  { key: 'following', label: 'Following', icon: 'people' },
  { key: 'others', label: 'Others', icon: 'person' },
];

export default function DMScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  
  const [chats, setChats] = useState<ChatWithProfile[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [tabTrackWidth, setTabTrackWidth] = useState(0);
  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const tabHasPositioned = useRef(false);
  
  // Use ref to avoid subscription recreation on filter change
  const filterRef = useRef(filter);
  filterRef.current = filter;
  
  // Debounce ref for search
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Track if chats have been loaded initially
  const chatsLoadedRef = useRef(false);

  const tabIndex = Math.max(0, FILTER_TABS.findIndex((t) => t.key === filter));
  const tabWidth = tabTrackWidth > 0 ? tabTrackWidth / FILTER_TABS.length : 0;

  useEffect(() => {
    if (tabWidth <= 0) return;
    const toValue = tabIndex * tabWidth;
    if (!tabHasPositioned.current) {
      tabHasPositioned.current = true;
      tabIndicatorX.setValue(toValue);
      return;
    }
    Animated.spring(tabIndicatorX, {
      toValue,
      useNativeDriver: true,
      stiffness: 230,
      damping: 24,
      mass: 0.9,
    }).start();
  }, [tabIndex, tabWidth, tabIndicatorX]);

  // Load chats - only loads once on mount
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const userChats = await dmService.getUserChats(user.id);
      setChats(userChats || []);
      applyFilter(userChats || [], filterRef.current);
      chatsLoadedRef.current = true;
    } catch (error) {
      console.error('❌ Error loading chats:', error);
      setChats([]);
      setFilteredChats([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh chats silently (from subscription or pull-to-refresh)
  const refreshChats = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Refreshing chats silently...');
      const userChats = await dmService.getUserChats(user.id);
      setChats(userChats || []);
      applyFilter(userChats || [], filterRef.current);
    } catch (error) {
      console.error('❌ Error refreshing chats:', error);
    }
  }, [user]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshChats();
    setRefreshing(false);
  }, [refreshChats]);

  // Apply filter
  const applyFilter = (chatList: ChatWithProfile[], filterType: typeof filter) => {
    if (filterType === 'all') {
      setFilteredChats(chatList);
    } else if (filterType === 'following') {
      setFilteredChats(chatList.filter(chat => chat.is_following));
    } else {
      setFilteredChats(chatList.filter(chat => !chat.is_following));
    }
  };

  // Search users with debouncing (300ms delay)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce the actual search
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await socialService.searchUsers(query);
        setSearchResults(results?.filter(u => u.id !== user?.id) || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      }
    }, 300);
  };

  // Start new chat
  const startChat = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      const chatId = await dmService.getOrCreateChat(user.id, otherUserId);
      if (chatId) {
        navigation.navigate('ChatWindow' as never, { chatId, otherUserId } as never);
        setShowSearch(false);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Subscribe to chat updates (stable - won't recreate on filter change)
  useEffect(() => {
    if (!user) return;

    try {
      // Use refreshChats for subscription updates (silent refresh)
      const subscription = dmService.subscribeToChats(user.id, refreshChats);
      
      return () => {
        try {
          if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
        } catch (error) {
          console.error('Error unsubscribing from chats:', error);
        }
      };
    } catch (error) {
      console.error('Error subscribing to chats:', error);
    }
  }, [user, refreshChats]);

  // Re-apply filter when filter changes
  useEffect(() => {
    applyFilter(chats, filter);
  }, [filter, chats]);

  // Load chats only on initial mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Only refresh when coming back to screen if already loaded
  useFocusEffect(
    useCallback(() => {
      // Skip initial load (handled by useEffect above)
      if (!chatsLoadedRef.current) return;
      
      // Silent refresh when returning to screen
      refreshChats();
    }, [refreshChats])
  );

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderChatItem = ({ item }: { item: ChatWithProfile }) => {
    // Add null safety check
    if (!item || !item.other_user) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatWindow' as never, { 
          chatId: item.id, 
          otherUserId: item.other_user?.id 
        } as never)}
        activeOpacity={0.88}
      >
        <Image
          source={{ uri: item.other_user?.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.username, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.other_user?.display_name || item.other_user?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <View style={styles.messagePreview}>
            <Text 
              style={[
                styles.lastMessage, 
                { color: theme.textSecondary },
                item.unread_count > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.last_message_preview || 'No messages yet'}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => startChat(item.id)}
      activeOpacity={0.88}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View>
        <Text style={[styles.username, { color: theme.textPrimary }]}>
          {item.display_name || item.username}
        </Text>
        <Text style={[styles.usernameSecondary, { color: theme.textSecondary }]}>
          @{item.username}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Messages</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={{ width: 40, alignItems: 'flex-end' }}>
            <Ionicons name="add" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search users..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
        )}

        {/* Filter tabs — same pill style as Rewards (Raffles / Store / Inventory) */}
        {!showSearch && (
          <View
            style={styles.tabBar}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width - 8;
              if (w > 0 && Math.abs(w - tabTrackWidth) > 0.5) {
                setTabTrackWidth(w);
              }
            }}
          >
            {tabWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.tabIndicator,
                  {
                    width: tabWidth,
                    transform: [{ translateX: tabIndicatorX }],
                  },
                ]}
              />
            )}
            {FILTER_TABS.map((t) => {
              const active = filter === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tab}
                  onPress={() => {
                    setFilter(t.key);
                    applyFilter(chats, t.key);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={t.icon} size={16} color={active ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Content */}
        {loading ? (
          <ActivityIndicator size="large" color={"#1f2937"} style={styles.loader} />
        ) : showSearch && searchQuery.length >= 2 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatListContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No users found
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No messages yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                  Tap the + button to start a conversation
                </Text>
              </View>
            }
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: DARK,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  tabLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1f2937',
  },
  unreadBadge: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  usernameSecondary: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});

