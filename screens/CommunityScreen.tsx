import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { Goal, DailyHabits } from '../types/database';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
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
import CoreHabitSheet from '../components/CoreHabitSheet';
import PostOptionsSheet, { PostOptionsAction } from '../components/PostOptionsSheet';
import GesturePhotoCarousel from '../components/GesturePhotoCarousel';
import FullScreenPhotoModal from '../components/FullScreenPhotoModal';
import { notificationService } from '../lib/notificationService';
import { goalInteractionsService } from '../lib/goalInteractions';
import { dailyPostInteractionsService } from '../lib/dailyPostInteractions';
import { formatLastUpdate } from '../lib/goalHelpers';
import { postsService } from '../lib/postsService';
import { dailyPostsService } from '../lib/dailyPostsService';
import { moderationService } from '../lib/moderationService';
import { moderationAlertMessage, uploadMediaSafely } from '../lib/safeMediaUpload';
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
  goal_title?: string | null;
  milestone_title?: string | null;
  challenge_id?: string;
  challenge_title?: string;
  date: string;
  photos: string[];
  habits_completed: string[];
  caption?: string;
  mood_rating: number;
  energy_level: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  dailyHabits?: DailyHabits;
  type: 'post'; // To distinguish from goals
  /** Origin table — daily_post rows use different like/comment tables */
  feedSource?: 'post' | 'daily_post';
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

