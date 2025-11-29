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
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Calculate card width for snap interval (matching ActionScreen pattern)
  const { width } = Dimensions.get('window');
  const horizontalPadding = 24 * 2;
  const gap = 12;
  const cardWidth = Math.max(160, (width - horizontalPadding - gap) / 2);
  const cardMargin = 16; // marginRight from ChallengeCard
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
      
      // Only show upcoming challenges (challenges that haven't started yet)
      const upcoming = allChallenges.filter(challenge => {
        const startDate = new Date(challenge.start_date);
        return now < startDate;
      });
      
      setChallenges(upcoming);
    } catch (error) {
      // Error loading challenges
      setChallenges([]);
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
        <View style={styles.headerLeftSpacer} />
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Compete
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => navigation.getParent()?.navigate('Leaderboard')}
          >
            <Ionicons name="podium-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
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

        {/* Challenges Section */}
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
          ) : challenges.length === 0 ? (
            <View style={styles.emptyChallengesContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No upcoming challenges available
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
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={handleChallengePress}
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
    position: 'relative',
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