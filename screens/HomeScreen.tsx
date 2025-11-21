import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
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
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { Goal, DailyHabits } from '../types/database';
import { useTheme } from '../state/themeStore';
import { syncAllUserData } from '../lib/syncUserData';
import { useSocialStore } from '../state/socialStore';
import { Profile } from '../lib/socialService';
import { socialService } from '../lib/socialService';
import CustomBackground from '../components/CustomBackground';
import { LinearGradient } from 'expo-linear-gradient';
import GoalInteractionBar from '../components/GoalInteractionBar';
import PostInteractionBar from '../components/PostInteractionBar';
import DailyPostInteractionBar from '../components/DailyPostInteractionBar';
import CommentModal from '../components/CommentModal';
import PostCommentModal from '../components/PostCommentModal';
import CreatePostModal from '../components/CreatePostModal';
import NewGoalModal from '../components/NewGoalModal';
import GesturePhotoCarousel from '../components/GesturePhotoCarousel';
import FullScreenPhotoModal from '../components/FullScreenPhotoModal';
import { notificationService } from '../lib/notificationService';
import { goalInteractionsService } from '../lib/goalInteractions';
import { dailyPostInteractionsService } from '../lib/dailyPostInteractions';
import { formatLastUpdate } from '../lib/goalHelpers';
import { postsService } from '../lib/postsService';
import { dailyPostsService } from '../lib/dailyPostsService';
import { DailyPost } from '../types/database';

// Extended Goal type with user data
interface GoalWithUser extends Goal {
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  media_url?: string;
  dailyHabits?: DailyHabits;
}

// Extended Post type with user data
interface PostWithUser {
  id: string;
  user_id: string;
  content: string;
  goal_id?: string;
  date: string;
  photos: string[];
  habits_completed: string[];
  caption?: string;
  mood_rating: number;
  energy_level: number;
  is_public: boolean;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  dailyHabits?: DailyHabits;
  type: 'post'; // To distinguish from goals
}

