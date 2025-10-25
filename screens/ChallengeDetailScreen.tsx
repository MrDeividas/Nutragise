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
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { challengesService } from '../lib/challengesService';
import { ChallengeWithDetails, ChallengeProgress } from '../types/challenges';
import ChallengeSubmissionModal from '../components/ChallengeSubmissionModal';

const { width } = Dimensions.get('window');

export default function ChallengeDetailScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { challengeId } = route.params;
  
  const [challenge, setChallenge] = useState<ChallengeWithDetails | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
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
    setShowSubmissionModal(true);
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

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading challenge details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Challenge not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor(challenge.category);
  const daysRemaining = getDaysRemaining();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
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
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>£{challenge.entry_fee || 0}</Text>
            <Text style={styles.statLabel}>investment</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>£{(challenge.participants?.length || 0) * (challenge.entry_fee || 0)}</Text>
            <Text style={styles.statLabel}>shared pot</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{challenge.participants?.length || 0}</Text>
            <Text style={styles.statLabel}>players</Text>
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

              {/* Days Remaining */}
              <View style={[styles.daysRemainingContainer, { backgroundColor: `${categoryColor}20` }]}>
                <Ionicons name="calendar-outline" size={16} color={categoryColor} />
                <Text style={[styles.daysRemainingText, { color: categoryColor }]}>
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Challenge ended'}
                </Text>
              </View>

              {/* Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={[styles.requirementsTitle, { color: theme.textPrimary }]}>
                  Requirements
                </Text>
                {challenge.requirements?.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={categoryColor} />
                    <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                      {req.requirement_text}
                    </Text>
                  </View>
                ))}
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
            </View>
          </View>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.tabContent}>
            <View style={styles.scheduleContainer}>
              {Array.from({ length: challenge.duration_weeks }, (_, weekIndex) => (
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
                  
                  {Array.from({ length: 7 }, (_, dayIndex) => (
                    <View key={dayIndex} style={styles.activityItem}>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityNumber, { color: theme.textSecondary }]}>
                          Activity {dayIndex + 1}
                        </Text>
                        <Text style={[styles.activityName, { color: theme.textPrimary }]}>
                          10k steps a day
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            <View style={styles.detailsContainer}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  Challenge Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category:</Text>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{challenge.category}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Duration:</Text>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{formatDuration(challenge.duration_weeks)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Entry Fee:</Text>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{formatEntryFee(challenge.entry_fee)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Participants:</Text>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{challenge.participant_count}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  Requirements Details
                </Text>
                {challenge.requirements?.map((req, index) => (
                  <View key={index} style={styles.requirementDetail}>
                    <Text style={[styles.requirementDetailTitle, { color: theme.textPrimary }]}>
                      Requirement {index + 1}
                    </Text>
                    <Text style={[styles.requirementDetailText, { color: theme.textSecondary }]}>
                      {req.requirement_text}
                    </Text>
                    <Text style={[styles.requirementDetailMeta, { color: theme.textSecondary }]}>
                      Frequency: {req.frequency} • Target: {req.target_count} times
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { borderTopColor: theme.border }]}>
        {isParticipating ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: categoryColor }]}
            onPress={handleUploadPhoto}
          >
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Upload Photo</Text>
          </TouchableOpacity>
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
    backgroundColor: '#ffffff',
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
    borderWidth: 1,
    borderColor: '#F3F4F6',
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