import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  PanResponder,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../state/authStore';
import { useGoalsStore } from '../state/goalsStore';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIcon, calculateCompletionPercentage } from '../lib/goalHelpers';
import CreatePostModal from '../components/CreatePostModal';
import { progressService } from '../lib/progressService';
import { useTheme } from '../state/themeStore';
import { useSocialStore } from '../state/socialStore';
import { useActionStore } from '../state/actionStore';
import { socialService } from '../lib/socialService';
import { supabase } from '../lib/supabase';
import { pointsService } from '../lib/pointsService';
import { dmService } from '../lib/dmService';
import Svg, { Circle, Line, Text as SvgText, Polygon, Defs, LinearGradient, Stop, Path, Filter, FeGaussianBlur, FeOffset, FeMerge, FeMergeNode } from 'react-native-svg';
import JourneyPreview from '../components/JourneyPreview';
import FullJourneyModal from '../components/FullJourneyModal';
import LevelInfoModal from '../components/LevelInfoModal';

const { width } = Dimensions.get('window');

// Custom Radar Chart Component for React Native
const ModernRadarChart = ({ theme }: { theme: any }) => {
  const chartSize = 300;
  const center = chartSize / 2;
  const radius = 110;
  
  // Sample data for the 5 categories to create smooth star shape
  const categories = ['Body', 'Mind', 'Skill', 'Hustle', 'Vision'];
  const values = [90, 85, 50, 85, 40]; // Body, Mind, Skill, Hustle, Vision (min 20% adjusted)
  
  // Generate points for the radar shape
  const generateRadarPoints = (data: number[]) => {
    return data.map((value, index) => {
      const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
      const distance = (value / 100) * radius;
      const x = center + distance * Math.cos(angle);
      const y = center + distance * Math.sin(angle);
      return { x, y, value };
    });
  };

  const radarPoints = generateRadarPoints(values);
  
  // Generate smooth star shape with curved indentations
  const generateSmoothPath = (points: { x: number; y: number; value: number }[]) => {
    if (points.length === 0) return '';
    
    // Create smooth star shape with indented curves between points
    const expandedPoints = [];
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      
      // Add the main point (star tip)
      expandedPoints.push(current);
      
             // Add indented curve point between main points
       const midAngle = (i + 0.5) * (2 * Math.PI) / points.length - Math.PI / 2;
       const indentFactor = 0.55; // Reduced indentation for 30% thicker spikes
       const avgValue = (current.value + next.value) / 2;
       const indentRadius = avgValue * indentFactor; // Much smaller radius for indentation
      const indentDistance = (indentRadius / 100) * radius;
      
      const indentX = center + indentDistance * Math.cos(midAngle);
      const indentY = center + indentDistance * Math.sin(midAngle);
      
      expandedPoints.push({ x: indentX, y: indentY, value: indentRadius });
    }
    
    // Start from the second point and curve back to first to ensure all points get smooth treatment
    let path = `M ${expandedPoints[0].x} ${expandedPoints[0].y}`;
    
    // Process all points including wrapping back to the first point for consistent curves
    for (let i = 1; i <= expandedPoints.length; i++) {
      const current = expandedPoints[i % expandedPoints.length];
      const previous = expandedPoints[(i - 1) % expandedPoints.length];
      const next = expandedPoints[(i + 1) % expandedPoints.length];
      
      // Smooth curves with higher tension for clean star shape
      const tension = 0.5;
      
      const dx1 = (current.x - previous.x) * tension;
      const dy1 = (current.y - previous.y) * tension;
      const dx2 = (next.x - current.x) * tension;
      const dy2 = (next.y - current.y) * tension;
      
      const cp1x = previous.x + dx1;
      const cp1y = previous.y + dy1;
      const cp2x = current.x - dx2;
      const cp2y = current.y - dy2;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
    }
    
    return path + ' Z';
  };
  
  const smoothPath = generateSmoothPath(radarPoints);

    return (
    <View style={styles.radarChartContainer}>
      <View style={styles.chartWrapper}>
        <Svg width={chartSize} height={chartSize}>
          {/* Gradient and glow effect definitions */}
          <Defs>
            <LinearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B35" stopOpacity="0.7" />
              <Stop offset="30%" stopColor="#FF8C42" stopOpacity="0.6" />
              <Stop offset="70%" stopColor="#FF69B4" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#9C27B0" stopOpacity="0.5" />
            </LinearGradient>
            
            {/* Glow filter for the radar shape */}
            <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <FeGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <FeMerge> 
                <FeMergeNode in="coloredBlur"/>
                <FeMergeNode in="SourceGraphic"/>
              </FeMerge>
            </Filter>
            
            {/* Shadow filter */}
            <Filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <FeOffset in="SourceGraphic" dx="2" dy="2" result="offset" />
              <FeGaussianBlur in="offset" stdDeviation="2" result="blur" />
              <FeMerge>
                <FeMergeNode in="blur" />
                <FeMergeNode in="SourceGraphic" />
              </FeMerge>
            </Filter>
          </Defs>

          {/* Grid circles */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, index) => (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius * scale}
              stroke="#2a2a2a"
              strokeWidth="0.5"
              fill="transparent"
            />
          ))}
          
          {/* Radial lines */}
          {categories.map((_, index) => {
            const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <Line
                key={index}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#2a2a2a"
                strokeWidth="0.5"
              />
            );
          })}
          
          {/* Category labels */}
          {categories.map((category, index) => {
            const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
            const x = center + (radius + 25) * Math.cos(angle);
            const y = center + (radius + 25) * Math.sin(angle);
            return (
              <SvgText
                key={index}
                x={x}
                y={y}
                fontSize="12"
                fill={theme.textSecondary}
                textAnchor="middle"
                fontWeight="500"
              >
                {category}
              </SvgText>
            );
          })}
          
          {/* Organic blob shape with gradient */}
          <Path
            d={smoothPath}
            fill="url(#radarGradient)"
            stroke="none"
            filter="url(#glow)"
          />
          

        </Svg>
      </View>
    </View>
  );
};

