import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { challengesService } from '../lib/challengesService';
import { ChallengeWithDetails, ChallengeProgress } from '../types/challenges';
import ChallengeSubmissionModal from '../components/ChallengeSubmissionModal';
import CustomBackground from '../components/CustomBackground';

const { width } = Dimensions.get('window');

export default function ChallengeDetailScreen({ route }: any) {
  const navigation = useNavigation() as any;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { challengeId } = route.params;
  
  const [challenge, setChallenge] = useState<ChallengeWithDetails | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    loadChallengeDetails();
  }, [challengeId]);

  const loadChallengeDetails = async () => {
    try {
      setLoading(true);
      const challengeData = await challengesService.getChallengeById(challengeId);
      setChallenge(challengeData);
      
      if (challengeData && user) {
        const isParticipatingCheck = await challengesService.isUserParticipating(challengeId, user.id);
        setIsParticipating(isParticipatingCheck);
        
        if (isParticipatingCheck) {
          const progressData = await challengesService.getChallengeProgress(challengeData.id, user.id);
          setProgress(progressData);
        }
      }
    } catch (error) {
      console.error('Error loading challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return;
    
    try {
      setJoining(true);
      const success = await challengesService.joinChallenge(challenge.id, user.id);
      
      if (success) {
        Alert.alert('Success', 'You have joined the challenge!');
        setIsParticipating(true);
        // Reload progress
        const progressData = await challengesService.getChallengeProgress(challenge.id, user.id);
        setProgress(progressData);
      } else {
        Alert.alert('Error', 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to join challenge');
    } finally {
      setJoining(false);
    }
  };

  const handleUploadPhoto = () => {
    // Check if challenge has started
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    
    if (now < startDate) {
      Alert.alert(
        'Challenge Not Started',
        'This challenge has not started yet. You cannot submit photos until the challenge begins.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setShowSubmissionModal(true);
  };

  const handleLeaveChallenge = async () => {
    if (!user || !challenge) return;
    
    try {
      setLeaving(true);
      
      const now = new Date();
      const startDate = new Date(challenge.start_date);
      
      if (now >= startDate) {
        Alert.alert(
          'Cannot Leave',
          'This challenge has already started. You cannot leave an active challenge.'
        );
        setLeaving(false);
        return;
      }
      
      const success = await challengesService.leaveChallenge(challenge.id, user.id);
      
      if (success) {
        Alert.alert('Success', 'You have left the challenge');
        setIsParticipating(false);
        setProgress(null);
        navigation.goBack(); // Go back to list since user is no longer participating
      } else {
        Alert.alert('Error', 'Failed to leave challenge');
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to leave challenge');
    } finally {
      setLeaving(false);
    }
  };

  const handleSubmitPhoto = async (photoUrl: string, notes?: string) => {
    if (!user || !challenge) return;
    
    try {
      const success = await challengesService.submitChallengeProof(
        challenge.id,
        user.id,
        photoUrl,
        selectedWeek,
        notes
      );
      
      if (success) {
        Alert.alert('Success', 'Photo submitted successfully!');
        // Reload progress
        const progressData = await challengesService.getChallengeProgress(challenge.id, user.id);
        setProgress(progressData);
      } else {
        Alert.alert('Error', 'Failed to submit photo');
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to submit photo');
    }
  };

  const hasTodaysSubmission = () => {
    if (!progress || !challenge) return false;
    
    const today = new Date();
    const todayStr = today.toDateString();
    
    // Check all submissions across all weeks
    const allSubmissions = Object.values(progress.submissions_by_week).flat();
    
    return allSubmissions.some(sub => {
      const subDate = new Date(sub.submitted_at);
      return subDate.toDateString() === todayStr;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fitness':
        return '#10B981';
      case 'wellness':
        return '#8B5CF6';
      case 'nutrition':
        return '#F59E0B';
      case 'mindfulness':
        return '#06B6D4';
      case 'learning':
        return '#EF4444';
      case 'creativity':
        return '#EC4899';
      case 'productivity':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const formatDuration = (weeks: number) => {
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  };

  const formatEntryFee = (fee: number) => {
    if (fee === 0) return 'Free';
    return `£${fee}`;
  };

  const getTimeRemaining = () => {
    if (!challenge) return { days: 0, hours: 0, minutes: 0, ended: true };
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    // Check if challenge is upcoming
    if (now.getTime() < startDate.getTime()) {
      const diffMs = startDate.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return { days, hours, minutes, ended: false, upcoming: true };
    }
    
    // Active challenge - calculate time until end
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, ended: true };
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, ended: false, upcoming: false };
  };

  const formatDateRange = () => {
    if (!challenge) return '';
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  if (loading) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading challenge details...
            </Text>
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  if (!challenge) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              Challenge not found
            </Text>
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  const categoryColor = getCategoryColor(challenge.category);

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range */}
        <View style={styles.dateContainer}>
          <Text style={[styles.dateRange, { color: theme.textSecondary }]}>
            {formatDateRange()}
          </Text>
        </View>

        {/* Challenge Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>
            {challenge.title}
          </Text>
        </View>

        {/* Challenge Image */}
        <View style={styles.imageContainer}>
          {challenge.image_url && (
            <Image
              source={{ uri: challenge.image_url }}
              style={styles.challengeImage}
              resizeMode="cover"
            />
          )}
        </View>
        
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>£{challenge.entry_fee || 0}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>investment</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>£{(challenge.participants?.length || 0) * (challenge.entry_fee || 0)}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>shared pot</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{challenge.participants?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>players</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('about')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'about' ? theme.textPrimary : theme.textSecondary }
            ]}>
              About
            </Text>
            {activeTab === 'about' && <View style={[styles.tabUnderline, { backgroundColor: theme.textPrimary }]} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('schedule')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'schedule' ? theme.textPrimary : theme.textSecondary }
            ]}>
              Schedule
            </Text>
            {activeTab === 'schedule' && <View style={[styles.tabUnderline, { backgroundColor: theme.textPrimary }]} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('details')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'details' ? theme.textPrimary : theme.textSecondary }
            ]}>
              Details
            </Text>
            {activeTab === 'details' && <View style={[styles.tabUnderline, { backgroundColor: theme.textPrimary }]} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {/* Challenge Info */}
            <View style={styles.challengeInfo}>
              {/* Category Tag */}
              <View style={[styles.categoryTag, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>{challenge.category}</Text>
              </View>

              {/* Description */}
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {challenge.description}
              </Text>

              {/* Duration and Entry Fee */}
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {formatDuration(challenge.duration_weeks)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="card-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {formatEntryFee(challenge.entry_fee)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {challenge.participant_count} participants
                  </Text>
                </View>
              </View>

              {/* Time Remaining */}
              <View style={[styles.daysRemainingContainer, { backgroundColor: `${categoryColor}20` }]}>
                <Ionicons name="calendar-outline" size={16} color={categoryColor} />
                <Text style={[styles.daysRemainingText, { color: categoryColor }]}>
                  {(() => {
                    const timeRemaining = getTimeRemaining();
                    if (timeRemaining.ended) {
                      return 'Challenge ended';
                    }
                    if (timeRemaining.upcoming) {
                      if (timeRemaining.days > 0) {
                        return `Starts in ${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
                      } else if (timeRemaining.hours > 0) {
                        return `Starts in ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
                      } else {
                        return `Starts in ${timeRemaining.minutes}m`;
                      }
                    }
                    if (timeRemaining.days > 0) {
                      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m left`;
                    } else if (timeRemaining.hours > 0) {
                      return `${timeRemaining.hours}h ${timeRemaining.minutes}m left`;
                    } else if (timeRemaining.minutes > 0) {
                      return `${timeRemaining.minutes}m left`;
                    } else {
                      return 'Less than 1m left';
                    }
                  })()}
                </Text>
              </View>

              {/* Host Info */}
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Hosted by
              </Text>
              <View style={[styles.hostContainer, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.hostAvatar, { backgroundColor: categoryColor }]}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.hostInfo}>
                  <Text style={[styles.hostName, { color: theme.textPrimary }]}>
                    {challenge.creator?.display_name || challenge.creator?.username || 'NutrApp Team'}
                  </Text>
                  <Text style={[styles.hostRole, { color: theme.textSecondary }]}>
                    Challenge Host
                  </Text>
                </View>
              </View>

              {/* Leave Challenge Button (only if participating and not started) */}
              {isParticipating && (() => {
                const now = new Date();
                const startDate = new Date(challenge.start_date);
                const hasStarted = now >= startDate;
                
                if (!hasStarted) {
                  return (
                    <TouchableOpacity
                      style={[styles.leaveButtonSmall, { borderColor: '#EF4444' }]}
                      onPress={() => {
                        Alert.alert(
                          'Leave Challenge',
                          'Are you sure you want to leave this challenge?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Leave', style: 'destructive', onPress: handleLeaveChallenge }
                          ]
                        );
                      }}
                      disabled={leaving}
                    >
                      {leaving ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <>
                          <Ionicons name="close-outline" size={16} color="#EF4444" />
                          <Text style={styles.leaveButtonTextSmall}>Leave Challenge</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
            </View>
          </View>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.tabContent}>
            <View style={styles.scheduleContainer}>
              {Array.from({ length: challenge.duration_weeks }, (_, weekIndex) => {
                const challengeStartDate = new Date(challenge.start_date);
                const weekStartDate = new Date(challengeStartDate);
                weekStartDate.setDate(challengeStartDate.getDate() + (weekIndex * 7));
                
                return (
                  <View key={weekIndex} style={styles.weekSection}>
                    <View style={styles.weekHeader}>
                      <Text style={[styles.weekTitle, { color: theme.textPrimary }]}>
                        Week {weekIndex + 1}
                      </Text>
                      <View style={styles.weekSeparator} />
                      <Text style={[styles.weekActivityCount, { color: theme.textSecondary }]}>
                        7 Activities
                      </Text>
                    </View>
                    
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const activityDate = new Date(weekStartDate);
                      activityDate.setDate(weekStartDate.getDate() + dayIndex);
                      
                      // Check if submission exists for this date
                      const hasSubmission = progress?.submissions_by_week[weekIndex + 1]?.some(sub => {
                        const subDate = new Date(sub.submitted_at);
                        return subDate.toDateString() === activityDate.toDateString();
                      });
                      
                      return (
                        <View key={dayIndex} style={styles.activityItem}>
                          <View style={styles.activityContent}>
                            <Text style={[styles.activityNumber, { color: theme.textSecondary }]}>
                              Activity {dayIndex + 1}
                            </Text>
                            <Text style={[styles.activityName, { color: theme.textPrimary }]}>
                              10k steps a day
                            </Text>
                          </View>
                          {hasSubmission && (
                            <View style={[styles.submissionCheck, { backgroundColor: categoryColor }]}>
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            <View style={styles.detailsContainer}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  How to Win
                </Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  Complete all daily activities for the entire challenge duration. Each day you must complete the required 10k steps and upload verification proof. Missing any day will disqualify you from winning the pot.
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  How to Verify
                </Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  Upload a photo of your step counter or fitness app showing 10,000+ steps each day. Photos must be clear and show the date. You can upload one verification photo per day during the challenge period.
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  How the Pot is Split
                </Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  At the end of the challenge, all participants who completed every single day will split the total pot equally. If you miss any day, you forfeit your entry fee and are not eligible for any winnings. The more people who complete the challenge, the bigger the pot!
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { borderTopColor: theme.border }]}>
        {isParticipating ? (
          (() => {
            const now = new Date();
            const startDate = new Date(challenge.start_date);
            const hasStarted = now >= startDate;
            const hasSubmittedToday = hasTodaysSubmission();
            
            return (
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: hasSubmittedToday ? '#10B981' : (hasStarted ? categoryColor : theme.textSecondary),
                    opacity: hasSubmittedToday || !hasStarted ? 0.8 : 1
                  }
                ]}
                onPress={handleUploadPhoto}
                disabled={!hasStarted || hasSubmittedToday}
              >
                {hasSubmittedToday ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Done</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>
                      {hasStarted ? 'Upload Photo' : 'Challenge Not Started'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })()
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: categoryColor }]}
            onPress={handleJoinChallenge}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Join Challenge</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Submission Modal */}
      <ChallengeSubmissionModal
        visible={showSubmissionModal}
        challenge={challenge}
        weekNumber={selectedWeek}
        onClose={() => setShowSubmissionModal(false)}
        onSubmit={handleSubmitPhoto}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  challengeImage: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
  },
  imageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  challengeInfo: {
    padding: 20,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  daysRemainingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsContainer: {
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
  },
  hostRole: {
    fontSize: 14,
  },
  bottomAction: {
    padding: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 16,
  },
  leaveButtonTextSmall: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 10,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
  dateRange: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  tabUnderline: {
    width: 30,
    height: 2,
    borderRadius: 1,
  },
  tabContent: {
    flex: 1,
  },
  scheduleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  weekSection: {
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 8,
  },
  weekActivityCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityContent: {
    flex: 1,
  },
  activityNumber: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  submissionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  requirementDetail: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  requirementDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementDetailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  requirementDetailMeta: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 60,
    marginTop: -20,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});