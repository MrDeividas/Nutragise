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
import { supabase } from '../lib/supabase';
import ChallengeCard from '../components/ChallengeCard';
import { Challenge } from '../types/challenges';

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
  
  const { width } = Dimensions.get('window');
  const horizontalPadding = 24 * 2;
  const gap = 12;
  const cardWidth = Math.max(160, (width - horizontalPadding - gap) / 2);
  const cardMargin = 16;
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
    await loadChallenges();
    setRefreshing(false);
  };


  const loadChallenges = async () => {
    try {
      setChallengesLoading(true);
      
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
      
      // Show both upcoming AND active challenges (not yet ended)
      const availableChallenges = allChallenges.filter(challenge => {
        const endDate = new Date(challenge.end_date);
        const shouldShow = now < endDate;
        if (challenge.title?.includes('Smile')) {
          console.log('🔍 [CompeteScreen] Smile challenge filter:', {
            title: challenge.title,
            now: now.toISOString(),
            endDate: endDate.toISOString(),
            shouldShow
          });
        }
        return shouldShow;
      });
      
      // Check participation status for each challenge
      const joinedIds = new Set<string>();
      if (user?.id) {
        await Promise.all(
          availableChallenges.map(async (challenge) => {
            const isJoined = await challengesService.isUserParticipating(challenge.id, user.id);
            if (isJoined) {
              joinedIds.add(challenge.id);
            }
          })
        );
        setJoinedChallengeIds(joinedIds);
        console.log('🔍 [CompeteScreen] User has joined', joinedIds.size, 'challenges');
      }
      
      // Separate free and investment challenges
      const free = availableChallenges.filter(challenge => !challenge.entry_fee || challenge.entry_fee === 0);
      const invest = availableChallenges.filter(challenge => challenge.entry_fee && challenge.entry_fee > 0);
      
      console.log('🔍 [CompeteScreen] Final counts - available:', availableChallenges.length, 'free:', free.length, 'invest:', invest.length);
      invest.forEach(c => {
        console.log('  - Invest challenge:', c.title, 'entry_fee:', c.entry_fee);
      });
      
      setChallenges(availableChallenges);
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

  const handleChallengePress = (challenge: Challenge) => {
    navigation.navigate('ChallengeDetail', { challengeId: challenge.id });
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
        {/* Create Your Own Game Button */}
        <View style={styles.createGameSection}>
          <TouchableOpacity 
            style={[styles.createGameButton, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}
            onPress={() => Alert.alert('Coming Soon', 'Create your own game feature is coming soon!')}
          >
            <View style={styles.createGameContent}>
              <View style={styles.profilePicContainer}>
                {/* Circular dashed outline */}
                <View style={styles.dashedCircleOutline} />
                
                {(() => {
                  const avatarUrl = userProfile?.avatar_url || user?.avatar_url;
                  
                  // If no user is logged in, show a default placeholder
                  if (!user) {
                    return (
                      <View style={[styles.profilePicPlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
                        <Ionicons name="person" size={20} color={theme.textSecondary} />
                      </View>
                    );
                  }
                  
                  return avatarUrl ? (
                    <Image 
                      source={{ uri: avatarUrl }} 
                      style={styles.profilePic}
                      onError={(error) => {
                        // Handle image load error silently
                      }}
                      onLoad={() => {
                        // Image loaded successfully
                      }}
                    />
                  ) : (
                    <View style={[styles.profilePicPlaceholder, { backgroundColor: 'rgba(128, 128, 128, 0.3)' }]}>
                      <Ionicons name="person" size={20} color={theme.textSecondary} />
                    </View>
                  );
                })()}
                <View style={styles.plusIconContainer}>
                  <Ionicons name="add" size={12} color="#000000" />
                </View>
              </View>
              <Text style={[styles.createGameText, { color: theme.textPrimary }]}>
                Create Your Own Game
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Investment Challenges Section */}
        {investChallenges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="wallet" size={20} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Invest
                </Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: theme.textSecondary }]}>
                  See all
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
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
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Free Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Everyone Can Play
            </Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: theme.textSecondary }]}>
                See all
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
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
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>

      </ScrollView>
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
  createGameSection: {
    marginBottom: 24,
  },
  createGameButton: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createGameContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  profilePicPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedCircleOutline: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    borderStyle: 'dashed',
    top: -4,
    left: -4,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.15)',
  },
  createGameText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  challengesContent: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
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
