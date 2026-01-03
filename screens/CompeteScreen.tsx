import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { useAuthStore } from '../state/authStore';
import { socialService } from '../lib/socialService';
import { challengesService } from '../lib/challengesService';
import { emailService } from '../lib/emailService';
import { supabase } from '../lib/supabase';
import ChallengeCard from '../components/ChallengeCard';
import { Challenge, CreateChallengeData } from '../types/challenges';
import UpgradeToProModal from '../components/UpgradeToProModal';
import CreateChallengeModal from '../components/CreateChallengeModal';
import JoinPrivateChallengeModal from '../components/JoinPrivateChallengeModal';
import MyChallengesSection from '../components/MyChallengesSection';
import CreateJoinBox from '../components/CreateJoinBox';

export default function CompeteScreen({ navigation }: any) {
  const { theme } = useTheme();
  const bottomNavPadding = useBottomNavPadding();
  const { user, initialize, loading } = useAuthStore();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [freeChallenges, setFreeChallenges] = useState<Challenge[]>([]);
  const [investChallenges, setInvestChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(new Set());
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [myCreatedChallenges, setMyCreatedChallenges] = useState<Challenge[]>([]);
  const [privateChallenges, setPrivateChallenges] = useState<Challenge[]>([]);
  const [myChallengesExpanded, setMyChallengesExpanded] = useState(true);
  const [privateChallengesExpanded, setPrivateChallengesExpanded] = useState(true);
  const [investExpanded, setInvestExpanded] = useState(true);
  const [freeExpanded, setFreeExpanded] = useState(true);
  
  const { width } = Dimensions.get('window');
  const horizontalPadding = 24 * 2;
  const gap = 12; // Match habit card width calculation
  const cardWidth = Math.max(160, (width - horizontalPadding - gap) / 2);
  const cardMargin = 10; // Match habit card spacing
  const snapInterval = cardWidth + cardMargin;

  useEffect(() => {
    // Initialize auth store if needed
    if (!user && !loading) {
      initialize();
    }
    
    // Only load data when auth is ready
    if (!loading) {
      loadChallenges();
      loadUserProfile();
    }
  }, [loading]);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile?.is_pro && user) {
      loadUserChallenges();
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (user) {
      loadPrivateChallenges();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (user?.id) {
      try {
        const profile = await socialService.getProfile(user.id);
        
        if (!profile) {
          // Try direct database query as fallback
          const { data: directProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (directProfile) {
            setUserProfile(directProfile);
          }
        } else {
          setUserProfile(profile);
        }
      } catch (error) {
        // Error loading user profile
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear cache to force fresh data
    const { apiCache } = await import('../lib/apiCache');
    apiCache.clear();
    console.log('🔄 [CompeteScreen] Cache cleared, loading fresh challenges...');
    await Promise.all([
      loadChallenges(),
      loadPrivateChallenges(),
      userProfile?.is_pro ? loadUserChallenges() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };


  const loadChallenges = async () => {
    try {
      setChallengesLoading(true);
      
      // Clear cache to ensure fresh data (especially after SQL cleanup)
      const { apiCache } = await import('../lib/apiCache');
      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));
      console.log('🔄 [CompeteScreen] Cache cleared before loading challenges');
      
      // Handle recurring challenges first
      await challengesService.handleRecurringChallenges();
      
      const allChallenges = await challengesService.getChallenges();
      const now = new Date();
      
      // Debug: Log all challenges
      console.log('🔍 [CompeteScreen] All challenges from service:', allChallenges.length);
      const smileChallenges = allChallenges.filter(c => c.title?.includes('Smile'));
      console.log('🔍 [CompeteScreen] Smile challenges found:', smileChallenges.length);
      smileChallenges.forEach(c => {
        console.log('  -', c.title, 'entry_fee:', c.entry_fee, 'start:', c.start_date, 'end:', c.end_date, 'is_recurring:', c.is_recurring);
      });
      
      // Show only upcoming challenges (not active, not ended)
      // Filter out private challenges from public lists
      const availableChallenges = allChallenges.filter(challenge => {
        const startDate = new Date(challenge.start_date);
        const endDate = new Date(challenge.end_date);
        endDate.setHours(23, 59, 59, 999); // Include full end day
        const isNotEnded = now <= endDate; // Changed to <= to include the full end day
        const isUpcoming = now < startDate; // Only show challenges that haven't started yet
        const isPublic = challenge.visibility !== 'private'; // Only show public challenges
        const shouldShow = isNotEnded && isUpcoming && isPublic;
        
        if (challenge.title?.includes('Smile')) {
          console.log('🔍 [CompeteScreen] Smile challenge filter:', {
            title: challenge.title,
            now: now.toISOString(),
            endDate: endDate.toISOString(),
            isPublic,
            isNotEnded,
            shouldShow
          });
        }
        return shouldShow;
      });
      
      // Check participation and completion status for each challenge
      const joinedIds = new Set<string>();
      const completedIds = new Set<string>();
      if (user?.id) {
        await Promise.all(
          availableChallenges.map(async (challenge) => {
            // Check if user is participating
            const isJoined = await challengesService.isUserParticipating(challenge.id, user.id);
            if (isJoined) {
              joinedIds.add(challenge.id);
              
              // Check if user has completed this challenge (status = 'completed')
              const { data: participation } = await supabase
                .from('challenge_participants')
                .select('status')
                .eq('challenge_id', challenge.id)
                .eq('user_id', user.id)
                .single();
              
              if (participation?.status === 'completed') {
                completedIds.add(challenge.id);
              }
            }
          })
        );
        setJoinedChallengeIds(joinedIds);
        setCompletedChallengeIds(completedIds);
        console.log('🔍 [CompeteScreen] User has joined', joinedIds.size, 'challenges');
        console.log('🔍 [CompeteScreen] User has completed', completedIds.size, 'challenges');
      }
      
      // Deduplicate by ID (final safety check)
      const uniqueChallenges = new Map<string, Challenge>();
      availableChallenges.forEach(challenge => {
        if (!uniqueChallenges.has(challenge.id)) {
          uniqueChallenges.set(challenge.id, challenge);
        } else {
          console.log(`⚠️ [CompeteScreen] Removing duplicate challenge ID: ${challenge.id} - ${challenge.title}`);
        }
      });
      
      // Additional deduplication for recurring challenges with same title + entry_fee
      // For recurring daily challenges, show only the most relevant one (prioritize today, then tomorrow, etc.)
      const recurringChallengeMap = new Map<string, Challenge>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Sort challenges by date (today first, then tomorrow, then future) to ensure correct prioritization
      const sortedChallenges = Array.from(uniqueChallenges.values()).sort((a, b) => {
        const dateA = new Date(a.start_date);
        dateA.setHours(0, 0, 0, 0);
        const dateB = new Date(b.start_date);
        dateB.setHours(0, 0, 0, 0);
        
        const aIsToday = dateA.getTime() === today.getTime();
        const bIsToday = dateB.getTime() === today.getTime();
        const aIsTomorrow = dateA.getTime() === tomorrow.getTime();
        const bIsTomorrow = dateB.getTime() === tomorrow.getTime();
        
        // Today comes first
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        // Tomorrow comes second
        if (aIsTomorrow && !bIsTomorrow) return -1;
        if (!aIsTomorrow && bIsTomorrow) return 1;
        // Then by date
        return dateA.getTime() - dateB.getTime();
      });
      
      sortedChallenges.forEach(challenge => {
        if (challenge.is_recurring) {
          const dedupKey = `${challenge.title}_${challenge.entry_fee || 0}`;
          const existing = recurringChallengeMap.get(dedupKey);
          
          if (!existing) {
            recurringChallengeMap.set(dedupKey, challenge);
          } else {
            // Compare dates to find the most relevant one
            const existingDate = new Date(existing.start_date);
            existingDate.setHours(0, 0, 0, 0);
            const currentDate = new Date(challenge.start_date);
            currentDate.setHours(0, 0, 0, 0);
            
            // Priority: today (0) > tomorrow (1) > future dates (2+)
            const existingIsToday = existingDate.getTime() === today.getTime();
            const existingIsTomorrow = existingDate.getTime() === tomorrow.getTime();
            const currentIsToday = currentDate.getTime() === today.getTime();
            const currentIsTomorrow = currentDate.getTime() === tomorrow.getTime();
            
            let shouldReplace = false;
            
            if (currentIsToday && !existingIsToday) {
              // Current is today, existing is not - replace
              shouldReplace = true;
            } else if (currentIsTomorrow && !existingIsToday && !existingIsTomorrow) {
              // Current is tomorrow, existing is neither today nor tomorrow - replace
              shouldReplace = true;
            } else if (currentDate < existingDate && !existingIsToday && !existingIsTomorrow) {
              // Current is earlier and neither is today/tomorrow - prefer earlier
              shouldReplace = true;
            }
            
            if (shouldReplace) {
              console.log(`🔄 [CompeteScreen] Replacing recurring challenge: "${challenge.title}" (${challenge.entry_fee || 0})`);
              console.log(`   ❌ Removing: ${existing.start_date} (ID: ${existing.id})`);
              console.log(`   ✅ Keeping: ${challenge.start_date} (ID: ${challenge.id})`);
              recurringChallengeMap.set(dedupKey, challenge);
            } else {
              console.log(`🔄 [CompeteScreen] Skipping recurring challenge: "${challenge.title}" (${challenge.entry_fee || 0})`);
              console.log(`   ✅ Keeping: ${existing.start_date} (ID: ${existing.id})`);
              console.log(`   ❌ Skipping: ${challenge.start_date} (ID: ${challenge.id})`);
            }
          }
        } else {
          // Non-recurring challenges: use title + entry_fee + date as key
          const dedupKey = `${challenge.title}_${challenge.entry_fee || 0}_${challenge.start_date}`;
          if (!recurringChallengeMap.has(dedupKey)) {
            recurringChallengeMap.set(dedupKey, challenge);
          }
        }
      });
      
      const deduplicatedChallenges = Array.from(recurringChallengeMap.values());
      
      // Separate free and investment challenges
      const free = deduplicatedChallenges.filter(challenge => !challenge.entry_fee || challenge.entry_fee === 0);
      const invest = deduplicatedChallenges.filter(challenge => challenge.entry_fee && challenge.entry_fee > 0);
      
      console.log('🔍 [CompeteScreen] Final counts - available:', deduplicatedChallenges.length, 'free:', free.length, 'invest:', invest.length);
      invest.forEach(c => {
        console.log('  - Invest challenge:', c.title, 'entry_fee:', c.entry_fee);
      });
      
      setChallenges(deduplicatedChallenges);
      setFreeChallenges(free);
      setInvestChallenges(invest);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setChallenges([]);
      setFreeChallenges([]);
      setInvestChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  const loadPrivateChallenges = async () => {
    if (!user?.id) return;
    
    try {
      // Get all private challenges the user has joined OR created
      const { data: participations, error } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id);

      if (error) throw error;

      // Get challenge IDs from participations
      const participationChallengeIds = participations?.map(p => p.challenge_id) || [];

      // Also get challenges created by the user
      const { data: createdChallenges, error: createdError } = await supabase
        .from('challenges')
        .select('id')
        .eq('created_by', user.id)
        .eq('visibility', 'private');

      if (createdError) throw createdError;

      const createdChallengeIds = createdChallenges?.map(c => c.id) || [];

      // Combine both sets of challenge IDs (joined or created)
      const allPrivateChallengeIds = [...new Set([...participationChallengeIds, ...createdChallengeIds])];

      if (allPrivateChallengeIds.length === 0) {
        setPrivateChallenges([]);
        return;
      }

      // Get the actual challenge data for private challenges only
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .in('id', allPrivateChallengeIds)
        .eq('visibility', 'private')
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      // Show all private challenges (upcoming, active, and not-ended)
      // Private challenges should be visible regardless of status since user has joined or created them
      const now = new Date();
      const filteredChallenges = (challenges || []).filter(challenge => {
        const endDate = new Date(challenge.end_date);
        endDate.setHours(23, 59, 59, 999);
        // Show if challenge hasn't ended yet (includes upcoming and active)
        return now <= endDate;
      });

      // Get participant counts for all private challenges
      const challengeIds = filteredChallenges.map(c => c.id);
      const { data: participantCounts, error: countError } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      if (countError) {
        console.error('Error getting participant counts for private challenges:', countError);
      }

      // Create a map of challenge_id -> count
      const countMap = new Map<string, number>();
      if (participantCounts) {
        participantCounts.forEach((p: any) => {
          const current = countMap.get(p.challenge_id) || 0;
          countMap.set(p.challenge_id, current + 1);
        });
      }

      // Add participant_count to each challenge
      const challengesWithCounts = filteredChallenges.map(challenge => ({
        ...challenge,
        participant_count: countMap.get(challenge.id) || 0,
      }));

      setPrivateChallenges(challengesWithCounts);
      
      // Update joined challenge IDs for private challenges
      const privateJoinedIds = new Set<string>();
      challengesWithCounts.forEach(challenge => {
        privateJoinedIds.add(challenge.id);
      });
      setJoinedChallengeIds(prev => {
        const updated = new Set(prev);
        privateJoinedIds.forEach(id => updated.add(id));
        return updated;
      });
    } catch (error) {
      console.error('Error loading private challenges:', error);
      setPrivateChallenges([]);
    }
  };

  const handleChallengePress = (challenge: Challenge) => {
    // Check if challenge is pro-only and user is not pro
    if (challenge.is_pro_only && !userProfile?.is_pro) {
      setShowUpgradeModal(true);
      return;
    }
    navigation.navigate('ChallengeDetail', { challengeId: challenge.id });
  };

  const loadUserChallenges = async () => {
    if (!user?.id) return;
    try {
      const challenges = await challengesService.getUserCreatedChallenges(user.id);
      setMyCreatedChallenges(challenges);
    } catch (error) {
      console.error('Error loading user challenges:', error);
    }
  };

  const handleCreateChallenge = async (data: CreateChallengeData, type: 'private' | 'public') => {
    if (!user?.id) return;

    try {
      if (type === 'private') {
        const result = await challengesService.createUserChallenge(user.id, data);
        
        // Show join code in success message
        Alert.alert(
          'Challenge Created!',
          `Your private challenge has been created.\n\nShare this code with friends:\n\n${result.joinCode}`,
          [
            {
              text: 'Copy Code',
              onPress: () => {
                // Using Clipboard from react-native
                const Clipboard = require('react-native').Clipboard;
                Clipboard.setString(result.joinCode || '');
                Alert.alert('Copied!', 'Join code copied to clipboard');
              },
            },
            { text: 'Done' },
          ]
        );
      } else {
        // Public challenge request - send email
        const userEmail = user.email || '';
        const userName = userProfile?.username || 'User';
        
        await emailService.sendPublicChallengeRequest({
          title: data.title,
          description: data.description,
          category: data.category,
          duration_weeks: data.duration_weeks,
          entry_fee: data.entry_fee,
          requirements: data.requirements.map(r => r.requirement_text).join(', '),
          creator_email: userEmail,
          creator_username: userName,
        });
        
        Alert.alert(
          'Request Sent!',
          'Your challenge request has been sent to our team. We will review it and get back to you soon.'
        );
      }
      
      // Refresh challenges
      await Promise.all([
        loadChallenges(),
        loadUserChallenges(),
        loadPrivateChallenges(),
      ]);
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    }
  };

  const handleJoinByCode = async (code: string) => {
    if (!user?.id) return;

    try {
      await challengesService.joinChallengeByCode(user.id, code);
      Alert.alert('Success!', 'You have joined the private challenge!');
      // Reload both public and private challenges
      await Promise.all([
        loadChallenges(),
        loadPrivateChallenges(),
      ]);
      setShowJoinModal(false);
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      throw error; // Re-throw so modal can show error
    }
  };

  const handleEditChallenge = (challenge: Challenge) => {
    // TODO: Implement edit functionality
    Alert.alert('Edit Challenge', 'Edit functionality coming soon!');
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!user?.id) return;

    try {
      await challengesService.deleteUserChallenge(challengeId, user.id);
      Alert.alert('Deleted', 'Challenge has been deleted and participants refunded.');
      await loadUserChallenges();
      await loadChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      Alert.alert('Error', 'Failed to delete challenge. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => {
              console.log('🎁 RAFFLE PRESSED - Opening Raffle Screen');
              navigation.navigate('Raffle');
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="gift" size={24} color={theme.primary} />
          </TouchableOpacity>
          {userProfile?.is_pro && (
            <Text style={[styles.proBadge, { color: theme.primary }]}>Pro</Text>
          )}
        </View>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Compete
        </Text>
        
          <TouchableOpacity 
            onPress={() => navigation.getParent()?.navigate('Leaderboard')}
          style={{ zIndex: 1 }}
          >
            <Ionicons name="podium-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomNavPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EA580C"
            colors={['#EA580C']}
          />
        }
      >
        {/* Create/Join Challenge Buttons - Available to all users */}
        <CreateJoinBox
          onCreatePress={() => {
            // Check if user is Pro before allowing challenge creation
            if (!userProfile?.is_pro) {
              setShowUpgradeModal(true);
              return;
            }
            setShowCreateModal(true);
          }}
          onJoinPress={() => setShowJoinModal(true)}
        />

        {/* Private Challenges Section - For challenges joined via code */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setPrivateChallengesExpanded(!privateChallengesExpanded)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="lock-closed" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Private Challenges
                </Text>
              </View>
              <Ionicons 
                name={privateChallengesExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
            {privateChallengesExpanded && (
              <View style={styles.challengesContent}>
              {challengesLoading ? (
                <View style={styles.challengesLoadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                </View>
              ) : privateChallenges.length === 0 ? (
                <View style={styles.emptyChallengesContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No private challenges found
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.challengesScrollContent}
                  style={{ overflow: 'visible' }}
                >
                {privateChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onPress={() => handleChallengePress(challenge)}
                    isJoined={joinedChallengeIds.has(challenge.id)}
                    isCompleted={completedChallengeIds.has(challenge.id)}
                  />
                ))}
                </ScrollView>
            )}
          </View>
        )}
        </View>

        {/* My Challenges Section - PRO only (for challenges created by user) */}
        {userProfile?.is_pro && (
          <View style={styles.section}>
          <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setMyChallengesExpanded(!myChallengesExpanded)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="trophy" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  My Challenges
                </Text>
              </View>
              <Ionicons 
                name={myChallengesExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.textSecondary} 
              />
          </TouchableOpacity>
            {myChallengesExpanded && (
              <MyChallengesSection
                challenges={myCreatedChallenges}
                onEdit={handleEditChallenge}
                onDelete={handleDeleteChallenge}
              />
            )}
        </View>
        )}

        {/* Investment Challenges Section */}
        {investChallenges.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setInvestExpanded(!investExpanded)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="wallet" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Invest
                </Text>
              </View>
              <Ionicons 
                name={investExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.textSecondary} 
              />
              </TouchableOpacity>
            
            {investExpanded && (
            <View style={styles.challengesContent}>
              {challengesLoading ? (
                <View style={styles.challengesLoadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.challengesScrollContent}
                  style={{ overflow: 'visible' }}
                >
                  {investChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onPress={handleChallengePress}
                      isJoined={joinedChallengeIds.has(challenge.id)}
                      isCompleted={completedChallengeIds.has(challenge.id)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
            )}
          </View>
        )}

        {/* Free Challenges Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setFreeExpanded(!freeExpanded)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Everyone Can Play
            </Text>
            <Ionicons 
              name={freeExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.textSecondary} 
            />
            </TouchableOpacity>
          
          {freeExpanded && (
          <View style={styles.challengesContent}>
            {challengesLoading ? (
              <View style={styles.challengesLoadingContainer}>
                <ActivityIndicator size="large" color="#EA580C" />
              </View>
            ) : freeChallenges.length === 0 ? (
              <View style={styles.emptyChallengesContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No upcoming free challenges available
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={snapInterval}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.challengesScrollContent}
                style={{ overflow: 'visible' }}
              >
                {freeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onPress={handleChallengePress}
                    isJoined={joinedChallengeIds.has(challenge.id)}
                    isCompleted={completedChallengeIds.has(challenge.id)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
          )}
        </View>

      </ScrollView>

      {/* Upgrade to Pro Modal */}
      <UpgradeToProModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateChallenge}
      />

      {/* Join Private Challenge Modal */}
      <JoinPrivateChallengeModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinByCode}
      />
    </SafeAreaView>
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
    paddingBottom: 20,
    borderBottomWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  proBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerLeftSpacer: {
    width: 24,
    zIndex: 1,
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
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 0, // Padding is handled dynamically via style prop
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingBottom: 0,
  },
  challengesContent: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginLeft: 32,
    marginBottom: 16,
  },
  leaderboardTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  leaderboardTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  leaderboardTabActive: {
    // No background, just text color change
  },
  leaderboardTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengesLoadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChallengesContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengesScrollContent: {
    paddingRight: 24,
  },
}); 
