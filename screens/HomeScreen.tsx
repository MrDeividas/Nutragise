import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { Goal } from '../types/database';
import { useTheme } from '../state/themeStore';
import { syncAllUserData } from '../lib/syncUserData';
import { useSocialStore } from '../state/socialStore';
import { Profile } from '../lib/socialService';
import { socialService } from '../lib/socialService';
import CustomBackground from '../components/CustomBackground';
import { LinearGradient } from 'expo-linear-gradient';
import GoalInteractionBar from '../components/GoalInteractionBar';
import CommentModal from '../components/CommentModal';
import { goalInteractionsService } from '../lib/goalInteractions';
import { formatLastUpdate } from '../lib/goalHelpers';

// Extended Goal type with user data
interface GoalWithUser extends Goal {
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  media_url?: string;
}

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'explore' | 'following'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreGoals, setExploreGoals] = useState<GoalWithUser[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<GoalWithUser[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [goalSearchResults, setGoalSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'top' | 'users' | 'goals'>('top');
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string>('');
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followingStatus, setFollowingStatus] = useState<Map<string, boolean>>(new Map());
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [youMayLikeUsers, setYouMayLikeUsers] = useState<Profile[]>([]);
  const [followerCounts, setFollowerCounts] = useState<Map<string, number>>(new Map());
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [goalInteractionData, setGoalInteractionData] = useState<{[goalId: string]: { likes: number; comments: number; isLiked: boolean }}>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedGoalForComment, setSelectedGoalForComment] = useState<{id: string, title: string} | null>(null);
  const [followingGoalsList, setFollowingGoalsList] = useState<GoalWithUser[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const { fetchSuggestedUsers, followUser, isLoading: socialLoading } = useSocialStore();

  // Categories data
  const categories = [
    { icon: '🎯', name: 'Default', color: '#6b7280' },
    { icon: '🏃‍♂️', name: 'Fitness', color: '#ef4444' },
    { icon: '💪', name: 'Gym', color: '#dc2626' },
    { icon: '🥗', name: 'Nutrition', color: '#10b981' },
    { icon: '🧠', name: 'Mental Health', color: '#8b7280' },
    { icon: '📚', name: 'Learning', color: '#f59e0b' },
    { icon: '💼', name: 'Career', color: '#3b82f6' },
    { icon: '❤️', name: 'Relationships', color: '#ec4899' },
    { icon: '💰', name: 'Finance', color: '#059669' },
    { icon: '🎨', name: 'Creativity', color: '#dc2626' },
  ];

  useEffect(() => {
    if (user) {
      loadExploreGoals();
      fetchSuggestedUsers(user.id);
      // Sync user data to ensure email is properly set
      syncAllUserData();
    }
  }, [user, selectedCategory]);

  // Load goals from people you're following when following tab is active
  useEffect(() => {
    if (activeTab === 'following' && user) {
      loadFollowingGoals();
    }
  }, [activeTab, user, selectedCategory]);

  // Load interaction data for goals
  const loadGoalInteractionData = async (goals: GoalWithUser[]) => {
    if (!user || !goals.length) return;

    try {
      const goalIds = goals.map(goal => goal.id);
      const [interactionCounts, likeStatuses] = await Promise.all([
        goalInteractionsService.getGoalsInteractionCounts(goalIds),
        Promise.all(goalIds.map(goalId => goalInteractionsService.isGoalLikedByUser(goalId)))
      ]);

      const newInteractionData: {[goalId: string]: { likes: number; comments: number; isLiked: boolean }} = {};
      
      goalIds.forEach((goalId, index) => {
        const commentCount = interactionCounts[goalId]?.comments || 0;
  
        newInteractionData[goalId] = {
          likes: interactionCounts[goalId]?.likes || 0,
          comments: commentCount,
          isLiked: likeStatuses[index] || false
        };
      });

      setGoalInteractionData(newInteractionData);
    } catch (error) {
      console.error('Error loading goal interaction data:', error);
    }
  };

  // Check follow status for users when they load
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || (!youMayLikeUsers.length && !searchResults.length)) return;

      const usersToCheck = searchQuery ? searchResults : youMayLikeUsers;
      const newFollowingStatus = new Map<string, boolean>();

      for (const profile of usersToCheck) {
        if (profile.id !== user.id) {
          try {
            const isFollowing = await socialService.isFollowing(user.id, profile.id);
            newFollowingStatus.set(profile.id, isFollowing);
          } catch (error) {
            newFollowingStatus.set(profile.id, false);
          }
        }
      }

      setFollowingStatus(newFollowingStatus);
    };

    checkFollowStatus();
  }, [user, youMayLikeUsers, searchResults, searchQuery]);

  // Fetch follower counts when users are loaded
  useEffect(() => {
    if (youMayLikeUsers.length > 0 && !searchQuery) {
      fetchFollowerCounts(youMayLikeUsers);
    }
  }, [youMayLikeUsers, searchQuery]);

  // Update filtered goals when explore goals change
  useEffect(() => {
    setFilteredGoals(exploreGoals);
  }, [exploreGoals]);



  const handleSearchInput = async (query: string) => {
    setSearchQuery(query);
    
    // Clear results if query is empty
    if (query.trim().length === 0) {
      setSearchResults([]);
      setGoalSearchResults([]);
      return;
    }

    // Perform live search with debouncing
    setIsSearching(true);
    setHasSearched(true);
    
    
    
    try {
      if (searchType === 'users') {
        const results = await useSocialStore.getState().searchUsers(query);
        setSearchResults(results);
        setGoalSearchResults([]);
        
        // Fetch follower counts for search results
        await fetchFollowerCounts(results);
      } else if (searchType === 'goals') {
        console.log('Calling searchGoals...');
        const results = await socialService.searchGoals(query);
        console.log('searchGoals returned:', results?.length || 0, 'results');
        setGoalSearchResults(results);
        setSearchResults([]);
      } else if (searchType === 'top') {
        // Search both users and goals
        const [userResults, goalResults] = await Promise.all([
          useSocialStore.getState().searchUsers(query),
          socialService.searchGoals(query)
        ]);
        
        console.log('Top search - Users:', userResults.length, 'Goals:', goalResults.length);
        setSearchResults(userResults);
        setGoalSearchResults(goalResults);
        
        // Fetch follower counts for user results
        await fetchFollowerCounts(userResults);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
      setGoalSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      setGoalSearchResults([]);
      return;
    }

    // Save search history when user explicitly searches
    if (query.trim().length > 0 && user) {
      const trimmedQuery = query.trim();
      
      // Check if this query already exists in search history
      const existingHistory = await socialService.getSearchHistory(user.id);
      const isDuplicate = existingHistory.some(historyQuery => 
        historyQuery.toLowerCase() === trimmedQuery.toLowerCase()
      );
      
      // Only save if it's not a duplicate
      if (!isDuplicate) {
        await socialService.saveSearchHistory(user.id, trimmedQuery);
        // Reload search history to show the new entry
        await loadSearchHistory();
      }
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user || followingUsers.has(userId)) return;
    
    const isCurrentlyFollowing = followingStatus.get(userId) || false;
    
    setFollowingUsers(prev => new Set(prev).add(userId));
    
    try {
      let success = false;
      if (isCurrentlyFollowing) {
        success = await useSocialStore.getState().unfollowUser(user.id, userId);
        if (success) {
          setFollowingStatus(prev => new Map(prev).set(userId, false));
        }
      } else {
        success = await followUser(user.id, userId);
        if (success) {
          setFollowingStatus(prev => new Map(prev).set(userId, true));
        }
      }
      
      if (success) {
        // Refresh suggested users
        fetchSuggestedUsers(user.id);
      }
    } catch (error) {
      // Error following/unfollowing user
    } finally {
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const fetchFollowerCounts = async (users: Profile[]) => {
    try {
      const counts = new Map<string, number>();
      for (const user of users) {
        const count = await socialService.getFollowerCount(user.id);
        counts.set(user.id, count);
      }
      setFollowerCounts(counts);
    } catch (error) {
      console.error('Error fetching follower counts:', error);
    }
  };

  const renderUser = ({ item }: { item: Profile }) => {
    const isFollowingUser = followingStatus.get(item.id) || false;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
        onPress={() => {
          // Navigate to user profile - you'll need to add this navigation
          // navigation.navigate('UserProfile', {
          //   userId: item.id,
          //   username: item.username,
          // });
        }}
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.profilePicture} />
          ) : (
            <View style={[styles.profilePicturePlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={[styles.profilePictureInitial, { color: 'white' }]}>
                {item.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
        
        {/* User Info Section */}
        <View style={styles.profileInfoSection}>
          <View style={styles.usernameRow}>
            <Text style={[styles.profileDisplayName, { color: theme.textPrimary }]}>
              @{item.username}
            </Text>
            {user && user.id !== item.id && (
              <TouchableOpacity
                onPress={() => handleFollow(item.id)}
                disabled={followingUsers.has(item.id)}
                style={[
                  styles.smallFollowButton, 
                  { 
                    backgroundColor: (followingStatus.get(item.id) || false) ? 'rgba(128, 128, 128, 0.3)' : theme.primary,
                    opacity: followingUsers.has(item.id) ? 0.7 : 1,
                  }
                ]}
              >
                {followingUsers.has(item.id) ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.smallFollowButtonText}>
                    {(followingStatus.get(item.id) || false) ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.profileLocation, { color: theme.textSecondary }]}>
            {item.bio || 'No bio'}
          </Text>
        </View>
        
        {/* Followers Section */}
        <View style={styles.profileFollowersSection}>
          <Text style={[styles.profileFollowers, { color: theme.textSecondary }]}>
            Followers
          </Text>
          <Text style={[styles.profileFollowersCount, { color: theme.textPrimary }]}>
            {followerCounts.get(item.id) || 0}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGoal = ({ item }: { item: any }) => {
    console.log('Rendering goal:', item.title, 'with profiles:', item.profiles);
    return (
      <TouchableOpacity
        style={[styles.searchGoalItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
        onPress={() => {
          // Navigate to goal detail - you'll need to add this navigation
          // navigation.navigate('GoalDetail', {
          //   goalId: item.id,
          // });
        }}
      >
        {/* User Info Section */}
        <View style={styles.searchGoalUserSection}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.searchGoalUserAvatar} />
          ) : (
            <View style={[styles.searchGoalUserAvatarPlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={[styles.searchGoalUserAvatarInitial, { color: 'white' }]}>
                {item.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.searchGoalUserInfo}>
            <Text style={[styles.searchGoalUserName, { color: theme.textPrimary }]}>
              {item.profiles?.display_name || item.profiles?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.searchGoalUserUsername, { color: theme.textSecondary }]}>
              @{item.profiles?.username || 'unknown'}
            </Text>
          </View>
        </View>

        {/* Goal Content Section */}
        <View style={styles.searchGoalContentSection}>
          <Text style={[styles.searchGoalTitle, { color: theme.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={[styles.searchGoalDescription, { color: theme.textSecondary }]} numberOfLines={3}>
              {item.description}
            </Text>
          )}
          <View style={styles.searchGoalMetaSection}>
            <View style={[styles.searchGoalCategory, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}>
              <Text style={[styles.searchGoalCategoryText, { color: theme.textSecondary }]}>
                {item.category || 'Default'}
              </Text>
            </View>
            <Text style={[styles.searchGoalDate, { color: theme.textTertiary }]}>
              {formatLastUpdate(item.last_updated_at, item.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyUsers = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {searchQuery ? 'No users found' : 'Discover People'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery 
          ? 'Try a different search term' 
          : 'Find and follow people to see their progress'
        }
      </Text>
    </View>
  );

  const renderEmptyGoals = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flag-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {searchQuery ? 'No goals found' : 'Discover Goals'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery 
          ? 'Try a different search term' 
          : 'Find inspiring goals from other users'
        }
      </Text>
    </View>
  );

  const loadExploreGoals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Build the query
      let query = supabase
        .from('goals')
        .select('*')
        .neq('user_id', user.id)
        .eq('completed', false);

      // Add category filter if a category is selected
      if (selectedCategory && selectedCategory !== 'Default') {
        query = query.eq('category', selectedCategory);
      }

      // Execute the query
      let { data: goals, error } = await query
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching explore goals:', error);
        return;
      }

      // If no other users have goals, show current user's goals as examples
      if (!goals || goals.length === 0) {
        const { data: userGoals, error: userError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (userError) {
          console.error('Error fetching user goals:', userError);
          return;
        }

        goals = userGoals;
      }

      // Fetch profile data for all goal creators
      if (goals && goals.length > 0) {
        const userIds = [...new Set(goals.map(goal => goal.user_id))];
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          // Create a map of user ID to profile data
          const profileMap = new Map();
          profiles?.forEach(profile => {
            profileMap.set(profile.id, profile);
          });

          // Attach profile data to goals
          const goalsWithProfiles = goals.map(goal => ({
            ...goal,
            profiles: profileMap.get(goal.user_id)
          }));

          setExploreGoals(goalsWithProfiles);
          
          // Check follow status for goal creators
          const newFollowingStatus = new Map<string, boolean>();
          for (const profile of profiles || []) {
            if (profile.id !== user.id) {
              try {
                const isFollowing = await socialService.isFollowing(user.id, profile.id);
                newFollowingStatus.set(profile.id, isFollowing);
              } catch (error) {
                newFollowingStatus.set(profile.id, false);
              }
            }
          }
          
          // Update the followingStatus with goal creator follow status
          setFollowingStatus(prevStatus => new Map([...prevStatus, ...newFollowingStatus]));
          
          // Load interaction data for the goals
          loadGoalInteractionData(goalsWithProfiles);
          return;
        }
      }

      setExploreGoals(goals || []);
    } catch (error) {
      console.error('Error loading explore goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load search history and suggested users when modal opens
  useEffect(() => {
    if (showSearchModal && user) {
      loadSearchHistory();
      loadSuggestedUsers();
    }
  }, [showSearchModal, user]);

  // Handle search type changes
  useEffect(() => {
    if (pendingSearchQuery.trim().length > 0) {
      handleSearchInput(pendingSearchQuery);
      setPendingSearchQuery('');
    }
  }, [searchType, pendingSearchQuery]);

  const loadSearchHistory = async () => {
    if (!user) return;
    try {
      const history = await socialService.getSearchHistory(user.id);
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!user) return;
    try {
      const suggested = await socialService.getSuggestedUsers(user.id, 5);
      setYouMayLikeUsers(suggested);
      // Fetch follower counts for suggested users
      if (suggested.length > 0) {
        await fetchFollowerCounts(suggested);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const handleSearchHistoryItemPress = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const removeFromSearchHistory = async (query: string) => {
    if (!user) return;
    try {
      // Remove from local state
      setSearchHistory(prev => prev.filter(item => item !== query));
      // Clear from database (we'll save the updated list)
      await socialService.clearSearchHistory(user.id);
      // Re-save the remaining history
      const remainingHistory = searchHistory.filter(item => item !== query);
      
      // Save the updated history
      for (const item of remainingHistory) {
        await socialService.saveSearchHistory(user.id, item);
      }
    } catch (error) {
      console.error('Error removing from search history:', error);
    }
  };

  // Handle goal like changes
  const handleGoalLikeChange = (goalId: string, isLiked: boolean, newCount: number) => {
    setGoalInteractionData(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        likes: newCount,
        isLiked: isLiked
      }
    }));
  };

  // Handle goal comment press
  const handleGoalCommentPress = (goalId: string) => {
    console.log('Comment button pressed for goal:', goalId);
    // Find the goal to get its title
    const goal = exploreGoals.find(g => g.id === goalId);
    console.log('Found goal:', goal);
    if (goal) {
      setSelectedGoalForComment({ id: goalId, title: goal.title });
      setCommentModalVisible(true);
      console.log('Opening comment modal for:', goal.title);
    } else {
      console.log('Goal not found in exploreGoals');
    }
  };

  // Load goals from people you're following
  const loadFollowingGoals = async () => {
    if (!user) return;
    
    setLoadingFollowing(true);
    try {
      console.log('Loading goals from people you follow for user:', user.id);
      
      // First get the people you're following
      const following = await socialService.getFollowing(user.id);
      console.log('Following users loaded:', following);
      
      if (following.length === 0) {
        setFollowingGoalsList([]);
        return;
      }
      
      // Get goals from people you're following
      const followingIds = following.map(user => user.id);
      
      // Build the query
      let query = supabase
        .from('goals')
        .select('*')
        .in('user_id', followingIds)
        .eq('completed', false);

      // Add category filter if a category is selected
      if (selectedCategory && selectedCategory !== 'Default') {
        query = query.eq('category', selectedCategory);
      }

      // Execute the query
      const { data: goals, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading following goals:', error);
        setFollowingGoalsList([]);
        return;
      }
      
      console.log('Goals from following users loaded:', goals);
      
      // Get profile data for goal creators
      if (goals && goals.length > 0) {
        const userIds = [...new Set(goals.map(goal => goal.user_id))];
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles for following goals:', profilesError);
        } else {
          // Create a map of user ID to profile data
          const profileMap = new Map();
          profiles?.forEach(profile => {
            profileMap.set(profile.id, profile);
          });

          // Attach profile data to goals
          const goalsWithProfiles = goals.map(goal => ({
            ...goal,
            profiles: profileMap.get(goal.user_id)
          }));

          setFollowingGoalsList(goalsWithProfiles);
          // Load interaction data for these goals
          loadGoalInteractionData(goalsWithProfiles);
        }
      } else {
        setFollowingGoalsList([]);
      }
    } catch (error) {
      console.error('Error loading following goals:', error);
      setFollowingGoalsList([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header with Search Icon and Tab Buttons */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Simple Category Button */}
                      <TouchableOpacity
              style={styles.headerCategoryButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Ionicons name="filter-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          
          {/* Tab Buttons */}
          <TouchableOpacity
            style={[styles.headerTabButton, activeTab === 'explore' && styles.headerTabButtonActive]}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={[styles.headerTabText, { color: theme.textSecondary }, activeTab === 'explore' && styles.headerTabTextActive]}>
              Explore
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTabButton, activeTab === 'following' && styles.headerTabButtonActive]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.headerTabText, { color: theme.textSecondary }, activeTab === 'following' && styles.headerTabTextActive]}>
              Following
            </Text>
          </TouchableOpacity>
          
          {/* Search Modal Button */}
                      <TouchableOpacity 
              style={styles.searchIconButton}
              onPress={() => setShowSearchModal(true)}
            >
              <Ionicons name="search-outline" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
        </View>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={[styles.container, { backgroundColor: '#141414' }]}>
          <View style={[styles.header, { paddingTop: 60 }]}>
            <View style={styles.searchModalHeaderContainer}>
              <TouchableOpacity 
                onPress={() => setShowSearchModal(false)}
                style={styles.searchModalBackButton}
              >
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              
              <View style={[styles.searchModalInputContainer, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
                <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Search users, goals and competitions..."
                  placeholderTextColor={theme.textTertiary}
                  value={searchQuery}
                  onChangeText={handleSearchInput}
                  onSubmitEditing={() => handleSearch(searchQuery)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchModalClearButton}>
                    <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.searchModalSearchButton}
                onPress={() => {
                  if (searchQuery.trim().length > 0) {
                    handleSearch(searchQuery);
                  }
                }}
              >
                <Text style={[styles.searchButtonText, { color: searchQuery.length > 0 ? '#EA580C' : theme.textSecondary }]}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          {searchQuery.length > 0 ? (
            <>
              {/* Search Type Tabs */}
              <View style={styles.searchTypeTabs}>
                <TouchableOpacity 
                  style={[
                    styles.searchTypeTab, 
                    searchType === 'top' && styles.searchTypeTabActive
                  ]}
                  onPress={() => {
                    setSearchType('top');
                    if (searchQuery.trim().length > 0) {
                      setPendingSearchQuery(searchQuery);
                    }
                  }}
                >
                  <Text style={[
                    styles.searchTypeTabText, 
                    { color: searchType === 'top' ? '#EA580C' : theme.textSecondary }
                  ]}>
                    Top
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.searchTypeTab, 
                    searchType === 'users' && styles.searchTypeTabActive
                  ]}
                  onPress={() => {
                    setSearchType('users');
                    if (searchQuery.trim().length > 0) {
                      setPendingSearchQuery(searchQuery);
                    }
                  }}
                >
                  <Text style={[
                    styles.searchTypeTabText, 
                    { color: searchType === 'users' ? '#EA580C' : theme.textSecondary }
                  ]}>
                    Users
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.searchTypeTab, 
                    searchType === 'goals' && styles.searchTypeTabActive
                  ]}
                  onPress={() => {
                    setSearchType('goals');
                    if (searchQuery.trim().length > 0) {
                      setPendingSearchQuery(searchQuery);
                    }
                  }}
                >
                  <Text style={[
                    styles.searchTypeTabText, 
                    { color: searchType === 'goals' ? '#EA580C' : theme.textSecondary }
                  ]}>
                    Goals
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {searchType === 'users' ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderUser}
                  keyExtractor={(item) => item.id}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={renderEmptyUsers}
                />
              ) : searchType === 'goals' ? (
                <FlatList
                  data={goalSearchResults}
                  renderItem={renderGoal}
                  keyExtractor={(item) => item.id}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={renderEmptyGoals}
                />
              ) : (
                // Top category - show both users and goals
                <FlatList
                  data={[
                    ...searchResults.map(user => ({ ...user, type: 'user' })),
                    ...goalSearchResults.map(goal => ({ ...goal, type: 'goal' }))
                  ]}
                  renderItem={({ item }) => {
                    if (item.type === 'user') {
                      const userItem = { ...item };
                      delete userItem.type;
                      return renderUser({ item: userItem });
                    } else if (item.type === 'goal') {
                      const goalItem = { ...item };
                      delete goalItem.type;
                      return renderGoal({ item: goalItem });
                    }
                    return null;
                  }}
                  keyExtractor={(item) => `${item.type}-${item.id}`}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
                      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                        {searchQuery ? 'No results found' : 'Search for users and goals'}
                      </Text>
                      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                        {searchQuery 
                          ? 'Try a different search term' 
                          : 'Find people and inspiring goals'
                        }
                      </Text>
                    </View>
                  )}
                />
              )}
            </>
          ) : (
            <View style={styles.searchContent}>
              {/* Search History */}
              {searchHistory.length > 0 && (
                <View style={styles.searchHistorySection}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    Recent Searches
                  </Text>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.historyItemCompact}
                      onPress={() => handleSearchHistoryItemPress(query)}
                    >
                      <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                      <Text style={[styles.historyText, { color: theme.textPrimary }]} numberOfLines={1}>
                        {query}
                      </Text>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          removeFromSearchHistory(query);
                        }}
                      >
                        <Ionicons name="close" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                  {searchHistory.length > 5 && (
                    <TouchableOpacity 
                      style={styles.seeMoreButton}
                      onPress={() => {
                        // TODO: Implement see more functionality
                        console.log('See more clicked');
                      }}
                    >
                      <Text style={[styles.seeMoreText, { color: theme.textSecondary }]}>
                        See more
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* You May Also Like */}
              <View style={styles.youMayLikeSection}>
                <View style={styles.youMayLikeHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    You may also like
                  </Text>
                  <TouchableOpacity style={styles.refreshButton}>
                    <Ionicons name="refresh" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={youMayLikeUsers}
                  renderItem={renderUser}
                  keyExtractor={(item) => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  style={styles.youMayLikeList}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>



      {/* Simple Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.simpleCategoryModal}>
          <View style={styles.simpleCategoryContent}>
            {/* X Button in top right */}
            <TouchableOpacity
              style={styles.simpleCategoryXButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.simpleCategoryTitle}>
              Choose Category
            </Text>
            <View style={styles.simpleCategoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={[
                    styles.simpleCategoryItem,
                    selectedCategory === category.name && { 
                      backgroundColor: 'rgba(234, 88, 12, 0.2)',
                      borderColor: 'rgba(234, 88, 12, 0.5)'
                    }
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.name);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.simpleCategoryIcon}>{category.icon}</Text>
                  <Text style={styles.simpleCategoryName}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Content based on active tab and search */}
      <View style={styles.contentContainer}>
        {activeTab === 'explore' ? (
          searchQuery ? (
              // Show search results
              socialLoading || isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    {isSearching ? 'Searching...' : 'Loading...'}
                  </Text>
                </View>
              ) : (
              <FlatList
                data={searchResults}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyUsers}
              />
            )
          ) : (
            // Show trending goals
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <ExploreContent 
                goals={filteredGoals} 
                loading={loading} 
                theme={theme}
                goalInteractionData={goalInteractionData}
                onLikeChange={handleGoalLikeChange}
                onCommentPress={handleGoalCommentPress}
                onFollow={handleFollow}
                followingUsers={followingUsers}
                followingStatus={followingStatus}
                fetchFollowerCounts={fetchFollowerCounts}
              />
            </ScrollView>
          )
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <FollowingContent 
              theme={theme} 
              followingUsers={followingGoalsList}
              loading={loadingFollowing}
              goalInteractionData={goalInteractionData}
              onLikeChange={handleGoalLikeChange}
              onCommentPress={handleGoalCommentPress}
            />
          </ScrollView>
        )}
      </View>

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        goalId={selectedGoalForComment?.id || ''}
        goalTitle={selectedGoalForComment?.title || ''}
        onClose={() => {
          setCommentModalVisible(false);
          setSelectedGoalForComment(null);
        }}
      />

    </SafeAreaView>
  );
}

// Explore Content Component


function ExploreContent({ 
  goals, 
  loading, 
  theme, 
  goalInteractionData,
  onLikeChange,
  onCommentPress,
  onFollow,
  followingUsers,
  followingStatus,
  fetchFollowerCounts,
}: { 
  goals: GoalWithUser[], 
  loading: boolean, 
  theme: any,
  goalInteractionData: {[goalId: string]: { likes: number; comments: number; isLiked: boolean }},
  onLikeChange: (goalId: string, isLiked: boolean, newCount: number) => void,
  onCommentPress: (goalId: string) => void,
  onFollow: (userId: string) => void,
  followingUsers: Set<string>;
  followingStatus: Map<string, boolean>;
  fetchFollowerCounts: (users: Profile[]) => Promise<void>;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'fitness':
        return 'fitness-outline';
      case 'health':
        return 'medical-outline';
      case 'learning':
        return 'school-outline';
      case 'career':
        return 'briefcase-outline';
      case 'relationships':
        return 'people-outline';
      case 'finance':
        return 'wallet-outline';
      case 'hobbies':
        return 'game-controller-outline';
      default:
        return 'flag-outline';
    }
  };

  // Helper function to calculate time until next check-in
  const getTimeUntilNextCheckIn = (checkInSchedule: string, lastUpdatedAt?: string) => {
    if (!checkInSchedule) return 'No schedule set';
    
    const now = new Date();
    let nextCheckIn = new Date();
    
    // Parse the check-in schedule and calculate next check-in time
    if (checkInSchedule.includes('Daily')) {
      const time = checkInSchedule.includes('6pm') ? 18 : 9; // 6pm or 9am
      nextCheckIn.setHours(time, 0, 0, 0);
      
      // If today's time has passed, set to tomorrow
      if (now > nextCheckIn) {
        nextCheckIn.setDate(nextCheckIn.getDate() + 1);
      }
    } else if (checkInSchedule.includes('Every Monday')) {
      const daysUntilMonday = (8 - now.getDay()) % 7;
      nextCheckIn.setDate(now.getDate() + daysUntilMonday);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Every Friday')) {
      const daysUntilFriday = (5 - now.getDay() + 7) % 7;
      nextCheckIn.setDate(now.getDate() + daysUntilFriday);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Twice a week')) {
      // Simple approximation - every 3-4 days
      nextCheckIn.setDate(now.getDate() + 3);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Weekly')) {
      nextCheckIn.setDate(now.getDate() + 7);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Bi-weekly')) {
      nextCheckIn.setDate(now.getDate() + 14);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Monthly')) {
      nextCheckIn.setMonth(now.getMonth() + 1);
      nextCheckIn.setHours(9, 0, 0, 0);
    }
    
    const timeDiff = nextCheckIn.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Due now';
    }
  };

  return (
          <View style={styles.content}>
        <View style={styles.section}>
          
          {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading goals...</Text>
          </View>
        ) : goals.length > 0 ? (
          <View style={styles.cardsContainer}>
            {goals.map((goal) => (
              <View key={goal.id} style={[styles.card, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
                <View style={styles.goalContentRow}>
                  <View style={[styles.goalContentLeft, Platform.OS === 'android' && styles.goalContentLeftAndroid]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.userInfo}>
                        {goal.profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: goal.profiles.avatar_url }} 
                            style={[styles.avatarPlaceholder, { borderRadius: 8 }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                            <Text style={[styles.avatarInitial, { color: 'white' }]}>
                              {goal.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.userInfoText}>
                          <Text style={[styles.userHandle, { color: '#ffffff', fontWeight: 'bold' }]}>@{goal.profiles?.username || 'user'}</Text>
                          <TouchableOpacity onPress={() => onFollow(goal.profiles?.id || '')}>
                            <Text style={[styles.followStatus, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                              {goal.profiles?.id && followingStatus.get(goal.profiles.id) ? 'Followed' : 'Follow'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
                      {goal.title}
                    </Text>
                    <View style={styles.goalStats}>
                      <View style={styles.stat}>
                        <Ionicons name="time-outline" size={16} color="#ffffff" />
                        <Text style={[styles.statText, { color: theme.textTertiary }]}>
                          {formatLastUpdate(goal.last_updated_at, goal.created_at)}
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons name="trophy-outline" size={16} color="#ffffff" />
                        <Text style={[styles.statText, { color: theme.textTertiary }]}>
                          {goal.category || 'No category'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Goal Interaction Bar */}
                    <GoalInteractionBar
                      goalId={goal.id}
                      initialLikeCount={goalInteractionData[goal.id]?.likes || 0}
                      initialCommentCount={goalInteractionData[goal.id]?.comments || 0}
                      initialIsLiked={goalInteractionData[goal.id]?.isLiked || false}
                      onLikeChange={(isLiked, newCount) => onLikeChange(goal.id, isLiked, newCount)}
                      onCommentPress={() => onCommentPress(goal.id)}
                      size="medium"
                      showCounts={true}
                    />
                  </View>
                  
                  <View style={styles.goalUpdateRight}>
                    {goal.media_url ? (
                      <Image 
                        source={{ uri: goal.media_url }} 
                        style={styles.goalUpdateMedia}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noUpdateContainer}>
                        <Text style={[styles.noUpdateText, { color: theme.textTertiary }]}>
                          Reason: {goal.description || 'No reason provided'}
                        </Text>
                        <Text style={[styles.noUpdateText, { color: theme.textTertiary, marginTop: 8 }]}>
                          Next update: {getTimeUntilNextCheckIn(goal.check_in_schedule || '', goal.last_updated_at)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              Discover Goals
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Find inspiring goals from other users
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Following Content Component
function FollowingContent({ 
  theme, 
  followingUsers, 
  loading,
  goalInteractionData,
  onLikeChange,
  onCommentPress
}: { 
  theme: any; 
  followingUsers: GoalWithUser[]; 
  loading: boolean;
  goalInteractionData: {[goalId: string]: { likes: number; comments: number; isLiked: boolean }};
  onLikeChange: (goalId: string, isLiked: boolean, newCount: number) => void;
  onCommentPress: (goalId: string) => void;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'fitness':
        return 'fitness-outline';
      case 'health':
        return 'medical-outline';
      case 'learning':
        return 'school-outline';
      case 'career':
        return 'briefcase-outline';
      case 'relationships':
        return 'people-outline';
      case 'finance':
        return 'wallet-outline';
      case 'hobbies':
        return 'game-controller-outline';
      default:
        return 'flag-outline';
    }
  };

  // Helper function to calculate time until next check-in
  const getTimeUntilNextCheckIn = (checkInSchedule: string, lastUpdatedAt?: string) => {
    if (!checkInSchedule) return 'No schedule set';
    
    const now = new Date();
    let nextCheckIn = new Date();
    
    // Parse the check-in schedule and calculate next check-in time
    if (checkInSchedule.includes('Daily')) {
      const time = checkInSchedule.includes('6pm') ? 18 : 9; // 6pm or 9am
      nextCheckIn.setHours(time, 0, 0, 0);
      
      // If today's time has passed, set to tomorrow
      if (now > nextCheckIn) {
        nextCheckIn.setDate(nextCheckIn.getDate() + 1);
      }
    } else if (checkInSchedule.includes('Every Monday')) {
      const daysUntilMonday = (8 - now.getDay()) % 7;
      nextCheckIn.setDate(now.getDate() + daysUntilMonday);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Every Friday')) {
      const daysUntilFriday = (5 - now.getDay() + 7) % 7;
      nextCheckIn.setDate(now.getDate() + daysUntilFriday);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Twice a week')) {
      // Simple approximation - every 3-4 days
      nextCheckIn.setDate(now.getDate() + 3);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Weekly')) {
      nextCheckIn.setDate(now.getDate() + 7);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Bi-weekly')) {
      nextCheckIn.setDate(now.getDate() + 14);
      nextCheckIn.setHours(9, 0, 0, 0);
    } else if (checkInSchedule.includes('Monthly')) {
      nextCheckIn.setMonth(now.getMonth() + 1);
      nextCheckIn.setHours(9, 0, 0, 0);
    }
    
    const timeDiff = nextCheckIn.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Due now';
    }
  };

  return (
          <View style={styles.content}>
        <View style={styles.section}>
          
          {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading goals...</Text>
          </View>
        ) : followingUsers.length > 0 ? (
          <View style={styles.cardsContainer}>
            {followingUsers.map((goal) => (
              <View key={goal.id} style={[styles.card, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
                <View style={styles.goalContentRow}>
                  <View style={[styles.goalContentLeft, Platform.OS === 'android' && styles.goalContentLeftAndroid]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.userInfo}>
                        {goal.profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: goal.profiles.avatar_url }} 
                            style={[styles.avatarPlaceholder, { borderRadius: 8 }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                            <Text style={[styles.avatarInitial, { color: 'white' }]}>
                              {goal.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.userInfoText}>
                          <Text style={[styles.userHandle, { color: '#ffffff', fontWeight: 'bold' }]}>@{goal.profiles?.username || 'user'}</Text>
                          <Text style={[styles.followStatus, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                            Followed
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
                      {goal.title}
                    </Text>
                    <View style={styles.goalStats}>
                      <View style={styles.stat}>
                        <Ionicons name="time-outline" size={16} color="#ffffff" />
                        <Text style={[styles.statText, { color: theme.textTertiary }]}>
                          {formatLastUpdate(goal.last_updated_at, goal.created_at)}
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons name="trophy-outline" size={16} color="#ffffff" />
                        <Text style={[styles.statText, { color: theme.textTertiary }]}>
                          {goal.category || 'No category'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Goal Interaction Bar */}
                    <GoalInteractionBar
                      goalId={goal.id}
                      initialLikeCount={goalInteractionData[goal.id]?.likes || 0}
                      initialCommentCount={goalInteractionData[goal.id]?.comments || 0}
                      initialIsLiked={goalInteractionData[goal.id]?.isLiked || false}
                      onLikeChange={(isLiked, newCount) => onLikeChange(goal.id, isLiked, newCount)}
                      onCommentPress={() => onCommentPress(goal.id)}
                      size="medium"
                      showCounts={true}
                    />
                  </View>
                  
                  <View style={styles.goalUpdateRight}>
                    {goal.media_url ? (
                      <Image 
                        source={{ uri: goal.media_url }} 
                        style={styles.goalUpdateMedia}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noUpdateContainer}>
                        <Text style={[styles.noUpdateText, { color: theme.textTertiary }]}>
                          Reason: {goal.description || 'No reason provided'}
                        </Text>
                        <Text style={[styles.noUpdateText, { color: theme.textTertiary, marginTop: 8 }]}>
                          Next update: {getTimeUntilNextCheckIn(goal.check_in_schedule || '', goal.last_updated_at)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No goals from following</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>The people you follow haven't created any goals yet.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTabButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    alignItems: 'center',
  },
  headerTabButtonActive: {
    // No background, just text color change
  },
  headerTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTabTextActive: {
    color: '#EA580C',
  },
  headerCategoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerCategoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    // backgroundColor will be applied dynamically
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: '#6b7280',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  goalStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 72) / 3,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  activityContainer: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  goalHighlight: {
    fontWeight: '600',
    color: '#129490',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  likeButton: {
    padding: 8,
  },
  suggestionsContainer: {
    gap: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  userBio: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesScrollContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
  },
  categoryPillIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryPillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedCategoryPill: {
    // backgroundColor will be applied dynamically
  },
  selectedCategoryPillName: {
    color: '#ffffff',
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryPickerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  categoryPickerIcon: {
    fontSize: 20,
  },

  simpleCategoryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleCategoryContent: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 350,
    width: '100%',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  simpleCategoryXButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  simpleCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
    color: '#ffffff',
  },
  simpleCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  simpleCategoryItem: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  simpleCategoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  simpleCategoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: '#ffffff',
  },

  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 0,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Profile Card Styles (matching ProfileScreen)
  profilePictureSection: {
    marginRight: 0,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfoSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileDisplayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  profileFollowersSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
  },
  profileFollowers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  profileFollowersCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 2,
    textAlign: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  smallFollowButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smallFollowButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchIconButton: {
    padding: 8,
    flex: 1,
    alignItems: 'center',
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgb(20, 19, 19)',
  },
  searchModal: {
    flex: 1,
  },
      searchModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchModalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 1,
  },
  searchModalBackButton: {
    padding: 4,
    marginLeft: -4,
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 0,
  },
  searchModalSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },


  searchModalClearButton: {
    marginLeft: 8,
  },
  searchResultsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: 24,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 12,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchHistorySection: {
    marginBottom: 24,
    paddingTop: 6,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginBottom: 8,
  },
  historyItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  youMayLikeSection: {
    flex: 1,
  },
  youMayLikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  youMayLikeList: {
    flex: 1,
  },
  // Gradient styles for search modal
  topLeftGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '50%',
    borderRadius: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  topRightGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '50%',
    borderRadius: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  bottomLeftGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: '50%',
    borderRadius: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  bottomRightGlow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%',
    borderRadius: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  bottomSideGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderRadius: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  // Goal search styles
  searchGoalItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  searchGoalUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchGoalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchGoalUserAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchGoalUserAvatarInitial: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchGoalUserInfo: {
    flex: 1,
  },
  searchGoalUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchGoalUserUsername: {
    fontSize: 14,
  },
  searchGoalContentSection: {
    flex: 1,
  },
  searchGoalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchGoalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  searchGoalMetaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchGoalCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  searchGoalCategoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchGoalDate: {
    fontSize: 12,
  },
  // Search type tabs styles
  searchTypeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: 10,
  },
  searchTypeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  searchTypeTabActive: {
    // No background, just color change
  },
  searchTypeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Top search styles
  topSection: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  topUsersList: {
    marginTop: 8,
    paddingLeft: 0,
  },
  topGoalsList: {
    marginTop: 8,
    paddingLeft: 0,
  },
  userInfoText: {
    flex: 1,
  },
  followStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  goalContentRow: {
    flexDirection: 'row',
    height: 180,
    marginTop: 0,
  },
  goalContentLeft: {
    width: '50%',
    padding: 20,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  goalContentLeftAndroid: {
    width: '50%',
    padding: 20,
    paddingRight: 12,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  goalUpdateRight: {
    width: '50%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 0,
    marginRight: 0,
  },
  goalUpdateMedia: {
    width: '100%',
    height: '100%',
  },
  noUpdateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    padding: 16,
  },
  noUpdateText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 