interface CommunityScreenProps {
  navigation?: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

function CommunityScreen({ navigation }: CommunityScreenProps) {
  const FullScreenPhotoModalAny = FullScreenPhotoModal as any;
  const bottomNavPadding = useBottomNavPadding();
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
  
  const [followerCounts, setFollowerCounts] = useState<Map<string, number>>(new Map());
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [goalInteractionData, setGoalInteractionData] = useState<{[goalId: string]: { likes: number; comments: number; isLiked: boolean }}>({});
  const [postInteractionData, setPostInteractionData] = useState<{[postId: string]: { likes: number; comments: number; isLiked: boolean }}>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedGoalForComment, setSelectedGoalForComment] = useState<{id: string, title: string} | null>(null);
  const [postCommentModalVisible, setPostCommentModalVisible] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState<{id: string, title: string} | null>(null);
  const [allPosts, setAllPosts] = useState<PostWithUser[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{[postId: string]: number}>({});
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [fullScreenPhotos, setFullScreenPhotos] = useState<string[]>([]);
  const [fullScreenCaptions, setFullScreenCaptions] = useState<string[]>([]);
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
    } else {
      // Clear explore goals when user logs out
      setExploreGoals([]);
      setFilteredGoals([]);
    }
  }, [user, selectedCategory]);

  

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

  // Load tips/motivation posts
  useEffect(() => {
    if (user) {
      loadAllPosts();
    }
  }, [user]);

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

  const openUserProfile = useCallback((profile: Profile) => {
    if (!profile?.id || !navigation?.navigate) return;
    setShowSearchModal(false);
    navigation.navigate('UserProfile', {
      userId: profile.id,
      username: profile.username || profile.display_name || 'user',
    });
  }, [navigation]);

  const renderUser = useCallback(({ item }: { item: Profile }) => {
    const isFollowingUser = followingStatus.get(item.id) || false;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
        onPress={() => openUserProfile(item)}
        activeOpacity={0.7}
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
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleFollow(item.id);
                }}
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
  }, [followingStatus, followerCounts, theme, handleFollow, followingUsers, user, openUserProfile]);

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
          const { enrichProfilesWithAvatars } = await import('../lib/avatarUtils');
          const enrichedProfiles = await enrichProfilesWithAvatars(profiles || []);

          // Create a map of user ID to profile data
          const profileMap = new Map();
          enrichedProfiles.forEach(profile => {
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
          // Attach profile data to posts
          const postsWithProfiles = posts.map(post => ({
            ...post,
            profiles: profileMap.get(post.user_id),
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
        // Extract all unique dates from daily posts
        const uniqueDates = [...new Set(dailyPostsData.map(post => {
          const dateStr = post.date || post.created_at;
          return new Date(dateStr).toISOString().split('T')[0];
        }))];


        // Fetch daily_habits and user_points_daily in parallel
        const [
          { data: dailyHabitsData, error: habitsError },
          { data: userPointsData, error: pointsError }
        ] = await Promise.all([
          supabase
            .from('daily_habits')
            .select('*')
            .in('user_id', userIds)
            .in('date', uniqueDates),
          supabase
            .from('user_points_daily')
            .select('*')
            .in('user_id', userIds)
            .in('date', uniqueDates)
        ]);

        if (habitsError) console.error('Error fetching daily habits:', habitsError);
        if (pointsError) console.error('Error fetching user points:', pointsError);


        // Create maps for quick lookup: userId_date -> habitData
        const habitsMap = new Map<string, any>();
        dailyHabitsData?.forEach(habit => {
          const key = `${habit.user_id}_${habit.date}`;
          habitsMap.set(key, habit);
        });

        const pointsMap = new Map<string, any>();
        userPointsData?.forEach(point => {
          const key = `${point.user_id}_${point.date}`;
          pointsMap.set(key, point);
        });

        // Attach profile data and real-time habit data to daily posts
        const dailyPostsWithProfiles = dailyPostsData.map(dailyPost => {
          const dateStr = dailyPost.date || new Date(dailyPost.created_at).toISOString().split('T')[0];
          const key = `${dailyPost.user_id}_${dateStr}`;
          
          const habitData = habitsMap.get(key);
          const pointData = pointsMap.get(key);

          // Build real-time habits_completed array
          const realTimeHabits: string[] = [];
          
          if (habitData) {
            // Check each habit type
            if (habitData.sleep_quality || habitData.sleep_duration || habitData.sleep_hours) realTimeHabits.push('sleep');
            if (habitData.water_intake > 0) realTimeHabits.push('water');
            if (habitData.run_completed || habitData.run_distance || habitData.run_day_type || habitData.run_activity_type) realTimeHabits.push('run');
            if (habitData.gym_day_type === 'active' || (habitData.gym_training_types && habitData.gym_training_types.length > 0)) realTimeHabits.push('gym');
            if (habitData.reflect_completed || habitData.reflect_text) realTimeHabits.push('reflection');
            if (habitData.cold_shower_completed) realTimeHabits.push('cold_shower');
            if (habitData.focus_completed || habitData.focus_duration) realTimeHabits.push('focus');
          }

          if (pointData) {
            if (pointData.meditation_completed) realTimeHabits.push('meditation');
            if (pointData.microlearn_completed) realTimeHabits.push('microlearn');
            if (pointData.screen_time_completed) realTimeHabits.push('screen_time');
          }


          return {
            ...dailyPost,
            profiles: profileMap.get(dailyPost.user_id),
            type: 'daily_post' as const,
            habits_completed: realTimeHabits // Override with real-time data
          };
        });

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
      const { enrichProfilesWithAvatars } = await import('../lib/avatarUtils');
      const withAvatars = await enrichProfilesWithAvatars(suggested);
      setYouMayLikeUsers(withAvatars);
      // Fetch follower counts for suggested users
      if (withAvatars.length > 0) {
        await fetchFollowerCounts(withAvatars);
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

  // Handle daily post like changes
  const handleDailyPostLikeChange = async (dailyPostId: string, isLiked: boolean, newCount: number) => {
    if (!user) return;

    // Optimistically update local state immediately so props stay in sync with the button
    setPostInteractionData(prev => ({
      ...prev,
      [dailyPostId]: {
        ...prev[dailyPostId],
        likes: newCount,
        isLiked,
      }
    }));

    try {
      await dailyPostInteractionsService.toggleDailyPostLike(dailyPostId);
    } catch (error) {
      console.error('Error handling daily post like change:', error);
      // Revert on failure
      setPostInteractionData(prev => ({
        ...prev,
        [dailyPostId]: {
          ...prev[dailyPostId],
          likes: isLiked ? newCount - 1 : newCount + 1,
          isLiked: !isLiked,
        }
      }));
    }
  };

  const handlePostCommentPress = (postId: string) => {
    const post =
      allPosts.find((p) => p.id === postId) ||
      explorePosts.find((p) => p.id === postId);
    if (!post) return;

    setSelectedPostForComment({
      id: postId,
      title: post.feedSource === 'daily_post' ? 'Daily Post' : post.content || 'Post',
    });
    setPostCommentModalVisible(true);
  };

  const handleDailyPostCommentPress = (dailyPostId: string) => {
    const dailyPost = dailyPosts.find(dp => dp.id === dailyPostId);
    if (!dailyPost) return;
    
    setSelectedPostForComment({ id: dailyPostId, title: 'Daily Post' });
    setPostCommentModalVisible(true);
  };

  const handlePhotoPress = (photos: string[], initialIndex: number, captions: string[] = []) => {
    setFullScreenPhotos(photos);
    setFullScreenCaptions(captions);
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
      await loadAllPosts();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const loadAllPosts = async () => {
    if (!user) return;

    setLoadingPosts(true);
    try {
      const isRemotePhoto = (uri: string) => /^https?:\/\//i.test(uri || '');

      // Remote URLs for everyone; keep local file:// only for the current user's device
      const displayPhotos = (photos: string[] | null | undefined, ownerId: string) => {
        const list = photos || [];
        const remote = list.filter(isRemotePhoto);
        if (remote.length > 0) return remote;
        if (ownerId === user.id) return list.filter(Boolean);
        return [];
      };

      // Tips feed used to read only `posts`, but most shared photos live in `daily_posts`.
      const [posts, dailyPostsRes] = await Promise.all([
        postsService.getAllPublicPosts(50),
        supabase
          .from('daily_posts')
          .select('*')
          .eq('hidden_from_feed', false)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (dailyPostsRes.error) {
        console.error('Error fetching daily posts for community feed:', dailyPostsRes.error);
      }

      const dailyPostsData = dailyPostsRes.data || [];
      const dailyById = new Map(dailyPostsData.map((d: any) => [d.id, d]));
      const coveredDailyIds = new Set<string>();

      const blockedIds = new Set(await moderationService.getBlockedUserIds(user.id));
      const isBlockedAuthor = (userId: string) => blockedIds.has(userId);

      const normalizedPosts = posts.map((post: any) => {
        let photos = displayPhotos(post.photos, post.user_id);
        // Prefer remote photos from linked daily_post when the post row still has local URIs
        if (!photos.some(isRemotePhoto) && post.daily_post_id && dailyById.has(post.daily_post_id)) {
          const fromDaily = displayPhotos(dailyById.get(post.daily_post_id).photos, post.user_id);
          if (fromDaily.length > 0) photos = fromDaily;
        }
        if (post.daily_post_id) coveredDailyIds.add(post.daily_post_id);
        return {
          ...post,
          content: post.content || post.caption || '',
          photos,
          type: 'post' as const,
          feedSource: 'post' as const,
        };
      });

      const dailyAsPosts = dailyPostsData
        .filter((d: any) => !coveredDailyIds.has(d.id))
        .map((d: any) => {
          const photos = displayPhotos(d.photos, d.user_id);
          const content = (d.captions && d.captions[0]) || '';
          if (photos.length === 0 && !content.trim()) return null;
          return {
            id: d.id,
            user_id: d.user_id,
            content,
            date: d.date,
            photos,
            habits_completed: d.habits_completed || [],
            caption: content,
            mood_rating: 0,
            energy_level: 0,
            is_public: true,
            created_at: d.created_at,
            updated_at: d.updated_at,
            type: 'post' as const,
            feedSource: 'daily_post' as const,
          };
        })
        .filter(Boolean) as PostWithUser[];

      const merged = [...normalizedPosts, ...dailyAsPosts]
        .filter((p: any) => !isBlockedAuthor(p.user_id))
        .sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      if (merged.length === 0) {
        setAllPosts([]);
        return;
      }

      const userIds = [...new Set(merged.map((post: any) => post.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      let postsWithProfiles: PostWithUser[];
      if (profilesError) {
        console.error('Error fetching profiles for posts:', profilesError);
        postsWithProfiles = merged as PostWithUser[];
      } else {
        const { enrichProfilesWithAvatars } = await import('../lib/avatarUtils');
        const enrichedProfiles = await enrichProfilesWithAvatars(profiles || []);
        const profileMap = new Map();
        enrichedProfiles.forEach((profile: any) => {
          profileMap.set(profile.id, profile);
        });

        postsWithProfiles = merged.map((post: any) => ({
          ...post,
          profiles: profileMap.get(post.user_id),
          type: 'post' as const,
        })) as PostWithUser[];
      }

      setAllPosts(postsWithProfiles);

      // Never clear the feed if interaction counts fail
      try {
        const regularPosts = postsWithProfiles.filter((p) => p.feedSource !== 'daily_post');
        const dailyFeedPosts = postsWithProfiles.filter((p) => p.feedSource === 'daily_post');
        await Promise.all([
          regularPosts.length ? loadPostInteractionData(regularPosts) : Promise.resolve(),
          dailyFeedPosts.length
            ? loadDailyPostInteractionData(dailyFeedPosts as unknown as DailyPostWithUser[])
            : Promise.resolve(),
        ]);
      } catch (interactionError) {
        console.error('Error loading community interaction data:', interactionError);
      }
    } catch (error) {
      console.error('Error loading all posts:', error);
      setAllPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Modern Header Design */}
      <View style={styles.header}>
        {/* Left spacer to keep title centered */}
        <View style={styles.headerLeftButtons}>
          <View style={{ width: 24 }} />
        </View>

        {/* Center title */}
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Community</Text>

        {/* Right side buttons */}
        <View style={styles.headerActionButtons}>
          <TouchableOpacity 
            onPress={() => setShowSearchModal(true)}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="search-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowActionModal(true)}
          >
            <Ionicons name="add" size={24} color={theme.textPrimary} />
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
                          onPress={() => openUserProfile(user)}
                          activeOpacity={0.7}
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



      {/* Tips & motivation feed */}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <PostFeedContent 
            theme={theme} 
            posts={allPosts}
            loading={loadingPosts}
            postInteractionData={postInteractionData}
            onLikeChange={handlePostLikeChange}
            onCommentPress={handlePostCommentPress}
            user={user}
            onPostCreated={loadAllPosts}
          />
        </ScrollView>
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

      {/* Action sheet — fade dim + slide sheet */}
      <CoreHabitSheet
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title="What would you like to do?"
        subtitle="Choose an action to continue"
        fitContent
      >
        <TouchableOpacity
          style={styles.actionOption}
          onPress={() => {
            setShowActionModal(false);
            navigation?.navigate('CreateGoal');
          }}
          activeOpacity={0.85}
        >
          <View style={styles.actionOptionIcon}>
            <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.actionOptionTextCol}>
            <Text style={styles.actionOptionTitle}>Create Goal</Text>
            <Text style={styles.actionOptionDesc}>Set a new goal to track</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionOption}
          onPress={() => {
            setShowActionModal(false);
            (navigation as any)?.navigate?.('UpdateGoal');
          }}
          activeOpacity={0.85}
        >
          <View style={styles.actionOptionIcon}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.actionOptionTextCol}>
            <Text style={styles.actionOptionTitle}>Update Goal</Text>
            <Text style={styles.actionOptionDesc}>Post progress on a goal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </CoreHabitSheet>

      {/* Full Screen Photo Modal */}
      <FullScreenPhotoModalAny
        visible={showFullScreenModal}
        photos={fullScreenPhotos}
        captions={fullScreenCaptions}
        initialIndex={fullScreenInitialIndex}
        onClose={() => setShowFullScreenModal(false)}
      />

    </SafeAreaView>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(CommunityScreen);

// Post Feed Content Component
function PostFeedContent({ 
  theme, 
  posts, 
  loading,
  postInteractionData,
  onLikeChange,
  onCommentPress,
  user,
  onPostCreated
}: { 
  theme: any; 
  posts: PostWithUser[]; 
  loading: boolean;
  postInteractionData: {[postId: string]: { likes: number; comments: number; isLiked: boolean }};
  onLikeChange: (postId: string, isLiked: boolean, newCount: number) => void;
  onCommentPress: (postId: string) => void;
  user: any;
  onPostCreated: () => void;
}) {
  const [postContent, setPostContent] = useState('');
  const [postPhoto, setPostPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionsPost, setOptionsPost] = useState<PostWithUser | null>(null);
  const optionsPostRef = useRef<PostWithUser | null>(null);

  const openPostOptions = (post: PostWithUser) => {
    optionsPostRef.current = post;
    setOptionsPost(post);
  };

  const closePostOptions = () => {
    setOptionsPost(null);
  };

  const handlePostOptionsAction = async (action: PostOptionsAction) => {
    const post = optionsPostRef.current;
    if (!user?.id || !post) return;

    const postSource = post.feedSource === 'daily_post' ? 'daily_posts' : 'posts';
    optionsPostRef.current = null;
    setOptionsPost(null);

    try {
      if (action === 'report_photo') {
        await moderationService.reportContent({
          reporterId: user.id,
          reportedUserId: post.user_id,
          postId: post.id,
          postSource,
          reason: 'inappropriate_photo',
        });
        Alert.alert('Thanks', 'Photo reported. We’ll review it.');
        return;
      }

      if (action === 'flag_user') {
        await moderationService.reportContent({
          reporterId: user.id,
          reportedUserId: post.user_id,
          postId: post.id,
          postSource,
          reason: 'inappropriate_content',
        });
        Alert.alert('Thanks', 'User flagged. We’ll review this content.');
        return;
      }

      if (action === 'block_account') {
        if (post.user_id === user.id) {
          Alert.alert('Not available', 'You can’t block your own account.');
          return;
        }
        Alert.alert(
          'Block this account?',
          'You won’t see their posts in your feed anymore.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                try {
                  await moderationService.blockUser(user.id, post.user_id);
                  Alert.alert('Blocked', 'This account has been blocked.');
                  onPostCreated();
                } catch (error: any) {
                  Alert.alert('Error', error?.message || 'Could not block this account.');
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleSelectPhoto = async () => {
    const { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } = await import('expo-image-picker');
    
    const { status } = await requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPostPhoto(result.assets[0].uri);
    }
  };

  const uploadCommunityPhoto = async (uri: string): Promise<string | null> => {
    if (!user?.id) return null;

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    const filePath = `${user.id}/posts/${uniqueFileName}`;

    return uploadMediaSafely({
      uri,
      path: filePath,
      contentType: 'image/jpeg',
      fileName: uniqueFileName,
      mediaType: 'image',
    });
  };

  const handleSubmitPost = async () => {
    if (!postContent.trim() && !postPhoto) {
      Alert.alert('Empty post', 'Please add some content or a photo');
      return;
    }

    setIsSubmitting(true);
    try {
      let photos: string[] = [];
      if (postPhoto) {
        const uploadedUrl = await uploadCommunityPhoto(postPhoto);
        if (!uploadedUrl) {
          Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
          return;
        }
        photos = [uploadedUrl];
      }

      const today = new Date().toISOString().split('T')[0];
      const postData = {
        content: postContent,
        date: today,
        photos,
        caption: postContent,
        is_public: true,
        habits_completed: []
      };

      const result = await postsService.createPost(postData);
      if (result) {
        setPostContent('');
        setPostPhoto(null);
        Alert.alert('Success', 'Post created!');
        onPostCreated();
      } else {
        Alert.alert('Error', 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Upload blocked', moderationAlertMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.content}>
      {/* Post Creation Box */}
      <View style={styles.createPostContainer}>
        <TextInput
          style={[styles.postInputSimple, { 
            color: '#1f2937', 
            backgroundColor: '#F9FAFB',
            borderColor: '#E5E7EB' 
          }]}
          placeholder="Share tips, tricks and motivation!"
          placeholderTextColor="#9CA3AF"
          value={postContent}
          onChangeText={setPostContent}
          autoCapitalize="sentences"
          autoCorrect={true}
          multiline
          scrollEnabled
          textAlignVertical="center"
        />

        <View style={styles.postActionsRow}>
          <TouchableOpacity 
            onPress={handleSelectPhoto}
            style={styles.iconButton}
          >
            <Ionicons name="image-outline" size={24} color={postPhoto ? '#1f2937' : '#6B7280'} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSubmitPost}
            style={[
              styles.sendButton,
              (!postContent.trim() && !postPhoto) && styles.sendButtonDisabled,
            ]}
            disabled={isSubmitting || (!postContent.trim() && !postPhoto)}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {postPhoto && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: postPhoto }} style={styles.photoPreviewImage} />
            <TouchableOpacity 
              onPress={() => setPostPhoto(null)}
              style={styles.removePhotoButton}
            >
              <Ionicons name="close-circle" size={24} color={theme.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Posts List */}
      <View style={styles.section}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading posts...</Text>
          </View>
        ) : posts.length > 0 ? (
          <View style={styles.cardsContainer}>
            {posts.map((post) => (
              <View key={post.id} style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
                {/* Post Header - User Info */}
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    {post.profiles?.avatar_url ? (
                      <Image 
                        source={{ uri: post.profiles.avatar_url }} 
                        style={styles.avatarPlaceholder}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '40' }]}>
                        <Text style={[styles.avatarInitial, { color: theme.primary }]}>
                          {post.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.userInfoText}>
                      <Text style={[styles.userHandle, { color: theme.textPrimary }]}>
                        @{post.profiles?.username || 'user'}
                      </Text>
                      <Text style={[styles.postTime, { color: theme.textSecondary }]}>
                        {formatLastUpdate(post.updated_at ?? post.created_at, post.created_at)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.postMoreButton}
                    onPress={() => openPostOptions(post)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {!!post.challenge_title && (
                  <Text style={styles.challengePostLabel}>
                    Posted in {post.challenge_title} challenge
                  </Text>
                )}

                {(!!post.milestone_title || !!post.goal_title) && (
                  <View style={styles.goalMetaRow}>
                    {!!post.goal_title && (
                      <Text style={styles.goalMetaLabel} numberOfLines={1}>
                        Goal · {post.goal_title}
                      </Text>
                    )}
                    {!!post.milestone_title && (
                      <Text style={styles.milestoneMetaLabel} numberOfLines={2}>
                        Milestone · {post.milestone_title}
                      </Text>
                    )}
                  </View>
                )}

                {/* Post Content */}
                {!!(post.content || post.caption)?.trim() && (
                  <Text style={[styles.postBodyText, { color: theme.textPrimary }]}>
                    {(post.content || post.caption || '').trim()}
                  </Text>
                )}

                {/* Post Photo — remote for everyone; local file:// only works on the uploader's device */}
                {(() => {
                  const photos = post.photos || [];
                  const remotePhoto = photos.find((uri) => /^https?:\/\//i.test(uri || ''));
                  const localPhoto =
                    !remotePhoto && post.user_id === user?.id
                      ? photos.find((uri) => !!uri)
                      : null;
                  const photoUri = remotePhoto || localPhoto;
                  if (!photoUri) return null;
                  return (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.postImage}
                      contentFit="cover"
                    />
                  );
                })()}

                {/* Post Interaction Bar */}
                <View style={styles.interactionBarContainer}>
                  {post.feedSource === 'daily_post' ? (
                    <DailyPostInteractionBar
                      dailyPostId={post.id}
                      initialLikeCount={postInteractionData[post.id]?.likes || 0}
                      initialCommentCount={postInteractionData[post.id]?.comments || 0}
                      initialIsLiked={postInteractionData[post.id]?.isLiked || false}
                      onLikeChange={(isLiked, newCount) => onLikeChange(post.id, isLiked, newCount)}
                      onCommentPress={() => onCommentPress(post.id)}
                      size="medium"
                      showCounts={true}
                    />
                  ) : (
                    <PostInteractionBar
                      postId={post.id}
                      initialLikeCount={postInteractionData[post.id]?.likes || 0}
                      initialCommentCount={postInteractionData[post.id]?.comments || 0}
                      initialIsLiked={postInteractionData[post.id]?.isLiked || false}
                      onLikeChange={(isLiked, newCount) => onLikeChange(post.id, isLiked, newCount)}
                      onCommentPress={() => onCommentPress(post.id)}
                      size="medium"
                      showCounts={true}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No posts yet</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Be the first to share something!
            </Text>
          </View>
        )}
      </View>

      <PostOptionsSheet
        visible={!!optionsPost}
        onClose={closePostOptions}
        onAction={handlePostOptionsAction}
      />
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
    paddingBottom: 80,
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
    top: '50%',
    transform: [{ translateY: -8 }],
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
  spotlightHeader: {
    paddingHorizontal: 30,
    marginTop: 0,
    marginBottom: 3,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  spotlightContainer: {
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    marginTop: 6,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statBlockFirst: {
    borderRightWidth: 1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '400',
    textAlign: 'center',
  },
  activityHeader: {
    paddingHorizontal: 30,
    marginTop: 0,
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    gap: 4,
  },
  goalCardContainer: {
    position: 'relative',
    marginBottom: 4,
    marginTop: 4,
  },
  profileSection: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  profileSectionCollapsed: {
    marginBottom: 0,
  },
  activitySection: {
    marginTop: 12,
    paddingTop: 12,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
  },
  uploadsSection: {
    marginTop: 4,
  },
  uploadsLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  captionSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
    marginBottom: 12,
  },
  interactionBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCarouselWrapper: {
    marginLeft: 0,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  smallAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  floatingProfileSection: {
    position: 'absolute',
    top: -15,
    left: 30,
    right: 30,
    zIndex: 10,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 6,
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
    width: 45,
    height: 45,
    borderRadius: 10,
    marginLeft: 0,
  },
  floatingAvatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  floatingAvatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  profileTextInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  floatingUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  floatingTime: {
    fontSize: 10,
    fontWeight: '400',
  },
  usernameWithFollow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    width: '100%',
  },
  usernameLeftGroup: {
    flexShrink: 1,
    marginRight: 8,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
    marginBottom: 4,
    width: '100%',
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
    paddingHorizontal: 0,
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postMoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 21,
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
    fontSize: 23,
    fontWeight: '700',
    color: '#1f2937',
  },
  goalDescription: {
    fontSize: 18,
    color: '#6b7280',
    lineHeight: 26,
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
    marginBottom: 4,
    textAlign: 'center',
  },
  dailyPostStats: {
    fontSize: 12,
    fontWeight: '500',
  },
  dailyPostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsToggleButton: {
    marginLeft: 'auto',
    padding: 2,
  },
  dailyPostCardCollapsed: {
    paddingBottom: 14,
  },
  activitiesTriggerWrap: {
    position: 'relative',
  },
  activitiesDropdown: {
    position: 'absolute',
    top: 18,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    zIndex: 20,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  activitiesDropdownItem: {
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 2,
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
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 26,
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  actionModalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 16,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'left',
  },
  actionModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  actionOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionOptionTextCol: {
    flex: 1,
  },
  actionOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  actionOptionDesc: {
    fontSize: 13,
    color: '#6B7280',
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
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  createPostContainer: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  postInputSimple: {
    width: '100%',
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    lineHeight: 21,
    borderWidth: 1,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  iconButton: {
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  photoPreview: {
    marginTop: 12,
    position: 'relative',
  },
  photoPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  postBodyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  challengePostLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  goalMetaRow: {
    marginBottom: 10,
    gap: 4,
  },
  goalMetaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  milestoneMetaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  postTime: {
    fontSize: 10,
  },
}); 