import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator
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

export default function DMScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  
  const [chats, setChats] = useState<ChatWithProfile[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'following' | 'others'>('all');
  
  // Use ref to avoid subscription recreation on filter change
  const filterRef = useRef(filter);
  filterRef.current = filter;
  
  // Debounce ref for search
  const searchDebounceRef = useRef<NodeJS.Timeout>();

  // Load chats - stable callback without filter dependency
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const userChats = await dmService.getUserChats(user.id);
    setChats(userChats);
    applyFilter(userChats, filterRef.current);
    setLoading(false);
  }, [user]);

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
      const results = await socialService.searchUsers(query);
      setSearchResults(results.filter(u => u.id !== user?.id));
    }, 300);
  };

  // Start new chat
  const startChat = async (otherUserId: string) => {
    if (!user) return;
    
    const chatId = await dmService.getOrCreateChat(user.id, otherUserId);
    if (chatId) {
      navigation.navigate('ChatWindow' as never, { chatId, otherUserId } as never);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  // Subscribe to chat updates (stable - won't recreate on filter change)
  useEffect(() => {
    if (!user) return;

    const subscription = dmService.subscribeToChats(user.id, loadChats);
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadChats]);

  // Re-apply filter when filter changes
  useEffect(() => {
    applyFilter(chats, filter);
  }, [filter, chats]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
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

  const renderChatItem = ({ item }: { item: ChatWithProfile }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: theme.border }]}
      onPress={() => navigation.navigate('ChatWindow' as never, { 
        chatId: item.id, 
        otherUserId: item.other_user.id 
      } as never)}
    >
      <Image
        source={{ uri: item.other_user.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.username, { color: theme.textPrimary }]}>
            {item.other_user.display_name || item.other_user.username}
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

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.searchItem, { borderBottomColor: theme.border }]}
      onPress={() => startChat(item.id)}
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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name="add" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
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

        {/* Filter Tabs */}
        {!showSearch && chats.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.activeFilter]}
              onPress={() => {
                setFilter('all');
                applyFilter(chats, 'all');
              }}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'following' && styles.activeFilter]}
              onPress={() => {
                setFilter('following');
                applyFilter(chats, 'following');
              }}
            >
              <Text style={[styles.filterText, filter === 'following' && styles.activeFilterText]}>
                Following
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'others' && styles.activeFilter]}
              onPress={() => {
                setFilter('others');
                applyFilter(chats, 'others');
              }}
            >
              <Text style={[styles.filterText, filter === 'others' && styles.activeFilterText]}>
                Others
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : showSearch && searchQuery.length >= 2 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No users found
              </Text>
            }
          />
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeFilter: {
    backgroundColor: '#14b8a6',
  },
  filterText: {
    fontSize: 14,
    color: '#ffffff',
  },
  activeFilterText: {
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#ff5a5f',
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
    padding: 16,
    borderBottomWidth: 1,
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