function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuthStore();
  const { goals: userGoals, fetchGoals, loading } = useGoalsStore();
  const { theme } = useTheme();
  const { segmentChecked, getActiveSegmentCount, coreHabitsCompleted, loadCoreHabitsStatus } = useActionStore();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const weeklyTrackerRef = useRef<View>(null);
  const weeklyTrackerLayout = useRef<any>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [targetCheckInDate, setTargetCheckInDate] = useState<Date | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInGoals, setCheckedInGoals] = useState<Set<string>>(new Set());
  const [checkedInGoalsByDay, setCheckedInGoalsByDay] = useState<{[key: string]: Set<string>}>({});
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [goalProgress, setGoalProgress] = useState<{[goalId: string]: number}>({});
  
  // Profile card expansion state
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [profileData, setProfileData] = useState({
    height: '',
    age: '',
    followings: '',
    completedCompetitions: '',
    wonAwards: ''
  });
  const [totalPoints, setTotalPoints] = useState(0);
  const [socialCounts, setSocialCounts] = useState({
    followers: 0,
    following: 0
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const profileCardAnimation = useRef(new Animated.Value(0)).current;
  
  // Journey modal state
  const [showFullJourney, setShowFullJourney] = useState(false);
  
  // Level system state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelProgress, setLevelProgress] = useState({ 
    currentLevel: 1, 
    nextLevel: 2, 
    segmentsFilled: 0,
    pointsInCurrentLevel: 0,
    pointsNeededForNext: 4000
  });



  useEffect(() => {
    if (user) {
      fetchGoals(user.id);
      checkTodaysCheckIns();
    }
  }, [user]);

  // Refresh data when screen comes into focus (e.g., after returning from GoalDetail)
  useFocusEffect(
    React.useCallback(() => {
      if (user && userGoals.length > 0) {
        // Only refresh progress-related data, not goals themselves to avoid loading flicker
        fetchGoalProgress();
        checkTodaysCheckIns();
      }
      // Force a refresh of the action store data to ensure live updates
      getActiveSegmentCount();
    }, [user, userGoals.length, getActiveSegmentCount])
  );

  const loadProfileData = async () => {
    try {
      const savedProfileData = await AsyncStorage.getItem('profileData');
      if (savedProfileData) {
        setProfileData(JSON.parse(savedProfileData));
      }
      
      // Load social counts
      if (user) {
        const followers = await socialService.getFollowerCount(user.id);
        const following = await socialService.getFollowingCount(user.id);
        setSocialCounts({ followers, following });
      }
      
  
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch fresh user data from database
      const { data: freshUserData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching fresh user data:', error);
        return;
      }

      if (freshUserData) {
        // Update the auth store with fresh data
        const { updateProfile } = useAuthStore.getState();
        await updateProfile({
          username: freshUserData.username || user.username || '',
          bio: freshUserData.bio || user.bio || '',
          avatar_url: freshUserData.avatar_url || user.avatar_url
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      const total = await pointsService.getTotalPoints(user.id);
      const today = await pointsService.getTodaysPoints(user.id);
      const status = await pointsService.getCoreHabitsStatus(user.id);
      const progress = pointsService.getLevelProgress(total);
      
      console.log('📊 Points breakdown:', {
        total,
        today,
        coreHabitsStatus: status,
        levelProgress: progress
      });
      
      setTotalPoints(total);
      setLevelProgress(progress);
    } catch (error) {
      console.error('Error fetching user points:', error);
      setTotalPoints(0);
    }
  };

  const fetchNotificationCount = async () => {
    if (!user) return;

    try {
      // Get the last time notifications were viewed
      const lastViewed = await AsyncStorage.getItem('lastNotificationsViewed');
      const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0);
      
      // Fetch recent followers (last 7 days) as notifications
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, created_at')
        .eq('following_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) {
        console.error('Error fetching notification count:', error);
        setNotificationCount(0);
        return;
      }

      // Only count notifications that are newer than the last viewed time
      const unreadNotifications = data?.filter(follower => 
        new Date(follower.created_at) > lastViewedDate
      ) || [];

      setNotificationCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await AsyncStorage.setItem('lastNotificationsViewed', new Date().toISOString());
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const loadDmUnreadCount = async () => {
    if (user) {
      const count = await dmService.getTotalUnreadCount(user.id);
      setDmUnreadCount(count);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
      fetchUserPoints();
      fetchNotificationCount();
      loadDmUnreadCount();
      fetchGoalProgress();
      checkTodaysCheckIns();
      loadCoreHabitsStatus();
    }, [user])
  );

  // Listen for navigation events to refresh data when returning to profile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
      fetchUserPoints();
      fetchNotificationCount();
      fetchGoalProgress();
      checkTodaysCheckIns();
      loadCoreHabitsStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchGoalProgress = async () => {
    if (!user || userGoals.length === 0) return;

    const progressData: {[goalId: string]: number} = {};
    
    for (const goal of userGoals) {
      if (!goal.completed) {
        // Use range-based count filtered by frequency to match completion percentage logic
        const checkInCount = goal.start_date 
          ? await progressService.getCheckInCountInRange(goal.id, user.id, goal.start_date, goal.end_date, goal.frequency)
          : await progressService.getCheckInCount(goal.id, user.id);
        progressData[goal.id] = checkInCount;
      }
    }
    
    setGoalProgress(progressData);
  };

  const checkTodaysCheckIns = async () => {
    if (!user || userGoals.length === 0) return;

    const checkedInSet = new Set<string>();
    const checkedInByDay: {[key: string]: Set<string>} = {};
    
    // Initialize sets for each day of the week
    for (let day = 0; day < 7; day++) {
      checkedInByDay[day.toString()] = new Set<string>();
    }

    // Get all check-ins for the selected week in one batch
    const weekStart = getWeekStart(selectedWeek);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    try {
      // Get all check-ins for the week for all goals
      const weekCheckIns = await progressService.getCheckInsForDateRange(user.id, weekStart, weekEnd);
      
      for (const goal of userGoals) {
        if (!goal.completed) {
          // Check today for the main set
          const today = new Date();
          const hasCheckedInToday = await progressService.hasCheckedInToday(goal.id, user.id, today);
          if (hasCheckedInToday) {
            checkedInSet.add(goal.id);
          }

          // Check each day of the week using the batch data
          for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const targetDate = getDateForDayOfWeekInWeek(dayOfWeek, selectedWeek);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            // Check if there's a check-in for this goal on this date
            const hasCheckedInForDay = weekCheckIns.some((checkIn: {goal_id: string, check_in_date: string}) => 
              checkIn.goal_id === goal.id && 
              checkIn.check_in_date.split('T')[0] === targetDateStr
            );
            
            if (hasCheckedInForDay) {
              checkedInByDay[dayOfWeek.toString()].add(goal.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching check-ins for week:', error);
      // Fallback to individual calls if batch fails
      for (const goal of userGoals) {
        if (!goal.completed) {
          const today = new Date();
          const hasCheckedInToday = await progressService.hasCheckedInToday(goal.id, user.id, today);
          if (hasCheckedInToday) {
            checkedInSet.add(goal.id);
          }

          for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const targetDate = getDateForDayOfWeekInWeek(dayOfWeek, selectedWeek);
            const hasCheckedInForDay = await progressService.hasCheckedInToday(goal.id, user.id, targetDate);
            if (hasCheckedInForDay) {
              checkedInByDay[dayOfWeek.toString()].add(goal.id);
            }
          }
        }
      }
    }

    setCheckedInGoals(checkedInSet);
    setCheckedInGoalsByDay(checkedInByDay);
  };

  // Re-check when goals are updated or selected week changes
  useEffect(() => {
    if (user && userGoals.length > 0) {
      checkTodaysCheckIns();
    }
  }, [userGoals, selectedWeek]);

  // Fetch goal progress when goals are loaded
  useEffect(() => {
    if (user && userGoals.length > 0) {
      fetchGoalProgress();
    }
  }, [userGoals]);

  // Refresh check-ins when screen comes into focus (useful after deleting check-ins)
  useFocusEffect(
    React.useCallback(() => {
      if (user && userGoals.length > 0) {
        checkTodaysCheckIns();
      }
    }, [user, userGoals])
  );



  const handleSignOut = async () => {
    await signOut();
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



  // Helper function to get the date for a specific day of the week
  const getDateForDayOfWeek = (dayOfWeek: number): Date => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const daysDiff = dayOfWeek - currentDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysDiff);
    return targetDate;
  };

  // Helper function to get the date for a specific day of the week within the selected week
  const getDateForDayOfWeekInWeek = (dayOfWeek: number, weekDate: Date): Date => {
    const weekStart = new Date(weekDate);
    // Set to Sunday of the selected week
    weekStart.setDate(weekDate.getDate() - weekDate.getDay());
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayOfWeek);
    return targetDate;
  };

  // Helper function to get the start of the week (Sunday) for a given date
  const getWeekStart = (date: Date): Date => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart;
  };

  // Helper function to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Navigation functions for the calendar
  const goToPreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const handleCheckInPress = (goal: any, dayOfWeek: number) => {
    setSelectedGoal(goal);
    setExpandedDay(dayOfWeek); // Store the day being checked in for
    
    // Set target check-in date based on overdue date if available
    if (goal.overdueDate) {
      setTargetCheckInDate(goal.overdueDate);
    } else {
      setTargetCheckInDate(null); // Use today's date
    }
    
    setShowCreatePostModal(true);
  };


  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getDayContent = (dayIndex: number) => {
    // For now, return no goals message. Later this can be connected to real data
    return {
      day: days[dayIndex],
      goals: [],
      message: 'No goals for today'
    };
  };

  const calculateDayFromPosition = (x: number, containerX: number, containerWidth: number) => {
    const relativeX = x - containerX;
    const dayWidth = containerWidth / 7;
    const dayIndex = Math.floor(relativeX / dayWidth);
    return Math.max(0, Math.min(6, dayIndex));
  };

  // Mock data for now - will be replaced with real data later
  const tasks = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'];
  
  // Get active goals with completion percentages
  const activeGoals = userGoals.filter(goal => !goal.completed).slice(0, 3); // Show max 3 goals

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView}>
        {/* Header with Settings */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('DM' as never)} 
              style={{ marginRight: 12 }}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
                {dmUnreadCount > 0 && (
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
                      {dmUnreadCount > 99 ? '99+' : dmUnreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              navigation.navigate('Notifications');
              markNotificationsAsRead(); // Mark notifications as read
            }} style={{ marginRight: 12 }}>
              <View style={{ position: 'relative' }}>
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                {notificationCount > 0 && (
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
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowSettingsMenu(true)}>
              <Ionicons name="settings-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Dropdown Modal */}
        <Modal
          visible={showSettingsMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSettingsMenu(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
            activeOpacity={1}
            onPress={() => setShowSettingsMenu(false)}
          >
            <View style={{ position: 'absolute', top: 70, right: 32, backgroundColor: 'rgba(128, 128, 128, 0.15)', borderRadius: 10, shadowColor: theme.shadow, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, minWidth: 120 }}>
              <TouchableOpacity
                style={{ padding: 16 }}
                onPress={() => { setShowSettingsMenu(false); navigation.navigate('ProfileSettings', { user }); }}
              >
                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 16 }}>Profile settings</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 8 }} />
              <TouchableOpacity
                style={{ padding: 16 }}
                onPress={async () => { setShowSettingsMenu(false); await handleSignOut(); }}
              >
                <Text style={{ color: '#d32f2f', fontWeight: '600', fontSize: 16 }}>Log out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* New Profile Picture Component */}
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity 
            style={[
              styles.profilePictureCard, 
              { 
                backgroundColor: 'rgba(128, 128, 128, 0.15)',
                borderBottomLeftRadius: isProfileCardExpanded ? 0 : 16,
                borderBottomRightRadius: isProfileCardExpanded ? 0 : 16,
              }
            ]}
            onPress={toggleProfileCard}
            activeOpacity={0.8}
          >
            <View style={styles.profilePictureSection}>
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={styles.profilePicture}
                                  onError={(error) => {}}
                />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <Text style={[styles.profilePictureInitial, { color: 'white' }]}>
                    {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfoSection}>
              <Text style={[styles.profileDisplayName, { color: theme.textPrimary }]}>
                @{user?.username || 'user'}
              </Text>
              <Text style={[styles.profileLocation, { color: theme.textSecondary }]}>
                England, London
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileFollowersSection}
              onPress={() => {
                if (user) {
                  navigation.navigate('Followers', {
                    userId: user.id,
                    username: user.email || 'User'
                  }, {
                    animation: 'slide_from_bottom',
                    presentation: 'modal'
                  });
                }
              }}
            >
              <Text style={[styles.profileFollowers, { color: theme.textSecondary }]}>
                Followers
              </Text>
              <Text style={[styles.profileFollowersCount, { color: theme.textPrimary }]}>
                {socialCounts.followers}
              </Text>
            </TouchableOpacity>

          </TouchableOpacity>
          
          {/* Expanded Profile Information */}
          {isProfileCardExpanded && (
            <Animated.View 
              style={[
                styles.expandedProfileInfo,
                { 
                  backgroundColor: 'rgba(128, 128, 128, 0.15)',
                  opacity: profileCardAnimation,
                  maxHeight: profileCardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200],
                  }),
                  overflow: 'hidden',
                }
              ]}
            >
                          <View style={styles.expandedProfileRow}>
              <View style={styles.expandedProfileItem}>
                <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Height</Text>
                <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                  {profileData.height || 'Not set'}
                </Text>
              </View>
              <View style={styles.expandedProfileItem}>
                <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Age</Text>
                <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                  {profileData.age || 'Not set'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.expandedProfileItem}
                onPress={() => {
                  if (user) {
                    navigation.navigate('Following', {
                      userId: user.id,
                      username: user.email || 'User'
                    });
                  }
                }}
              >
                <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Following</Text>
                <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                  {socialCounts.following}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.expandedProfileRow}>
              <View style={styles.expandedProfileItem}>
                <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Competitions</Text>
                <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                  {profileData.completedCompetitions || '0'}
                </Text>
              </View>
              <View style={styles.expandedProfileItem}>
                <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Awards</Text>
                <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                  {profileData.wonAwards || '0'}
                </Text>
              </View>
              <View style={styles.expandedProfileItem}>
                <Text style={[styles.expandedProfileLabel, { color: theme.textSecondary }]}>Points</Text>
                <Text style={[styles.expandedProfileValue, { color: theme.textPrimary }]}>
                  {totalPoints}
                </Text>
              </View>
            </View>
            

            </Animated.View>
          )}
        </View>

                {/* Progress Bar */}
        <TouchableOpacity 
          onPress={() => {
            console.log('Progress bar clicked, opening level modal');
            setShowLevelModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginHorizontal: 24, marginBottom: 8, paddingVertical: 6, paddingHorizontal: 12, minHeight: 20, height: 45 }}> 
            {/* Main Progress Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginRight: 6 }}>{levelProgress.currentLevel}</Text>
              <View style={[styles.leftBarContainer, { flex: 1, marginHorizontal: 4 }]}>
                <View style={[styles.leftBarBackground, { backgroundColor: 'transparent' }]}>
                  {[...Array(20)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        {
                          width: '4.3%', // 100% / 20 segments, adjusted for spacing
                          height: '100%',
                          backgroundColor: 'white',
                          marginRight: i === 19 ? 0 : '0.7%', // increased spacing between segments
                          borderRadius: 2,
                          transform: [{ skewX: '-18deg' }],
                        },
                        (i > 0 && i < 19) && { borderRadius: 0 },
                                              i === 0 && { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
                                                i === 19 && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
                                              (i >= levelProgress.segmentsFilled) && { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'white' },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginLeft: 6 }}>{levelProgress.nextLevel}</Text>
            </View>
          
          {/* Green Progress Bar - Now first */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <View style={[styles.leftBarContainer, { flex: 0.85, marginHorizontal: 4, alignSelf: 'center' }]}>
              <View style={[styles.leftBarBackground, { backgroundColor: 'transparent', flexDirection: 'row' }]}>
                {[...Array(8)].map((_, i) => {
                  // Get the count of checked segments from action screen
                  const activeSegmentCount = segmentChecked.filter(checked => checked).length;
                  

                  
                  // Only light up the first N segments based on how many are checked
                  const shouldBeActive = i < activeSegmentCount;
                  
                  return (
                    <View
                      key={i}
                      style={[
                        styles.leftBarSegment,
                        { 
                          backgroundColor: shouldBeActive ? '#10B981' : 'transparent', 
                          height: 2.59,
                          flex: 1,
                          marginRight: i === 7 ? 0 : 2,
                          shadowColor: '#10B981',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: shouldBeActive ? 0.6 : 0,
                          shadowRadius: 3,
                          elevation: shouldBeActive ? 3 : 0,
                        },
                        (i === 1 || i === 2 || i === 3 || i === 4 || i === 5 || i === 6) && { borderRadius: 0 },
                        i === 0 && { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
                        i === 7 && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
                        (!shouldBeActive) && { 
                          backgroundColor: 'transparent', 
                          borderWidth: 0.5, 
                          borderColor: '#10B981',
                          shadowColor: 'transparent',
                          shadowOpacity: 0,
                          elevation: 0,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
          
          {/* Pink Progress Bar - Core Habits (Like, Comment, Share, Update Goal, Bonus) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 2 }}>
            <View style={[styles.leftBarContainer, { flex: 0.8, marginHorizontal: 4, alignSelf: 'center' }]}>
              <View style={[styles.leftBarBackground, { backgroundColor: 'transparent' }]}>
                {[...Array(5)].map((_, i) => {
                  const isCompleted = coreHabitsCompleted[i];
                  return (
                    <View
                      key={i}
                      style={[
                        styles.leftBarSegment,
                        { 
                          backgroundColor: isCompleted ? '#E91E63' : 'transparent', 
                          height: 2.59,
                          shadowColor: '#E91E63',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: isCompleted ? 0.6 : 0,
                          shadowRadius: 3,
                          elevation: isCompleted ? 3 : 0,
                        },
                        i === 4 && { marginRight: 0 },
                        (i === 1 || i === 2 || i === 3) && { borderRadius: 0 },
                        i === 0 && { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
                        i === 4 && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
                        !isCompleted && { 
                          backgroundColor: 'transparent', 
                          borderWidth: 0.5, 
                          borderColor: '#E91E63',
                          shadowColor: 'transparent',
                          shadowOpacity: 0,
                          elevation: 0,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>
        </TouchableOpacity>

        {/* Journey Section */}
        {user && (
          <JourneyPreview 
            userId={user.id}
            onViewAll={() => setShowFullJourney(true)}
          />
        )}

        {/* Goals Section - Moved below pink progress bar */}
        <View style={[styles.keepTrackSection, { marginTop: 20 }]}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Goals')}
            style={styles.goalsSectionHeader}
          >
            <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>Pinned Goals</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={[styles.weeklyTrackerCard, { backgroundColor: 'transparent' }]}>
            <View style={styles.goalsContainer}>
              {activeGoals.length === 0 ? (
                <View style={styles.noGoalsContainer}>
                  <Text style={[styles.noGoalsText, { color: theme.textSecondary }]}>No active goals</Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Goals')}
                    style={[styles.createGoalButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  >
                    <Text style={styles.createGoalButtonText}>Create your first goal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.circularGoalsContainer}>
                  {activeGoals.map((goal, index) => {
                    // Create mock progress entries based on actual check-in count
                    const checkInCount = goalProgress[goal.id] || 0;
                    const mockProgressEntries = Array(checkInCount).fill({}).map((_, index) => ({
                      id: `mock-${index}`,
                      goal_id: goal.id,
                      user_id: user?.id || '',
                      completed_date: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                    }));
                    const completionPercent = calculateCompletionPercentage(goal, mockProgressEntries);
                    
                    // Create gradient colors based on index
                    const gradientColors = ['#FF6B35', '#9C27B0', '#E91E63']; // Orange to purple to pink
                    
                    return (
                      <TouchableOpacity 
                        key={goal.id} 
                        style={styles.circularGoalItem}
                        onPress={() => {
                          navigation.navigate('GoalDetail', { 
                            goal,
                            onCheckInDeleted: async () => {
                              // Refresh progress data when check-in is deleted
                              await fetchGoalProgress();
                              await checkTodaysCheckIns();
                              // Add small delay to ensure database changes propagate
                              setTimeout(async () => {
                                await checkTodaysCheckIns();
                                await fetchGoalProgress();
                              }, 100);
                            }
                          });
                        }}
                      >
                        <View style={styles.circularProgressContainer}>
                          <Svg width={110} height={110}>
                            <Defs>
                              <LinearGradient id={`gradient-${goal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={gradientColors[0]} />
                                <Stop offset="50%" stopColor={gradientColors[1]} />
                                <Stop offset="100%" stopColor={gradientColors[2]} />
                              </LinearGradient>
                            </Defs>
                            {/* Background circle */}
                            <Circle
                              cx={55}
                              cy={55}
                              r={42}
                              stroke="rgba(128, 128, 128, 0.3)"
                              strokeWidth={8}
                              fill="transparent"
                            />
                            {/* Progress circle */}
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
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Radar Chart Section */}
        <View style={styles.keepTrackSection}>
          <View style={styles.keepTrackHeader}>
            <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>Focus Chart</Text>
          </View>
          <ModernRadarChart theme={theme} />
        </View>

        {/* Tasks Section */}
        <View style={styles.keepTrackSection}>
          <View style={styles.bigTasksRowBoxes}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.leaderboardLabel, { color: theme.textSecondary }]}>Leaderboard</Text>
              <View style={[styles.weeklyTrackerCard, styles.bigTaskBox, { minWidth: 0, backgroundColor: 'rgba(128, 128, 128, 0.15)' }]} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.competitionsLabel, { color: theme.textSecondary }]}>Competitions</Text>
              <View style={[styles.weeklyTrackerCard, styles.bigTaskBox, { minWidth: 0, backgroundColor: 'rgba(128, 128, 128, 0.15)' }]} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setSelectedGoal(null);
          setTargetCheckInDate(null);
        }}
        onPostCreated={() => {
          setShowCreatePostModal(false);
          setSelectedGoal(null);
          setTargetCheckInDate(null);
          // Refresh goals and progress
          fetchGoals(user.id);
          fetchGoalProgress();
          checkTodaysCheckIns(); // Add this to refresh check-in status
          // Note: ProfileScreen doesn't have checkForOverdueGoals, but ActionScreen does
        }}
        userGoals={userGoals.filter(goal => !goal.completed)}
        preSelectedGoal={selectedGoal?.id || undefined}
        targetCheckInDate={targetCheckInDate || undefined}
      />

      {/* Full Journey Modal */}
      {user && (
        <FullJourneyModal
          visible={showFullJourney}
          userId={user.id}
          onClose={() => setShowFullJourney(false)}
        />
      )}

      {/* Level Info Modal */}
      <LevelInfoModal
        visible={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentLevel={levelProgress.currentLevel}
        totalPoints={totalPoints}
        dailyHabits={segmentChecked}
        coreHabits={coreHabitsCompleted}
      />
    </SafeAreaView>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ProfileScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  settingsIcon: {
    fontSize: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 8, // reduced from 16
    marginTop: 12, // keep avatar slightly down
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#f3c6a7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 1, // reduced from 2
  },
  username: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 1, // reduced from 2
  },
  joinDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  bio: {
    fontSize: 12, // reduced from 14
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16, // reduced line height
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  tasksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  taskText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  goalsContainer: {
    gap: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Keep Track Section Styles
  keepTrackSection: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  keepTrackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  weeklyTrackerCard: {
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 20,
    marginHorizontal: 1,
  },
  weeklyTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
    position: 'relative', // add this
  },
  todayContainer: {
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  todayBorderFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
  },
  // Single curved line following the 16px border radius
  singleCurvedLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: 'transparent',
    borderTopColor: '#1f2937',
    borderRightColor: '#1f2937',
    borderTopRightRadius: 16,
    opacity: 0.25,
  },
  // Gradient fade overlays for top end
  topFade1: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.2,
  },
  topFade2: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.4,
  },
  topFade3: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.6,
  },
  topFade4: {
    position: 'absolute',
    top: 0,
    right: 28,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.8,
  },
  topFade5: {
    position: 'absolute',
    top: 0,
    right: 32,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 1.0,
  },
  // Gradient fade overlays for right end
  rightFade1: {
    position: 'absolute',
    top: 16,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.2,
  },
  rightFade2: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.4,
  },
  rightFade3: {
    position: 'absolute',
    top: 24,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.6,
  },
  rightFade4: {
    position: 'absolute',
    top: 28,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.8,
  },
  rightFade5: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 1.0,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircleChecked: {
    // backgroundColor will be set dynamically
  },
  innerCircleUnchecked: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    // borderColor will be set dynamically
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalCountChecked: {
    // color will be set dynamically
  },
  goalCountUnchecked: {
    // color will be set dynamically
  },
  plusSign: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6b7280',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#1f2937',
    alignSelf: 'center',
    opacity: 0.2,
  },
  fadeSeparator: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  fadeSegment1: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.02,
  },
  fadeSegment2: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.08,
  },
  fadeSegment3: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.12,
  },
  fadeSegment4: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.15,
  },
  fadeSegment5: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.15,
  },
  fadeSegment6: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.12,
  },
  fadeSegment7: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.08,
  },
  fadeSegment8: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.02,
  },
  solidFadeSeparator: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  solidFadeTop: {
    width: 1,
    height: 4,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  solidFadeMiddle: {
    width: 1,
    height: 32,
    backgroundColor: '#1f2937',
    opacity: 0.2,
  },
  solidFadeBottom: {
    width: 1,
    height: 4,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  // Overlay styles
  overlayContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dayOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.5)',
  },
  overlayDayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  overlayMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // New styles for profile row boxes
  profileRowBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  profileBox: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  profileBoxCenter: {
    // No extra centering needed, already centered
  },
  spacer: {
    width: 12,
  },
  diagonalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  diagonalBarSegment: {
    width: 16,
    height: 6,
    backgroundColor: '#129490',
    borderRadius: 3,
    marginRight: 2, // reduced from 5 to 2
    transform: [{ rotate: '-25deg' }],
  },
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
  leftBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  leftBarSegment: {
    width: '18%', // percentage width for equal segments
    height: '100%',
    marginRight: '2%', // small, consistent gap
    borderRadius: 5,
    transform: [{ skewX: '-18deg' }],
  },
  leftBarLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  leftBarLabelTopLeft: {
    fontSize: 11,
    color: '#1f2937',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 1,
  },
  leftBarLabelOutside: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '500',
    letterSpacing: 0.2,
    marginLeft: 8,
    marginBottom: 2,
  },
  leftBarLabelAbove: {
    fontSize: 11,
    color: '#1f2937', // match keepTrackTitle
    fontWeight: '500',
    letterSpacing: 0.2,
    position: 'absolute',
    top: -20,
    left: 8,
    zIndex: 1,
  },
  tasksRowBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  taskSubBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskSubBoxText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  bigTasksRowBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // gap: 16, // spacing handled by marginLeft on second box
  },
  bigTaskBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  bigTaskBoxText: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '600',
  },
  profileInfoBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardLabel: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginLeft: 4,
    marginBottom: 16, // match keepTrackTitle spacing
  },
  competitionsLabel: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: '600',
    letterSpacing: 0.2,
    alignSelf: 'flex-start',
    marginBottom: 16, // match keepTrackTitle spacing
  },
  levelTextbox: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: 'stretch',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBoxLabel: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '500',
    letterSpacing: 0.2,
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 1,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noGoalsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noGoalsText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  createGoalButton: {
    backgroundColor: '#129490',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createGoalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  noGoalsTracker: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noGoalsTrackerText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  goalTrackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  goalTrackerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  goalTrackerTitleContainer: {
    flex: 1,
  },
  goalTrackerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalTrackerFrequency: {
    fontSize: 12,
    color: '#6b7280',
  },
  dayContainerInactive: {
    opacity: 0.3,
  },
  dayLabelInactive: {
    color: '#d1d5db',
  },
  dayCircleInactive: {
    borderColor: '#e5e7eb',
  },
  expandedGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  expandedGoalIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  expandedGoalContent: {
    flex: 1,
  },
  expandedGoalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#129490',
    marginBottom: 2,
  },
  expandedGoalTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledGoalItem: {
    opacity: 0.5,
  },
  disabledCheckInButton: {
    // backgroundColor will be applied dynamically
  },
  disabledCheckInButtonText: {
    color: '#9ca3af',
  },
  completedCheckInButton: {
    // backgroundColor will be applied dynamically
  },
  completedCheckInButtonText: {
    color: '#ffffff',
  },
  // New styles for the mini arrow
  arrowContainerAbove: {
    position: 'absolute',
    top: -16, // adjust as needed for spacing
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  arrowDownAbove: {
    fontSize: 10,
    color: '#129490',
  },
  // Calendar navigation styles
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  calendarTitleContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Calendar day styles
  pastDayContainer: {
    opacity: 0.6,
  },
  futureDayContainer: {
    opacity: 0.8,
  },
  dayDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  todayDate: {
    color: '#129490',
    fontWeight: '600',
  },
  goalCount: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  keepTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  radarChartContainer: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 1,
  },
  radarChartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'left',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  overallScore: {
    alignItems: 'center',
    marginTop: 16,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  // New Profile Picture Component Styles
  profilePictureContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  profilePictureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 0,
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
  // Circular Goals Styles
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
  circularGoalTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 110,
    lineHeight: 14,
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
  circularProgressPercent: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },
  // Expanded Profile Card Styles
  expandIconContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  expandedProfileInfo: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 16,
    padding: 20,
    paddingBottom: 6,
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
  // Orange Progress Bar Styles (duplicated from ActionScreen)
  orangeProgressContainer: {
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pink Progress Bar Styles
  pinkProgressContainer: {
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconContainer: {
    marginLeft: 12,
    padding: 8,
  },
  infoIconUnderneath: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
}); 