// Extended DailyPost type with user data
interface DailyPostWithUser extends DailyPost {
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  type: 'daily_post'; // To distinguish from goals and posts
}

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'explore' | 'following'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreGoals, setExploreGoals] = useState<GoalWithUser[]>([]);
  const [explorePosts, setExplorePosts] = useState<PostWithUser[]>([]);
  const [dailyPosts, setDailyPosts] = useState<DailyPostWithUser[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<GoalWithUser[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithUser[]>([]);
  const [filteredDailyPosts, setFilteredDailyPosts] = useState<DailyPostWithUser[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [followerCounts, setFollowerCounts] = useState<Map<string, number>>(new Map());
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [goalInteractionData, setGoalInteractionData] = useState<{[goalId: string]: { likes: number; comments: number; isLiked: boolean }}>({});
  const [postInteractionData, setPostInteractionData] = useState<{[postId: string]: { likes: number; comments: number; isLiked: boolean }}>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedGoalForComment, setSelectedGoalForComment] = useState<{id: string, title: string} | null>(null);
  const [postCommentModalVisible, setPostCommentModalVisible] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState<{id: string, title: string} | null>(null);
  const [followingGoalsList, setFollowingGoalsList] = useState<GoalWithUser[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{[postId: string]: number}>({});
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [fullScreenPhotos, setFullScreenPhotos] = useState<string[]>([]);
  const [fullScreenInitialIndex, setFullScreenInitialIndex] = useState(0);
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();
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
      loadUnreadNotificationCount();
      // Sync user data to ensure email is properly set
      syncAllUserData();
    } else {
      // Clear explore goals when user logs out
      setExploreGoals([]);
      setFilteredGoals([]);
    }
  }, [user, selectedCategory]);

  // Refresh notification count when component mounts
  useEffect(() => {
    if (user) {
      loadUnreadNotificationCount();
    }
  }, [user]);

  // Reset photo index when daily posts change to ensure most recent photo is shown first
  useEffect(() => {
    if (dailyPosts.length > 0) {
      const resetPhotoIndex: {[postId: string]: number} = {};
      dailyPosts.forEach(dailyPost => {
        resetPhotoIndex[dailyPost.id] = 0; // Always start at first photo (most recent)
      });
      setCurrentPhotoIndex(resetPhotoIndex);
    }
  }, [dailyPosts]);

  // Load goals from people you're following when following tab is active
  useEffect(() => {
    if (activeTab === 'following' && user) {
      loadFollowingGoals();
    }
  }, [activeTab, user, selectedCategory]);

  // Load interaction data for goals
  const refreshPostInteractionData = async (postId: string) => {
    if (!user) return;
    
    try {
      // Load likes for the specific post
      const { data: postLikes, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (likesError) {
        console.error('Error loading post likes:', likesError);
      }

      // Load comment counts for the specific post
      const { data: postComments, error: commentsError } = await supabase
        .from('post_comments')
        .select('post_id, id')
        .eq('post_id', postId);

      if (commentsError) {
        console.error('Error loading post comments:', commentsError);
      }

      // Load reply counts for the specific post
      const commentIds = postComments?.map(c => c.id) || [];
      const { data: postReplies, error: repliesError } = await supabase
        .from('post_comment_replies')
        .select('parent_comment_id')
        .in('parent_comment_id', commentIds);

      if (repliesError) {
        console.error('Error loading post replies:', repliesError);
      }

      // Load like counts for the specific post
      const { data: postLikeCounts, error: likeCountsError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId);

      if (likeCountsError) {
        console.error('Error loading post like counts:', likeCountsError);
      }

      // Process the data
      const isLiked = (postLikes?.length || 0) > 0;
      const likeCount = postLikeCounts?.length || 0;
      const mainCommentCount = postComments?.length || 0;
      const replyCount = postReplies?.length || 0;
      const totalCommentCount = mainCommentCount + replyCount;
      
      setPostInteractionData(prev => ({
        ...prev,
        [postId]: {
          likes: likeCount,
          comments: totalCommentCount,
          isLiked: isLiked
        }
      }));
    } catch (error) {
      console.error('Error refreshing post interaction data:', error);
    }
  };

  const loadPostInteractionData = async (posts: PostWithUser[]) => {
    if (!user) return;
    
    try {
      const postIds = posts.map(post => post.id);
      
      // Load likes for posts
      const { data: postLikes, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds)
        .eq('user_id', user.id);

      if (likesError) {
        console.error('Error loading post likes:', likesError);
      }

      // Load comment counts for posts
      const { data: postComments, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, post_id')
        .in('post_id', postIds);

      if (commentsError) {
        console.error('Error loading post comments:', commentsError);
      }

      // Load reply counts for posts
      const commentIds = postComments?.map(c => c.id) || [];
      const { data: postReplies, error: repliesError } = await supabase
        .from('post_comment_replies')
        .select('parent_comment_id')
        .in('parent_comment_id', commentIds);

      if (repliesError) {
        console.error('Error loading post replies:', repliesError);
      }

      // Load like counts for posts
      const { data: postLikeCounts, error: likeCountsError } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);

      if (likeCountsError) {
        console.error('Error loading post like counts:', likeCountsError);
      }

      // Process the data
      const interactionData: {[postId: string]: { likes: number; comments: number; isLiked: boolean }} = {};
      
      postIds.forEach(postId => {
        const isLiked = postLikes?.some(like => like.post_id === postId) || false;
        const likeCount = postLikeCounts?.filter(like => like.post_id === postId).length || 0;
        const mainCommentCount = postComments?.filter(comment => comment.post_id === postId).length || 0;
        
        // Get comment IDs for this post to count replies
        const postCommentIdsForThisPost = postComments?.filter(comment => comment.post_id === postId).map(c => c.id) || [];
        const replyCount = postReplies?.filter(reply => 
          postCommentIdsForThisPost.includes(reply.parent_comment_id)
        ).length || 0;
        
        const totalCommentCount = mainCommentCount + replyCount;
        
        interactionData[postId] = {
          likes: likeCount,
          comments: totalCommentCount,
          isLiked: isLiked
        };
      });

      setPostInteractionData(interactionData);
    } catch (error) {
      console.error('Error loading post interaction data:', error);
    }
  };

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

  // Update filtered posts when explore posts change
  useEffect(() => {
    setFilteredPosts(explorePosts);
  }, [explorePosts]);

  // Update filtered daily posts when daily posts change
  useEffect(() => {
    setFilteredDailyPosts(dailyPosts);
  }, [dailyPosts]);



  const handleSearchInput = useCallback(async (query: string) => {
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
        const results = await socialService.searchGoals(query);
        setGoalSearchResults(results);
        setSearchResults([]);
      } else if (searchType === 'top') {
        // Search both users and goals
        const [userResults, goalResults] = await Promise.all([
          useSocialStore.getState().searchUsers(query),
          socialService.searchGoals(query)
        ]);
        
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
  }, [searchType]);

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

  const renderUser = useCallback(({ item }: { item: Profile }) => {
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
  }, [followingStatus, followerCounts, theme, handleFollow]);

  const renderGoal = ({ item }: { item: any }) => {
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
      // Build the query - show ALL goals (not just ones with photos)
      let query = supabase
        .from('goals')
        .select('*')
        .neq('user_id', user.id)
        .eq('completed', false)
        .eq('sharing_option', 'Public'); // Only show public goals

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

          // Fetch latest progress photos for each goal
          const goalIds = goals.map(goal => goal.id);
          
          // Try to fetch progress photos, but handle RLS restrictions gracefully
          let progressPhotos: Array<{goal_id: string, photo_url: string, date_uploaded: string}> = [];
          try {
            const { data: photos, error: photosError } = await supabase
              .from('progress_photos')
              .select('goal_id, photo_url, date_uploaded')
              .in('goal_id', goalIds)
              .order('date_uploaded', { ascending: false });

            if (photosError) {
              console.error('Error fetching progress photos (RLS restriction?):', photosError);
              // Continue without photos - this is expected if RLS is blocking access
            } else {
              progressPhotos = photos || [];
            }
          } catch (error) {
            console.error('Error accessing progress_photos table:', error);
            // Continue without photos
          }

          // Create a map of goal ID to latest photo
          const photoMap = new Map();
          progressPhotos.forEach(photo => {
            if (!photoMap.has(photo.goal_id)) {
              photoMap.set(photo.goal_id, photo.photo_url);
            }
          });

          // Fetch daily habits data for all goal creators (today's date)
          const today = new Date().toISOString().split('T')[0];
          let dailyHabitsMap = new Map();
          
          try {
            const { data: dailyHabits, error: habitsError } = await supabase
              .from('daily_habits')
              .select('*')
              .in('user_id', userIds)
              .eq('date', today);

            if (habitsError) {
              console.error('Error fetching daily habits:', habitsError);
            } else {
              dailyHabits?.forEach(habit => {
                dailyHabitsMap.set(habit.user_id, habit);
              });
            }
          } catch (error) {
            console.error('Error accessing daily_habits table:', error);
          }

          // Attach profile data, media, and daily habits to goals
          const goalsWithProfiles = goals.map(goal => ({
            ...goal,
            profiles: profileMap.get(goal.user_id),
            media_url: photoMap.get(goal.id),
            dailyHabits: dailyHabitsMap.get(goal.user_id)
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
          
          // Now fetch posts for all users
          await loadExplorePosts(userIds, profileMap, dailyHabitsMap);
          
          // Load post interaction data will be called after posts are loaded
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

  const loadUnreadNotificationCount = async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error('Error loading unread notification count:', error);
    }
  };

  const loadExplorePosts = async (userIds: string[], profileMap: Map<string, any>, dailyHabitsMap: Map<string, any>) => {
    try {
      // Fetch all public daily posts from the users we're following or that are public
      const { data: dailyPostsData, error: dailyPostsError } = await supabase
        .from('daily_posts')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to 20 daily posts for performance

      if (dailyPostsError) {
        console.error('Error fetching explore daily posts:', dailyPostsError);
        // Fallback to individual posts if daily posts fail
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .in('user_id', userIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching explore posts:', error);
          return;
        }

        if (posts && posts.length > 0) {
          // Attach profile data and daily habits to posts
          const postsWithProfiles = posts.map(post => ({
            ...post,
            profiles: profileMap.get(post.user_id),
            dailyHabits: dailyHabitsMap.get(post.user_id),
            type: 'post' as const
          }));

          setExplorePosts(postsWithProfiles);
          await loadPostInteractionData(postsWithProfiles);
        } else {
          setExplorePosts([]);
        }
        setDailyPosts([]);
        return;
      }

      if (dailyPostsData && dailyPostsData.length > 0) {
        // Attach profile data to daily posts
        const dailyPostsWithProfiles = dailyPostsData.map(dailyPost => ({
          ...dailyPost,
          profiles: profileMap.get(dailyPost.user_id),
          type: 'daily_post' as const
        }));

        setDailyPosts(dailyPostsWithProfiles);
        // Load interaction data for daily posts
        await loadDailyPostInteractionData(dailyPostsWithProfiles);
        // Clear individual posts since we're now showing daily posts
        setExplorePosts([]);
      } else {
        setDailyPosts([]);
        setExplorePosts([]);
      }
    } catch (error) {
      console.error('Error loading explore posts:', error);
      setDailyPosts([]);
      setExplorePosts([]);
    }
  };

  // Load daily post interaction data (using same service pattern as goals!)
  const loadDailyPostInteractionData = async (dailyPosts: DailyPostWithUser[]) => {
    if (!user || dailyPosts.length === 0) return;

    try {
      const dailyPostIds = dailyPosts.map(dp => dp.id);
      
      // Use the same pattern as goals: get interaction counts and user like status
      const [interactionCounts, userLikeStatuses] = await Promise.all([
        dailyPostInteractionsService.getDailyPostsInteractionCounts(dailyPostIds),
        Promise.all(dailyPostIds.map(dailyPostId => dailyPostInteractionsService.isDailyPostLikedByUser(dailyPostId)))
      ]);

      // Process interaction data (same as goals)
      const interactionData: {[postId: string]: { likes: number; comments: number; isLiked: boolean }} = {};
      
      dailyPostIds.forEach((id, index) => {
        const counts = interactionCounts[id] || { likes: 0, comments: 0 };
        const isLiked = userLikeStatuses[index] || false;
        
        interactionData[id] = {
          likes: counts.likes,
          comments: counts.comments,
          isLiked: isLiked
        };
      });

      setPostInteractionData(prev => ({ ...prev, ...interactionData }));
    } catch (error) {
      console.error('Error loading daily post interaction data:', error);
    }
  };

  // Merge goals, posts, and daily posts chronologically
  const getMergedFeed = useMemo(() => {
    const allItems = [
      ...exploreGoals.map(goal => ({ ...goal, type: 'goal' as const, sortDate: goal.created_at })),
      ...explorePosts.map(post => ({ ...post, type: 'post' as const, sortDate: post.created_at })),
      ...dailyPosts.map(dailyPost => ({ ...dailyPost, type: 'daily_post' as const, sortDate: dailyPost.created_at }))
    ];
    
    return allItems.sort((a, b) => 
      new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    );
  }, [exploreGoals, explorePosts, dailyPosts]);

  // Load spotlight users when component mounts
  useEffect(() => {
    if (user) {
      loadSpotlightUsers();
    }
  }, [user]);

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

  const loadSpotlightUsers = async () => {
    if (!user) return;
    try {
      // Default spotlight users: deividasg21, deividasg, demove, test
      const spotlightUsernames = ['deividasg21', 'deividasg', 'demove', 'test2', 'test3'];
      
      const { data: spotlightUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .in('username', spotlightUsernames)
        .neq('id', user.id); // Exclude current user
      
      if (error) throw error;
      
      setYouMayLikeUsers(spotlightUsers || []);
      
      // Fetch follower counts for spotlight users
      if (spotlightUsers && spotlightUsers.length > 0) {
        await fetchFollowerCounts(spotlightUsers);
      }
    } catch (error) {
      console.error('Error loading spotlight users:', error);
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

  // Handle regular post like changes
  const handlePostLikeChange = async (postId: string, isLiked: boolean, newCount: number) => {
    if (!user) return;
    
    try {
      if (isLiked) {
        // Add like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error adding post like:', error);
          return;
        }

        // Create notification for post owner
        await notificationService.createPostLikeNotification(postId, user.id);
      } else {
        // Remove like
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing post like:', error);
          return;
        }
      }

      // Update local state
      setPostInteractionData(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          likes: newCount,
          isLiked: isLiked
        }
      }));
    } catch (error) {
      console.error('Error handling post like change:', error);
    }
  };

  // Handle daily post like changes (using same service pattern as goals!)
  const handleDailyPostLikeChange = async (dailyPostId: string, isLiked: boolean, newCount: number) => {
    if (!user) return;
    
    try {
      // Use the same service pattern as goals
      const result = await dailyPostInteractionsService.toggleDailyPostLike(dailyPostId);
      
      if (result.success) {
        // Get real count after toggle
        const realCount = await dailyPostInteractionsService.getDailyPostLikeCount(dailyPostId);
        
        // Update local state with real data
        setPostInteractionData(prev => ({
          ...prev,
          [dailyPostId]: {
            ...prev[dailyPostId],
            likes: realCount,
            isLiked: result.isLiked
          }
        }));
      } else {
        console.error('Failed to toggle daily post like');
      }
    } catch (error) {
      console.error('Error handling daily post like change:', error);
    }
  };

  const handlePostCommentPress = (postId: string) => {
    const posts = explorePosts.filter(p => p.id === postId);
    if (posts.length === 0) return;
    
    const post = posts[0];
    setSelectedPostForComment({ id: postId, title: post.content || 'Post' });
    setPostCommentModalVisible(true);
  };

  const handleDailyPostCommentPress = (dailyPostId: string) => {
    const dailyPost = dailyPosts.find(dp => dp.id === dailyPostId);
    if (!dailyPost) return;
    
    setSelectedPostForComment({ id: dailyPostId, title: 'Daily Post' });
    setPostCommentModalVisible(true);
  };

  const handlePhotoPress = (photos: string[], initialIndex: number) => {
    setFullScreenPhotos(photos);
    setFullScreenInitialIndex(initialIndex);
    setShowFullScreenModal(true);
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
    // Find the goal to get its title
    const goal = exploreGoals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoalForComment({ id: goalId, title: goal.title });
      setCommentModalVisible(true);
    }
  };

  // Load goals from people you're following
  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      // Reload both explore and following data
      await Promise.all([
        loadExploreGoals(),
        loadFollowingGoals(),
        loadUnreadNotificationCount()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const loadFollowingGoals = async () => {
    if (!user) return;

    setLoadingFollowing(true);
    try {
      // First get the people you're following
      const following = await socialService.getFollowing(user.id);
      
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
      {/* Modern Header Design */}
      <View style={styles.header}>
        {/* Left side buttons */}
        <View style={styles.headerLeftButtons}>
          <TouchableOpacity 
            onPress={() => setActiveTab(activeTab === 'explore' ? 'following' : 'explore')}
            style={{ marginRight: 12 }}
          >
            <Ionicons 
              name={activeTab === 'explore' ? "globe-outline" : "people-outline"} 
              size={24} 
              color={theme.textPrimary} 
            />
          </TouchableOpacity>
        </View>

        {/* Center title */}
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Feed</Text>

        {/* Right side buttons */}
        <View style={styles.headerActionButtons}>
          <TouchableOpacity 
            onPress={() => setShowActionModal(true)}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="add" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowSearchModal(true)}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="search-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Notifications');
              } else {
                console.error('Navigation not available');
              }
            }}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
              {unreadNotificationCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  backgroundColor: '#ff5a5f',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: '700',
                  }}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </View>
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
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
                      }}
                    >
                      <Text style={[styles.seeMoreText, { color: theme.textSecondary }]}>
                        See more
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Suggested Users */}
              {youMayLikeUsers.length > 0 && (
                <View style={styles.suggestedUsersSection}>
                  <View style={styles.suggestedUsersHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                      Suggested for you
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                      People you might want to follow
                    </Text>
                  </View>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestedUsersList}
                  >
                    {youMayLikeUsers.map((user) => (
                      <View key={user.id} style={[styles.suggestedUserCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
                        <TouchableOpacity
                          style={styles.suggestedUserContent}
                          onPress={() => {
                            // Navigate to user profile
                            // navigation.navigate('UserProfile', { userId: user.id });
                          }}
                        >
                          {/* Profile Picture */}
                          <View style={styles.suggestedUserAvatar}>
                            {user.avatar_url ? (
                              <Image source={{ uri: user.avatar_url }} style={styles.suggestedUserImage} />
                            ) : (
                              <View style={[styles.suggestedUserPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.suggestedUserInitial}>
                                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          {/* User Info */}
                          <View style={styles.suggestedUserInfo}>
                            <Text style={[styles.suggestedUserName, { color: theme.textPrimary }]}>
                              {user.display_name || user.username}
                            </Text>
                            <Text style={[styles.suggestedUserHandle, { color: theme.textSecondary }]}>
                              @{user.username}
                            </Text>
                            {user.bio && (
                              <Text style={[styles.suggestedUserBio, { color: theme.textSecondary }]} numberOfLines={2}>
                                {user.bio}
                              </Text>
                            )}
                          </View>
                          
                          {/* Follow Button */}
                          <TouchableOpacity
                            style={[
                              styles.suggestedFollowButton,
                              { backgroundColor: theme.primary }
                            ]}
                            onPress={() => handleFollow(user.id)}
                          >
                            <Text style={styles.suggestedFollowButtonText}>
                              {followingStatus.get(user.id) ? 'Following' : 'Follow'}
                            </Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
            >
              <ExploreContent 
                goals={filteredGoals} 
                posts={filteredPosts}
                dailyPosts={filteredDailyPosts}
                mergedFeed={getMergedFeed}
                loading={loading} 
                theme={theme}
                goalInteractionData={goalInteractionData}
                onLikeChange={handleGoalLikeChange}
                onCommentPress={handleGoalCommentPress}
                onFollow={handleFollow}
                followingUsers={followingUsers}
                followingStatus={followingStatus}
                fetchFollowerCounts={fetchFollowerCounts}
                user={user}
                currentPhotoIndex={currentPhotoIndex}
                setCurrentPhotoIndex={setCurrentPhotoIndex}
                postInteractionData={postInteractionData}
                onPostLikeChange={handlePostLikeChange}
                onDailyPostLikeChange={handleDailyPostLikeChange}
                onPostCommentPress={handlePostCommentPress}
                onDailyPostCommentPress={handleDailyPostCommentPress}
                onPhotoPress={handlePhotoPress}
                youMayLikeUsers={youMayLikeUsers}
              />
            </ScrollView>
          )
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
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

      {/* Post Comment Modal */}
      <PostCommentModal
        visible={postCommentModalVisible}
        postId={selectedPostForComment?.id || ''}
        postTitle={selectedPostForComment?.title || ''}
        onClose={() => {
          const postId = selectedPostForComment?.id;
          const isDaily = selectedPostForComment?.title === 'Daily Post';
          setPostCommentModalVisible(false);
          setSelectedPostForComment(null);
          // Refresh interaction data when modal closes to ensure count is updated
          if (postId) {
            if (isDaily) {
              // For daily posts, reload all daily post interaction data
              loadDailyPostInteractionData(dailyPosts);
            } else {
              // For regular posts, use the existing refresh function
              refreshPostInteractionData(postId);
            }
          }
        }}
        onCommentAdded={() => {
          // Refresh interaction data for the current post
          if (selectedPostForComment) {
            const isDaily = selectedPostForComment.title === 'Daily Post';
            if (isDaily) {
              // For daily posts, reload all daily post interaction data
              loadDailyPostInteractionData(dailyPosts);
            } else {
              // For regular posts, use the existing refresh function
              refreshPostInteractionData(selectedPostForComment.id);
            }
          }
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setNewlyCreatedGoalId(null); // Clear the pre-selected goal
        }}
        onPostCreated={() => {
          setShowCreatePostModal(false);
          setNewlyCreatedGoalId(null); // Clear the pre-selected goal
          loadExploreGoals(); // Reload goals and posts after creating post
        }}
        userGoals={exploreGoals.filter(goal => !goal.completed)}
        preSelectedGoal={newlyCreatedGoalId || undefined}
      />

      {/* New Goal Modal */}
      <NewGoalModal
        visible={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onGoalCreated={(goalId) => {
          setNewlyCreatedGoalId(goalId);
          setShowNewGoalModal(false);
          // Open CreatePostModal with the new goal pre-selected
          setShowCreatePostModal(true);
        }}
      />

      {/* Action Modal - Create Goal or Update Daily Post */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.actionModal, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                <Text style={[styles.actionModalTitle, { color: theme.textPrimary }]}>
                  What would you like to do?
                </Text>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowActionModal(false);
                    setShowNewGoalModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Create Goal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowActionModal(false);
                    setShowCreatePostModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Update Daily Post</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor: theme.borderSecondary }]}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full Screen Photo Modal */}
      <FullScreenPhotoModal
        visible={showFullScreenModal}
        photos={fullScreenPhotos}
        initialIndex={fullScreenInitialIndex}
        onClose={() => setShowFullScreenModal(false)}
      />

    </SafeAreaView>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(HomeScreen);

// Explore Content Component


function ExploreContent({ 
  goals, 
  posts,
  dailyPosts,
  mergedFeed,
  loading, 
  theme, 
  goalInteractionData,
  onLikeChange,
  onCommentPress,
  onFollow,
  followingUsers,
  followingStatus,
  fetchFollowerCounts,
  user,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  postInteractionData,
  onPostLikeChange,
  onDailyPostLikeChange,
  onPostCommentPress,
  onDailyPostCommentPress,
  onPhotoPress,
  youMayLikeUsers,
}: { 
  goals: GoalWithUser[], 
  posts: PostWithUser[],
  dailyPosts: DailyPostWithUser[],
  mergedFeed: any[],
  loading: boolean, 
  theme: any,
  goalInteractionData: {[goalId: string]: { likes: number; comments: number; isLiked: boolean }},
  onLikeChange: (goalId: string, isLiked: boolean, newCount: number) => void,
  onCommentPress: (goalId: string) => void,
  onFollow: (userId: string) => void,
  followingUsers: Set<string>;
  followingStatus: Map<string, boolean>;
  fetchFollowerCounts: (users: Profile[]) => Promise<void>;
  user: any;
  currentPhotoIndex: {[postId: string]: number};
  setCurrentPhotoIndex: React.Dispatch<React.SetStateAction<{[postId: string]: number}>>;
  postInteractionData: {[postId: string]: { likes: number; comments: number; isLiked: boolean }};
  onPostLikeChange: (postId: string, isLiked: boolean, newCount: number) => void;
  onDailyPostLikeChange: (dailyPostId: string, isLiked: boolean, newCount: number) => void;
  onPostCommentPress: (postId: string) => void;
  onDailyPostCommentPress: (dailyPostId: string) => void;
  onPhotoPress: (photos: string[], initialIndex: number) => void;
  youMayLikeUsers: Profile[];
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
        {/* Spotlight Section */}
        <View style={styles.spotlightContainer}>
          <View style={styles.spotlightHeader}>
            <Text style={[styles.spotlightTitle, { color: theme.textPrimary }]}>
              Spotlight
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotlightList}
          >
            {youMayLikeUsers.slice(0, 8).map((profile) => (
              <TouchableOpacity 
                key={profile.id}
                style={styles.spotlightItem}
                onPress={() => {
                  // Navigate to spotlight view
                  console.log('View spotlight:', profile.username);
                }}
              >
                <View style={styles.spotlightRing}>
                  <View style={[styles.spotlightAvatar, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}>
                    {profile.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.spotlightImage} />
                    ) : (
                      <Text style={[styles.spotlightInitial, { color: theme.textPrimary }]}>
                        {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.spotlightUsername, { color: theme.textSecondary }]} numberOfLines={1}>
                  {profile.display_name || profile.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Activity Section */}
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
            Activity
          </Text>
        </View>
        
        <View style={[styles.section, { marginTop: 24 }]}>
          
          {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading goals & posts...</Text>
          </View>
        ) : mergedFeed.length > 0 ? (
          <View style={styles.cardsContainer}>
            {mergedFeed.map((item) => {
              if (item.type === 'goal') {
                const goal = item;
                return (
              <View key={goal.id} style={styles.goalCardContainer}>
                {/* Floating Profile Section */}
                <View style={styles.floatingProfileSection}>
                  <View style={styles.profileInfo}>
                    {goal.profiles?.avatar_url ? (
                      <Image 
                        source={{ uri: goal.profiles.avatar_url }} 
                        style={styles.floatingAvatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.floatingAvatarPlaceholder}>
                        <Text style={styles.floatingAvatarInitial}>
                          {goal.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.profileTextInfo}>
                      <View style={styles.usernameWithFollow}>
                        <Text style={styles.floatingUsername}>@{goal.profiles?.username || 'user'}</Text>
                        {goal.user_id !== user?.id && (
                          <TouchableOpacity 
                            onPress={() => onFollow(goal.profiles?.id || '')}
                            style={styles.followIconButton}
                          >
                            <Ionicons 
                              name={goal.profiles?.id && followingStatus.get(goal.profiles.id) ? 'checkmark' : 'add'} 
                              size={14} 
                              color="#FFFFFF" 
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.floatingTime}>
                        {formatLastUpdate(goal.last_updated_at, goal.created_at)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Mini Habit Icons - moved outside profileInfo */}
                  <View style={styles.miniHabitIcons}>
                    <Ionicons 
                      name="book-outline" 
                      size={12} 
                      color={false ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="leaf-outline" 
                      size={12} 
                      color={false ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="snow-outline" 
                      size={12} 
                      color={goal.dailyHabits?.cold_shower_completed ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="bulb-outline" 
                      size={12} 
                      color={goal.dailyHabits?.reflect_mood ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="water-outline" 
                      size={12} 
                      color={goal.dailyHabits?.water_intake ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="moon-outline" 
                      size={12} 
                      color={goal.dailyHabits?.sleep_hours ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="walk-outline" 
                      size={12} 
                      color={goal.dailyHabits?.run_day_type === 'active' ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                    <Ionicons 
                      name="barbell-outline" 
                      size={12} 
                      color={goal.dailyHabits?.gym_day_type === 'active' ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                  </View>
                </View>

                {/* Goal Card */}
                <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                  {/* Media Section */}
                  <View style={styles.mediaSection}>
                    {goal.media_url && goal.media_url !== 'no-photo' ? (
                      <Image 
                        source={{ uri: goal.media_url }} 
                        style={styles.goalUpdateMedia}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.noMediaContainer, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
                        <Ionicons name="camera-outline" size={32} color={theme.textSecondary} />
                        <Text style={[styles.noMediaText, { color: theme.textSecondary }]}>
                          No progress photos yet
                        </Text>
                        <Text style={[styles.noMediaSubtext, { color: theme.textTertiary }]}>
                          Check in to share your journey
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Content Section */}
                  <View style={styles.contentSection}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
                        {goal.title}
                      </Text>
                      
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
                    
                    <View style={styles.goalStats}>
                    </View>
                  </View>
                </View>
              </View>
            );
              } else if (item.type === 'post') {
                const post = item;
                return (
                  <View key={post.id} style={styles.goalCardContainer}>
                    {/* Floating Profile Section */}
                    <View style={styles.floatingProfileSection}>
                      <View style={styles.profileInfo}>
                        {post.profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: post.profiles.avatar_url }} 
                            style={styles.floatingAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.floatingAvatarPlaceholder}>
                            <Text style={styles.floatingAvatarInitial}>
                              {post.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.profileTextInfo}>
                          <View style={styles.usernameWithFollow}>
                            <Text style={styles.floatingUsername}>@{post.profiles?.username || 'user'}</Text>
                            {post.user_id !== user?.id && (
                              <TouchableOpacity 
                                onPress={() => onFollow(post.profiles?.id || '')}
                                style={styles.followIconButton}
                              >
                                <Ionicons 
                                  name={post.profiles?.id && followingStatus.get(post.profiles.id) ? 'checkmark' : 'add'} 
                                  size={14} 
                                  color="#FFFFFF" 
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={styles.floatingTime}>
                            {formatLastUpdate(post.created_at, post.created_at)}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Mini Habit Icons - moved outside profileInfo */}
                      <View style={styles.miniHabitIcons}>
                        <Ionicons 
                          name="book-outline" 
                          size={12} 
                          color={post.habits_completed.includes('microlearn') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="leaf-outline" 
                          size={12} 
                          color={post.habits_completed.includes('meditation') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="snow-outline" 
                          size={12} 
                          color={post.habits_completed.includes('cold_shower') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="bulb-outline" 
                          size={12} 
                          color={post.habits_completed.includes('reflect') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="water-outline" 
                          size={12} 
                          color={post.habits_completed.includes('water') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="moon-outline" 
                          size={12} 
                          color={post.habits_completed.includes('sleep') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="walk-outline" 
                          size={12} 
                          color={post.habits_completed.includes('run') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="barbell-outline" 
                          size={12} 
                          color={post.habits_completed.includes('gym') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        {/* Football icon for goal progress */}
                        <Ionicons 
                          name="football-outline" 
                          size={12} 
                          color={post.goal_id ? '#ef4444' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                      </View>
                    </View>

                    {/* Post Card */}
                    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                      {/* Media Section */}
                      <View style={styles.mediaSection}>
                        {post.photos && post.photos.length > 0 ? (
                          <View>
                            <GesturePhotoCarousel
                              photos={post.photos}
                              currentIndex={currentPhotoIndex[post.id] || 0}
                              onIndexChange={(index) => {
                                setCurrentPhotoIndex(prev => ({
                                  ...prev,
                                  [post.id]: index
                                }));
                              }}
                              onPhotoPress={() => onPhotoPress(post.photos, currentPhotoIndex[post.id] || 0)}
                              style={styles.photoContainer}
                            />
                          </View>
                        ) : (
                          <View style={[styles.noMediaContainer, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
                            <Ionicons name="camera-outline" size={32} color={theme.textSecondary} />
                            <Text style={[styles.noMediaText, { color: theme.textSecondary }]}>
                              No photos
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Content Section */}
                      <View style={styles.contentSection}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
                            {post.caption ? post.caption.split(' | ')[currentPhotoIndex[post.id] || 0] || '' : ''}
                          </Text>
                          
                          {/* Post Interaction Bar */}
                          <PostInteractionBar
                            postId={post.id}
                            initialLikeCount={postInteractionData[post.id]?.likes || 0}
                            initialCommentCount={postInteractionData[post.id]?.comments || 0}
                            initialIsLiked={postInteractionData[post.id]?.isLiked || false}
                            onLikeChange={(isLiked, newCount) => onPostLikeChange(post.id, isLiked, newCount)}
                            onCommentPress={() => onPostCommentPress(post.id)}
                            size="medium"
                            showCounts={true}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              } else if (item.type === 'daily_post') {
                const dailyPost = item;
                return (
                  <View key={dailyPost.id} style={styles.goalCardContainer}>
                    {/* Floating Profile Section */}
                    <View style={styles.floatingProfileSection}>
                      <View style={styles.profileInfo}>
                        {dailyPost.profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: dailyPost.profiles.avatar_url }} 
                            style={styles.floatingAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.floatingAvatarPlaceholder}>
                            <Text style={styles.floatingAvatarInitial}>
                              {dailyPost.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.profileTextInfo}>
                          <View style={styles.usernameWithFollow}>
                            <Text style={styles.floatingUsername}>@{dailyPost.profiles?.username || 'user'}</Text>
                            {dailyPost.user_id !== user?.id && (
                              <TouchableOpacity 
                                onPress={() => onFollow(dailyPost.profiles?.id || '')}
                                style={styles.followIconButton}
                              >
                                <Ionicons 
                                  name={dailyPost.profiles?.id && followingStatus.get(dailyPost.profiles.id) ? 'checkmark' : 'add'} 
                                  size={14} 
                                  color="#FFFFFF" 
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={styles.floatingTime}>
                            {formatLastUpdate(dailyPost.updated_at, dailyPost.created_at)}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Mini Habit Icons */}
                      <View style={styles.miniHabitIcons}>
                        <Ionicons 
                          name="book-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('microlearn') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="leaf-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('meditation') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="snow-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('cold_shower') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="water-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('water') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="moon-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('sleep') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="walk-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('run') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="barbell-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('gym') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                        <Ionicons 
                          name="bulb-outline" 
                          size={12} 
                          color={dailyPost.habits_completed.includes('reflection') ? '#10B981' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                      </View>
                    </View>

                    {/* Main Content Area */}
                    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                      {/* Photo Gallery */}
                      {dailyPost.photos && dailyPost.photos.length > 0 && (
                        <View style={styles.postPhotoContainer}>
                          <GesturePhotoCarousel
                            photos={dailyPost.photos}
                            currentIndex={currentPhotoIndex[dailyPost.id] ?? 0}
                            onIndexChange={(index) => setCurrentPhotoIndex(prev => ({ ...prev, [dailyPost.id]: index }))}
                            onPhotoPress={() => onPhotoPress(dailyPost.photos, currentPhotoIndex[dailyPost.id] || 0)}
                          />
                        </View>
                      )}

                      {/* Content Section */}
                      <View style={styles.contentSection}>
                        {/* Caption and Interaction Bar - Same Line */}
                        <View style={styles.dailyPostRow}>
                          <View style={styles.dailyPostContent}>
                            {(() => {
                              const currentIndex = currentPhotoIndex[dailyPost.id] || 0;
                              const currentCaption = dailyPost.captions?.[currentIndex];
                              
                              // Only show caption if it exists and is not empty
                              if (currentCaption && currentCaption.trim() !== '') {
                                return (
                                  <Text style={styles.dailyPostTitle}>
                                    {currentCaption}
                                  </Text>
                                );
                              }
                              return null; // Don't render anything if no caption
                            })()}
                            <Text style={styles.dailyPostStats}>
                              {dailyPost.post_count} updates
                            </Text>
                          </View>
                          
                          {/* Interaction Bar - Right side, aligned with caption */}
                          <DailyPostInteractionBar
                            dailyPostId={dailyPost.id}
                            initialLikeCount={postInteractionData[dailyPost.id]?.likes || 0}
                            initialCommentCount={postInteractionData[dailyPost.id]?.comments || 0}
                            initialIsLiked={postInteractionData[dailyPost.id]?.isLiked || false}
                            onLikeChange={(isLiked, newCount) => onDailyPostLikeChange(dailyPost.id, isLiked, newCount)}
                            onCommentPress={() => onDailyPostCommentPress(dailyPost.id)}
                            size="medium"
                            showCounts={true}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }
              return null;
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              Discover Goals & Posts
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Find inspiring goals and posts from other users
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
                    {goal.media_url && goal.media_url !== 'no-photo' ? (
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  headerLeftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  spotlightContainer: {
    marginTop: 2,
    marginBottom: 20,
  },
  spotlightHeader: {
    paddingHorizontal: 30,
    marginBottom: 12,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  activityHeader: {
    paddingHorizontal: 30,
    marginTop: 0,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  spotlightList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  spotlightItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  spotlightRing: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  spotlightAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spotlightImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  spotlightInitial: {
    fontSize: 20,
    fontWeight: '600',
  },
  spotlightUsername: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 70,
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
  goalCardContainer: {
    position: 'relative',
    marginBottom: 24,
    marginTop: 10,
  },
  floatingProfileSection: {
    position: 'absolute',
    top: -15,
    left: 30,
    right: 30,
    zIndex: 10,
    borderRadius: 12,
    paddingLeft: 0,
    paddingRight: 0,
    paddingVertical: 0,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 0,
  },
  floatingAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  floatingAvatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileTextInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  floatingUsername: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  floatingTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  usernameWithFollow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followIconButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniHabitIcons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  card: {
    borderRadius: 12,
    paddingTop: Platform.OS === 'ios' ? 32 : 20,
  },
  mediaSection: {
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  noMediaContainer: {
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderStyle: 'dashed',
  },
  noMediaText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  noMediaSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  contentSection: {
    paddingHorizontal: 30,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
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
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 350,
    width: '100%',
    position: 'relative',
    borderWidth: 1,
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
    borderWidth: 1,
  },
  simpleCategoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  simpleCategoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff5a5f',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  createPostButton: {
    padding: 8,
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
  suggestedUsersSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  suggestedUsersHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.8,
  },
  suggestedUsersList: {
    paddingHorizontal: 4,
  },
  suggestedUserCard: {
    width: 280,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  suggestedUserContent: {
    padding: 16,
  },
  suggestedUserAvatar: {
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedUserImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  suggestedUserPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedUserInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  suggestedUserInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  suggestedUserHandle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestedUserBio: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  suggestedFollowButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  suggestedFollowButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
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
  photoDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  photoDot: {
    borderRadius: 4,
  },
  photoContainer: {
    position: 'relative',
  },
  // Daily Post Styles
  dailyPostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  dailyPostContent: {
    flex: 1,
    paddingRight: 12,
  },
  dailyPostTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  dailyPostStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  dailyPostInteraction: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  postPhotoContainer: {
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoCounter: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoCounterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  postContentContainer: {
    marginBottom: 12,
  },
  postContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 8,
  },
  postInteractionContainer: {
    marginTop: 12,
  },
  postInteractionBar: {
    alignItems: 'center',
  },
  // Action Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 