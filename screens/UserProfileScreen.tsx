import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useSocialStore } from '../state/socialStore';
import { useGoalsStore } from '../state/goalsStore';
import { useActionStore } from '../state/actionStore';
import { socialService, Profile } from '../lib/socialService';
import { pointsService } from '../lib/pointsService';
import { progressService } from '../lib/progressService';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { calculateCompletionPercentage } from '../lib/goalHelpers';
import { dmService } from '../lib/dmService';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import JourneyPreview from '../components/JourneyPreview';
import FullJourneyModal from '../components/FullJourneyModal';
import LevelInfoModal from '../components/LevelInfoModal';
import AchievementModal from '../components/AchievementModal';
import FullScreenPhotoModal from '../components/FullScreenPhotoModal';
import AchievementBadge from '../components/AchievementBadge';
import {
  achievementsService,
  BadgeWithStatus,
  TOTAL_ACHIEVEMENTS,
} from '../lib/achievementsService';
import { sortAchievementsHardestFirst } from '../lib/achievementDefinitions';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type UserProfileStackParamList = {
  UserProfile: { userId: string; username: string };
  Followers: { userId: string; username: string; initialTab?: 'followers' | 'following' };
  ChatWindow: { chatId: string; otherUserId: string; otherUserName: string; otherUserAvatar?: string };
  Achievements: { userId?: string };
};

type Props = NativeStackScreenProps<UserProfileStackParamList, 'UserProfile'>;

export default function UserProfileScreen({ navigation, route }: Props) {
  const { userId, username } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const { followUser, unfollowUser, isLoading } = useSocialStore();
  const { goals: userGoals, fetchGoals, loading: goalsLoading } = useGoalsStore();
  const { segmentChecked, getActiveSegmentCount } = useActionStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // New state for expanded profile features
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [levelProgress, setLevelProgress] = useState({ 
    currentLevel: 1, 
    nextLevel: 2, 
    segmentsFilled: 0,
    pointsInCurrentLevel: 0,
    pointsNeededForNext: 4000
  });
  const [goalProgress, setGoalProgress] = useState<{[goalId: string]: number}>({});
  const [showFullJourney, setShowFullJourney] = useState(false);
  const [viewedUserCoreHabits, setViewedUserCoreHabits] = useState<boolean[]>([false, false, false, false, false]);
  const [viewedUserGoals, setViewedUserGoals] = useState<any[]>([]);
  const [viewedUserDailyHabits, setViewedUserDailyHabits] = useState<boolean[]>([false, false, false, false, false, false, false, false]);
  const [statsVisible, setStatsVisible] = useState(true); // Whether the user has made their stats visible
  
  // New state for Activity, Highlights, Pillar Progress, and Modals
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [badgeAchievements, setBadgeAchievements] = useState<BadgeWithStatus[]>([]);
  const [badgeUnlockedCount, setBadgeUnlockedCount] = useState(0);
  const [pillarProgress, setPillarProgress] = useState({
    strength_fitness: 35,
    growth_wisdom: 35,
    discipline: 35,
    team_spirit: 35,
    overall: 35
  });
  const [challengeStats, setChallengeStats] = useState({
    wins: 0,
    losses: 0
  });
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  const profileCardAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
    loadUserData();
    loadPillarProgress();
    fetchRecentActivity();
    fetchHighlights();
    fetchBadgeAchievements();
    loadChallengeStats();
  }, [userId]);

  const fetchBadgeAchievements = async () => {
    try {
      const list = await achievementsService.getBadgesWithStatus(userId);
      setBadgeAchievements(list);
      setBadgeUnlockedCount(list.filter((b) => b.unlocked).length);
    } catch (e) {
      console.warn('fetchBadgeAchievements:', e);
    }
  };

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profileData = await socialService.getProfile(userId);
      setProfile(profileData);
      
      // Load stats visibility preference
      try {
        const { data: profileSettings, error: statsError } = await supabase
          .from('profiles')
          .select('stats_visible')
          .eq('id', userId)
          .single();
        
        if (!statsError && profileSettings && profileSettings.stats_visible !== undefined) {
          setStatsVisible(profileSettings.stats_visible);
        } else {
          // Default to visible if column doesn't exist or error occurs
          setStatsVisible(true);
        }
      } catch (err) {
        console.log('Stats visibility column may not exist yet, defaulting to visible');
        setStatsVisible(true);
      }

      if (user && profileData) {
        // Check if current user is following this profile
        const followingStatus = await socialService.isFollowing(user.id, userId);
        setIsFollowing(followingStatus);

        // Get follower/following counts
        const followers = await socialService.getFollowerCount(userId);
        const following = await socialService.getFollowingCount(userId);
        setFollowerCount(followers);
        setFollowingCount(following);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Fetch goals for the viewed user
      await loadViewedUserGoals();
      
      // Fetch total points
      const total = await pointsService.getTotalPoints(userId);
      setTotalPoints(total);
      
      // Get level progress
      const progress = pointsService.getLevelProgress(total);
      setLevelProgress({ ...progress, segmentsFilled: 0 });
      setCurrentLevel(progress.currentLevel);
      
      // Load core habits status for the viewed user
      await loadViewedUserCoreHabits();
      
      // Load daily habits status for the viewed user
      await loadViewedUserDailyHabits();
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPillarProgress = async () => {
    try {
      const { pillarProgressService } = await import('../lib/pillarProgressService');
      const progress = await pillarProgressService.getPillarProgress(userId);
      setPillarProgress(progress);
    } catch (error) {
      console.error('Error loading pillar progress:', error);
      // Set default values if there's an error (e.g., permission issues)
      setPillarProgress({
        strength_fitness: 35,
        growth_wisdom: 35,
        discipline: 35,
        team_spirit: 35,
        overall: 35
      });
    }
  };

  const loadChallengeStats = async () => {
    try {
      const { data: participations, error } = await supabase
        .from('challenge_participants')
        .select('status, challenge_id')
        .eq('user_id', userId);
      
      if (error) {
        return;
      }
      
      if (!participations || participations.length === 0) {
        setChallengeStats({ wins: 0, losses: 0 });
        return;
      }
      
      const challengeIds = participations.map(p => p.challenge_id);
      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, end_date, status')
        .in('id', challengeIds);
      
      const challengeMap = new Map(challenges?.map(c => [c.id, c]) || []);
      const now = new Date();
      
      let wins = 0;
      let losses = 0;
      
      participations.forEach(participation => {
        const challenge = challengeMap.get(participation.challenge_id);
        if (!challenge) return;
        
        const endDate = new Date(challenge.end_date);
        endDate.setHours(23, 59, 59, 999);
        const hasEnded = now > endDate;
        
        if (participation.status === 'completed') {
          wins++;
        } else if (hasEnded && participation.status !== 'completed') {
          losses++;
        }
      });
      
      setChallengeStats({ wins, losses });
    } catch (error) {
      console.error('Error loading challenge stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const startOfDay = new Date(year, today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1).toISOString();

      const activityItems: any[] = [];

      // Fetch Daily Habits
      const { data: habits } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();

      const { data: userPoints } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();

      if (habits || userPoints) {
        const habitsTimestamp = habits?.updated_at || habits?.created_at;
        const pointsTimestamp = userPoints?.updated_at || userPoints?.created_at;
        const hTime = habitsTimestamp || new Date().toISOString();
        const pTime = pointsTimestamp || new Date().toISOString();
        
        if (habits?.sleep_hours > 0) {
          activityItems.push({ type: 'habit', label: 'Sleep', icon: 'bed', iconType: 'fa5', color: '#34D399', timestamp: hTime });
        }
        if (habits?.cold_shower_completed) {
          activityItems.push({ type: 'habit', label: 'Cold Shower', icon: 'shower', iconType: 'fa5', color: '#7DD3FC', timestamp: hTime });
        }
        if ((habits?.meditation_minutes && habits.meditation_minutes > 0) || userPoints?.meditation_completed) {
          activityItems.push({ type: 'habit', label: 'Meditate', icon: 'spa', iconType: 'fa5', color: '#2DD4BF', timestamp: pointsTimestamp || hTime });
        }
        if (userPoints?.microlearn_completed) {
          activityItems.push({ type: 'habit', label: 'Microlearn', icon: 'book-reader', iconType: 'fa5', color: '#FB7185', timestamp: pTime });
        }
        if (habits?.water_intake > 0) {
          activityItems.push({ type: 'habit', label: 'Water', icon: 'water', color: '#60A5FA', timestamp: hTime });
        }
        if (habits?.run_day_type === 'active') {
          activityItems.push({ type: 'habit', label: 'Run', icon: 'running', iconType: 'fa5', color: '#FFEB3B', timestamp: hTime });
        }
        if (habits?.gym_day_type === 'active') {
          activityItems.push({ type: 'habit', label: 'Gym', icon: 'dumbbell', iconType: 'fa5', color: '#EF4444', timestamp: hTime });
        }
        if (habits?.reflect_mood) {
          activityItems.push({ type: 'habit', label: 'Reflect', icon: 'journal-whills', iconType: 'fa5', color: '#F59E0B', timestamp: hTime });
        }
      }

      // Fetch Goal Check-ins
      const { data: checkIns } = await supabase
        .from('progress_photos')
        .select('goal_id, check_in_date, created_at')
        .eq('user_id', userId)
        .gte('check_in_date', startOfDay.split('T')[0])
        .order('created_at', { ascending: false });

      if (checkIns && checkIns.length > 0) {
        checkIns.forEach((checkIn: any) => {
          const goal = viewedUserGoals.find(g => g.id === checkIn.goal_id);
          if (goal) {
            activityItems.push({ 
              type: 'goal', 
              label: goal.title, 
              icon: 'flag', 
              color: '#EF4444',
              timestamp: checkIn.created_at || (checkIn.check_in_date ? new Date(checkIn.check_in_date).toISOString() : new Date().toISOString())
            });
          }
        });
      }

      // Fetch Challenge Submissions
      const { data: submissions } = await supabase
        .from('challenge_submissions')
        .select(`
          id,
          created_at,
          challenge:challenges (title)
        `)
        .eq('user_id', userId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (submissions && submissions.length > 0) {
        submissions.forEach((sub: any) => {
          const title = (sub.challenge as any)?.title || 'Challenge';
          activityItems.push({
            type: 'challenge',
            label: title,
            icon: 'trophy',
            color: '#F97316',
            timestamp: sub.created_at || new Date().toISOString()
          });
        });
      }

      activityItems.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      });

      setRecentActivity(activityItems);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return;
      }

      setHighlights(data || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const loadViewedUserCoreHabits = async () => {
    try {
      // Fetch real core habits status for the viewed user
      const status = await pointsService.getCoreHabitsStatus(userId);
      setViewedUserCoreHabits([
        status.liked,
        status.commented,
        status.shared,
        status.updatedGoal,
        status.bonus
      ]);
    } catch (error) {
      console.error('Error loading core habits:', error);
      setViewedUserCoreHabits([false, false, false, false, false]);
    }
  };

  const loadViewedUserDailyHabits = async () => {
    try {
      // Fetch daily habits for the viewed user
      const dailyHabits = await dailyHabitsService.getDailyHabits(userId, new Date().toISOString().split('T')[0]);
      
      if (dailyHabits) {
        const h = dailyHabits as any;
        // Map the daily habits to boolean array for the green progress bar
        setViewedUserDailyHabits([
          h.meditation_completed || false,
          h.microlearn_completed || false,
          !!h.gym_day_type,
          !!h.run_day_type,
          h.screen_time_completed || false,
          !!h.water_intake,
          dailyHabits.focus_completed || false,
          h.update_goal_completed || false
        ]);
      } else {
        setViewedUserDailyHabits([false, false, false, false, false, false, false, false]);
      }
    } catch (error) {
      console.error('Error loading daily habits:', error);
      setViewedUserDailyHabits([false, false, false, false, false, false, false, false]);
    }
  };

  const loadViewedUserGoals = async () => {
    try {
      // Fetch goals for the viewed user using the goals store
      await fetchGoals(userId);
      setViewedUserGoals(userGoals || []);
    } catch (error) {
      console.error('Error loading viewed user goals:', error);
      setViewedUserGoals([]);
    }
  };

  // Fetch goal progress when goals are loaded
  useEffect(() => {
    if (viewedUserGoals.length > 0) {
      fetchGoalProgress();
      fetchRecentActivity(); // Refresh activity when goals are loaded
    }
  }, [viewedUserGoals]);

  const fetchGoalProgress = async () => {
    if (viewedUserGoals.length === 0) return;

    const progressData: {[goalId: string]: number} = {};
    
    for (const goal of viewedUserGoals) {
      if (!goal.completed) {
        const checkInCount = goal.start_date 
          ? await progressService.getCheckInCountInRange(goal.id, userId, goal.start_date, goal.end_date, goal.frequency)
          : await progressService.getCheckInCount(goal.id, userId);
        progressData[goal.id] = checkInCount;
      }
    }
    
    setGoalProgress(progressData);
  };

  const handleFollowToggle = async () => {
    if (!user || !profile || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      let success = false;
      if (isFollowing) {
        success = await unfollowUser(user.id, userId);
        if (success) {
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
        }
      } else {
        success = await followUser(user.id, userId);
        if (success) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
      }

      if (!success) {
        Alert.alert('Error', `Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const toggleProfileCard = () => {
    const newExpandedState = !isProfileCardExpanded;
    setIsProfileCardExpanded(newExpandedState);
    
    Animated.timing(profileCardAnimation, {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleOpenDM = async () => {
    if (!user || !profile) return;

    try {
      // Get or create chat with this user
      const chatId = await dmService.getOrCreateChat(user.id, userId);
      
      if (chatId) {
        // Navigate to ChatWindow with the chat
        navigation.navigate('ChatWindow', {
          chatId: chatId,
          otherUserId: userId,
          otherUserName: profile.username || profile.display_name || 'User',
          otherUserAvatar: profile.avatar_url,
        });
      } else {
        Alert.alert('Error', 'Failed to create or open chat');
      }
    } catch (error) {
      console.error('Error opening DM:', error);
      Alert.alert('Error', 'Failed to open direct message');
    }
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Profile not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get active goals with completion percentages
  const activeGoals = viewedUserGoals.filter(goal => !goal.completed).slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          
          {/* Action Buttons - Follow and DM */}
          {user && user.id !== userId && (
            <View style={styles.headerActions}>
              {/* Follow Button */}
              <TouchableOpacity
                onPress={handleFollowToggle}
                disabled={isFollowLoading}
                style={[
                  styles.followButton,
                  {
                    backgroundColor: isFollowing ? 'rgba(128, 128, 128, 0.3)' : theme.primary,
                    opacity: isFollowLoading ? 0.7 : 1,
                  },
                ]}
              >
                {isFollowLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.followButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              
              {/* DM Button */}
              <TouchableOpacity
                onPress={handleOpenDM}
                style={[
                  styles.dmButton,
                  { backgroundColor: 'rgba(128, 128, 128, 0.2)' }
                ]}
              >
                <Ionicons name="chatbubble-outline" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Picture Card */}
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity 
            style={[
              styles.profilePictureCard, 
              { 
                backgroundColor: '#FFFFFF',
                borderBottomLeftRadius: isProfileCardExpanded ? 0 : 16,
                borderBottomRightRadius: isProfileCardExpanded ? 0 : 16,
              }
            ]}
            onPress={toggleProfileCard}
            activeOpacity={0.8}
          >
            <View style={styles.profilePictureSection}>
              {profile.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.profilePicture}
                />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: '#E5E7EB' }]}>
                  <Ionicons name="person" size={32} color="#6B7280" />
                </View>
              )}
            </View>
            <View style={styles.profileInfoSection}>
              <View style={styles.profileDisplayNameRow}>
              <Text style={[styles.profileDisplayName, { color: theme.textPrimary }]}>
                @{profile.username}
              </Text>
                {(profile as any).is_pro && (
                  <View style={styles.proMicroBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Text style={styles.proMicroBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.profileLocation, { color: theme.textSecondary }]}>
                England, London
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileFollowersSection}
              onPress={() => {
                navigation.navigate('Followers', {
                  userId: userId,
                  username: profile.username || 'User',
                  initialTab: 'followers'
                });
              }}
            >
              <Text style={[styles.profileFollowers, { color: theme.textSecondary }]}>
                Followers
              </Text>
              <Text style={[styles.profileFollowersCount, { color: theme.textPrimary }]}>
                {followerCount}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
          
          {/* Expanded Profile Information */}
          {isProfileCardExpanded && (
            <Animated.View 
              style={[
                styles.expandedProfileWrapper,
                { 
                  opacity: profileCardAnimation,
                  maxHeight: profileCardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200],
                  }),
                }
              ]}
            >
              <View style={styles.expandedProfileInfo}>
              <View style={styles.expandedProfileRow}>
                <View style={styles.expandedProfileItem}>
                  <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Wins</Text>
                  <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                    {challengeStats.wins}
                  </Text>
                </View>
                <View style={styles.expandedProfileItem}>
                  <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Losses</Text>
                  <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                    {challengeStats.losses}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.expandedProfileItem}
                  onPress={() => {
                    navigation.navigate('Followers', {
                      userId: userId,
                      username: profile.username || 'User',
                      initialTab: 'following'
                    });
                  }}
                >
                  <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Following</Text>
                  <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                    {followingCount}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.expandedProfileRow}>
                <View style={styles.expandedProfileItem}>
                  <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Competitions</Text>
                  <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                    {challengeStats.wins + challengeStats.losses}
                  </Text>
                </View>
                <View style={styles.expandedProfileItem}>
                  <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Awards</Text>
                  <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                    0
                  </Text>
                </View>
                <View style={styles.expandedProfileItem}>
                  <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>EXP</Text>
                  <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                    {totalPoints}
                  </Text>
                </View>
              </View>
              </View>
            </Animated.View>
          )}
        </View>


        {/* Goals Section */}
        <View style={[styles.keepTrackSection, { marginTop: 8 }]}>
          <View style={styles.goalsSectionHeader}>
            <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>Goals</Text>
          </View>
          {activeGoals.length === 0 ? (
            <View style={styles.noGoalsContainer}>
              <Text style={[styles.noGoalsText, { color: theme.textSecondary }]}>No active goals</Text>
            </View>
          ) : (
            <View style={styles.circularGoalsContainer}>
              {activeGoals.map((goal, index) => {
                const checkInCount = goalProgress[goal.id] || 0;
                const mockProgressEntries = Array(checkInCount).fill({}).map((_, index) => ({
                  id: `mock-${index}`,
                  goal_id: goal.id,
                  user_id: userId,
                  completed_date: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                }));
                const completionPercent = calculateCompletionPercentage(goal, mockProgressEntries);
                
                const gradientColors = ['#10B981', '#10B981', '#10B981']; // Green gradient matching level bar
                
                return (
                  <View key={goal.id} style={styles.circularGoalItem}>
                    <View style={styles.circularProgressContainer}>
                      <Svg width={110} height={110}>
                        <Defs>
                          <LinearGradient id={`gradient-${goal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor={gradientColors[0]} />
                            <Stop offset="50%" stopColor={gradientColors[1]} />
                            <Stop offset="100%" stopColor={gradientColors[2]} />
                          </LinearGradient>
                        </Defs>
                        <Circle
                          cx={55}
                          cy={55}
                          r={42}
                          stroke="rgba(128, 128, 128, 0.3)"
                          strokeWidth={8}
                          fill="transparent"
                        />
                        <Circle
                          cx={55}
                          cy={55}
                          r={42}
                          stroke={`url(#gradient-${goal.id})`}
                          strokeWidth={8}
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.round(completionPercent) / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 55 55)"
                        />
                      </Svg>
                      <View style={styles.circularProgressText}>
                        <Text style={[styles.circularProgressValue, { color: theme.textPrimary }]}>
                          {Math.round(completionPercent)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.circularGoalTitle, { color: theme.textPrimary }]}>
                      {goal.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Journey Section */}
        <JourneyPreview 
          userId={userId}
          onViewAll={() => setShowFullJourney(true)}
          emptyStateText="No posts yet."
        />

        {/* Progress Bars Section - Only show if stats are visible */}
        {statsVisible && (
        <View style={[styles.keepTrackSection, styles.profileSectionSpacing]}>
          <View style={[styles.progressBarsBox, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
            <View style={[styles.keepTrackHeader, { marginBottom: 30 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>Overall</Text>
                <View style={{
                  backgroundColor: isDark ? '#1f1f1f' : '#111827',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '600' }}>
                    {Math.floor(pillarProgress.overall)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.progressBarsContainer, { 
              height: Math.max(100, Math.max(...[
                pillarProgress.strength_fitness,
                pillarProgress.growth_wisdom,
                pillarProgress.discipline,
                pillarProgress.team_spirit,
                pillarProgress.overall
              ].map(p => Math.max(45, p * 1.8))) + 30)
            }]}>
              {[
                { index: 1, progress: pillarProgress.strength_fitness, color: isDark ? '#1f1f1f' : '#111827', pillar: 'Strength & Fitness', key: 'strength_fitness' },
                { index: 2, progress: pillarProgress.growth_wisdom, color: isDark ? '#1f1f1f' : '#111827', pillar: 'Growth & Wisdom', key: 'growth_wisdom' },
                { index: 3, progress: pillarProgress.discipline, color: isDark ? '#1f1f1f' : '#111827', pillar: 'Discipline', key: 'discipline' },
                { index: 4, progress: pillarProgress.team_spirit, color: isDark ? '#1f1f1f' : '#111827', pillar: 'Team Spirit', key: 'team_spirit' },
                { index: 5, progress: pillarProgress.overall, color: isDark ? '#1f1f1f' : '#111827', pillar: 'Overall', key: 'overall' }
              ].map((bar) => {
              const exactProgress = pillarProgress[bar.key as keyof typeof pillarProgress];
              const displayProgress = Math.floor(exactProgress);
              
              const barColor = bar.color;
              const iconColor = '#FFFFFF';
              
              const barHeight = Math.max(45, exactProgress * 1.8);
              
              return (
                <View key={bar.index} style={styles.progressBarColumn}>
                  <View style={[styles.progressBarContainer, { height: barHeight }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: barColor,
                          height: '100%',
                          zIndex: 5,
                        }
                      ]}
                    />
                    <View style={styles.progressBarAvatar}>
                      <View style={{
                        position: 'absolute',
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        zIndex: 1
                      }} />
                      {bar.index === 1 ? (
                        <FontAwesome5 name="dumbbell" size={20} color={iconColor} style={{ zIndex: 2 }} />
                      ) : bar.index === 2 ? (
                        <FontAwesome5 name="brain" size={20} color={iconColor} style={{ zIndex: 2 }} />
                      ) : bar.index === 3 ? (
                        <FontAwesome5 name="lock" size={20} color={iconColor} style={{ zIndex: 2 }} />
                      ) : bar.index === 4 ? (
                        <FontAwesome5 name="star" size={20} color={iconColor} solid style={{ zIndex: 2 }} />
                      ) : (
                        <FontAwesome5 name="fire" size={20} color={iconColor} style={{ zIndex: 2 }} />
                      )}
                    </View>
                  </View>
                  <View style={styles.progressBarLabelBelow}>
                    <TouchableOpacity 
                      style={styles.progressBarNumberContainer}
                      onPress={() => {
                        Alert.alert(
                          bar.pillar,
                          `${exactProgress.toFixed(1)}%`,
                          [{ text: 'OK' }]
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.progressBarNumber, { color: theme.textPrimary }]}>
                        {displayProgress}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
              })}
            </View>
          </View>
        </View>
        )}

        {/* Tasks Section — match Posts→Overall gap when Overall is hidden */}
        <View style={[styles.keepTrackSection, !statsVisible && styles.profileSectionSpacing]}>
          <View style={styles.bigTasksRowBoxes}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.leaderboardLabel, { color: theme.textSecondary }]}>Leaderboard</Text>
              <View style={[styles.leaderboardCompetitionBox, styles.emptyStatBox]}>
                <Text style={[styles.emptyStatText, { color: theme.textSecondary }]}>
                  Yet to be ranked
                </Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.competitionsLabel, { color: theme.textSecondary }]}>Challenges</Text>
              <View style={[styles.leaderboardCompetitionBox, styles.emptyStatBox]}>
                <Text style={[styles.emptyStatText, { color: theme.textSecondary }]}>
                  Not part of any challenges
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity and Highlights Section — hidden when both are empty */}
        {(recentActivity.length > 0 || highlights.length > 0) && (
        <View style={styles.keepTrackSection}>
          <View style={styles.activityAchievementsRow}>
            {recentActivity.length > 0 && (
            <View style={{ flex: 1 }}>
              <View style={[
                styles.activityBox,
                {
                  height: 64 + (Math.min(recentActivity.length, 4) * 38) - (Math.min(recentActivity.length, 4) > 0 ? 10 : 0),
                }
              ]}>
                <Text style={[styles.activityLabel, { color: theme.textPrimary, marginBottom: 8 }]}>Activity</Text>
                <ScrollView 
                  style={{ flex: 1, width: '100%' }}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {recentActivity.map((item, index) => (
                    <View key={index} style={styles.activityItem}>
                      <View style={[styles.activityIconContainer, { backgroundColor: item.color + '20' }]}>
                        {item.iconType === 'fa5' ? (
                          <FontAwesome5 name={item.icon} size={14} color={item.color} />
                        ) : (
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                        )}
                      </View>
                      <Text 
                        style={[styles.activityText, { color: theme.textSecondary }]} 
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            )}
            {highlights.length > 0 && (
            <View style={{ flex: 2, marginLeft: recentActivity.length > 0 ? 16 : 0 }}>
              <View style={[
                styles.achievementsBox,
                {
                  height: 72 + (Math.min(highlights.length, 4) * 32),
                }
              ]}>
                <View style={styles.achievementsHeader}>
                  <Text style={[styles.achievementsLabel, { color: theme.textPrimary }]}>Highlights</Text>
                </View>
                <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
                  {highlights.slice(0, 4).map((highlight, index) => (
                    <View key={highlight.id} style={styles.achievementItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text
                        style={[styles.achievementText, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {highlight.text}
                      </Text>
                      {highlight.photo_url && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedPhotoUrl(highlight.photo_url);
                            setShowPhotoModal(true);
                          }}
                          style={styles.photoIconButton}
                        >
                          <Ionicons name="image" size={22} color={theme.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
            )}
          </View>
        </View>
        )}

        {badgeUnlockedCount > 0 && (
          <View style={styles.keepTrackSection}>
            <TouchableOpacity
              style={styles.badgeAchievementsBox}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Achievements', { userId })}
            >
              <View style={styles.badgeAchievementsHeader}>
                <Text style={[styles.achievementsLabel, { color: theme.textPrimary }]}>Achievements</Text>
                <Text style={[styles.badgeAchievementsProgress, { color: theme.textSecondary }]}>
                  {badgeUnlockedCount}/{TOTAL_ACHIEVEMENTS}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgeAchievementsRow}
              >
                {sortAchievementsHardestFirst(badgeAchievements.filter((b) => b.unlocked))
                  .slice(0, 8)
                  .map((badge) => (
                    <AchievementBadge
                      key={badge.id}
                      image={badge.image}
                      unlocked
                      size={52}
                      style={{ marginRight: 10 }}
                    />
                  ))}
              </ScrollView>
              <Text style={[styles.badgeAchievementsHint, { color: theme.textSecondary }]}>
                Tap to view all
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Full Journey Modal */}
      <FullJourneyModal
        visible={showFullJourney}
        userId={userId}
        onClose={() => setShowFullJourney(false)}
      />

      {/* Level Info Modal */}
      <LevelInfoModal
        visible={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentLevel={currentLevel}
        totalPoints={totalPoints}
      />

      {/* Full Screen Photo Modal */}
      {selectedPhotoUrl && (
        <FullScreenPhotoModal
          visible={showPhotoModal}
          photos={[selectedPhotoUrl]}
          initialIndex={0}
          onClose={() => {
            setShowPhotoModal(false);
            setSelectedPhotoUrl(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  dmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Profile Picture Card Styles (matching ProfileScreen exactly)
  profilePictureContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  profilePictureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
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
  profileDisplayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileDisplayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  proMicroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  proMicroBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
  expandedProfileWrapper: {
    marginTop: -1,
  },
  expandedProfileInfo: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 20,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  expandedProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  expandedProfileItem: {
    flex: 1,
    alignItems: 'center',
  },
  expandedProfileLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  expandedProfileValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Progress Bar Styles (matching ProfileScreen exactly)
  leftBarContainer: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBarBackground: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBarSegment: {
    width: '18%', // percentage width for equal segments
    height: '100%',
    marginRight: '2%', // small, consistent gap
    borderRadius: 5,
    transform: [{ skewX: '-18deg' }],
  },
  // Journey Section Styles
  journeySection: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Goals Section Styles (matching ProfileScreen exactly)
  keepTrackSection: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  profileSectionSpacing: {
    marginTop: 20,
  },
  keepTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  keepTrackTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weeklyTrackerCard: {
    borderRadius: 16,
    padding: 20,
  },
  goalsContainer: {
    alignItems: 'center',
  },
  noGoalsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noGoalsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  circularGoalsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 0,
    gap: 25,
  },
  circularGoalItem: {
    alignItems: 'center',
    flex: 0,
    minHeight: 140,
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressValue: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
  },
  circularGoalTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 110,
    lineHeight: 14,
  },
  // Progress Bars Section Styles (matching ProfileScreen exactly)
  progressBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    height: 200,
  },
  progressBarColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  progressBarContainer: {
    position: 'relative',
    width: 40,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  progressBarFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 20,
  },
  progressBarAvatar: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -14 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    zIndex: 10,
    elevation: 2,
  },
  progressBarLabel: {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: [{ translateX: -15 }],
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  progressBarNumber: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Tasks Section Styles
  bigTasksRowBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bigTaskBox: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  competitionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  leaderboardCompetitionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 120,
  },
  emptyStatBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStatText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  // Activity and Highlights Styles
  activityAchievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  achievementsLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    gap: 8,
  },
  bulletPoint: {
    fontSize: 18,
    color: '#6B7280',
  },
  achievementText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  photoIconButton: {
    padding: 0,
    marginLeft: 4,
  },
  activityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  activityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  achievementsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeAchievementsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeAchievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeAchievementsProgress: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeAchievementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  badgeAchievementsHint: {
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  // Pillar Progress Bars Styles
  progressBarsBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressBarLabelBelow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: 40,
  },
  progressBarNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
}); 