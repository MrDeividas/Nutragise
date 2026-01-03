import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { adminService } from '../lib/adminService';
import { challengesService } from '../lib/challengesService';
import { Challenge, ChallengeReviewData, ParticipantWithSubmissions } from '../types/challenges';
import PendingChallengeCard from '../components/PendingChallengeCard';
import ParticipantReviewCard from '../components/ParticipantReviewCard';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';

type ViewMode = 'list' | 'detail';

export default function AdminReviewScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithSubmissions | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectStep, setRejectStep] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && viewMode === 'list') {
      checkForEndedChallenges();
      loadPendingChallenges();
    }
  }, [isAdmin, viewMode]);

  // Check for ended challenges when screen comes into focus (only if not already checked)
  useFocusEffect(
    React.useCallback(() => {
      if (isAdmin && viewMode === 'list') {
        // Small delay to avoid duplicate calls on initial mount
        const timer = setTimeout(() => {
          checkForEndedChallenges();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isAdmin, viewMode])
  );

  const checkAdminStatus = async () => {
    if (!user?.id) return;
    try {
      const admin = await adminService.isAdmin(user.id);
      setIsAdmin(admin);
      if (!admin) {
        Alert.alert('Access Denied', 'You do not have admin privileges.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      Alert.alert('Error', 'Failed to verify admin status.');
      navigation.goBack();
    }
  };

  const checkForEndedChallenges = async () => {
    try {
      // Check for challenges that have ended and need to be marked as pending
      await challengesService.checkAndUpdateEndedChallenges();
    } catch (error) {
      console.error('Error checking for ended challenges:', error);
      // Don't show alert for this - it's a background process
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First check for ended challenges
      await checkForEndedChallenges();
      // Then reload pending challenges
      await loadPendingChallenges();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadPendingChallenges = async () => {
    try {
      setLoading(true);
      const challenges = await adminService.getPendingChallenges();
      setPendingChallenges(challenges);
    } catch (error) {
      console.error('Error loading pending challenges:', error);
      Alert.alert('Error', 'Failed to load pending challenges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChallengeDetails = async (challengeId: string) => {
    try {
      setLoading(true);
      const reviewData = await adminService.getChallengeReviewData(challengeId);
      setSelectedChallenge(reviewData);
      setViewMode('detail');
    } catch (error) {
      console.error('Error loading challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateUser = async (userId: string, reason: string) => {
    if (!selectedChallenge) return;
    try {
      await adminService.invalidateUserSubmission(
        selectedChallenge.challenge.id,
        userId,
        user!.id,
        reason
      );
      // Reload challenge details
      await loadChallengeDetails(selectedChallenge.challenge.id);
      Alert.alert('Success', 'User submission invalidated.');
    } catch (error) {
      console.error('Error invalidating user:', error);
      throw error;
    }
  };

  const handleVerifyAll = async () => {
    if (!selectedChallenge || !user) return;

    Alert.alert(
      'Verify All & Approve',
      'This will approve the challenge and distribute money to all valid winners. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify All',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await adminService.verifyAllParticipants(selectedChallenge.challenge.id, user.id);
              Alert.alert('Success', 'Challenge approved and money distributed.');
              setViewMode('list');
              await loadPendingChallenges();
            } catch (error) {
              console.error('Error verifying all:', error);
              Alert.alert('Error', 'Failed to approve challenge.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleApproveAfterInvalidation = async () => {
    if (!selectedChallenge || !user) return;

    Alert.alert(
      'Approve Challenge',
      'Approve this challenge and distribute money to valid winners?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await adminService.approveChallengeAfterInvalidation(selectedChallenge.challenge.id, user.id);
              Alert.alert('Success', 'Challenge approved and money distributed.');
              setViewMode('list');
              await loadPendingChallenges();
            } catch (error) {
              console.error('Error approving challenge:', error);
              Alert.alert('Error', 'Failed to approve challenge.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectChallenge = async () => {
    if (!selectedChallenge || !user) return;

    if (rejectStep === 1) {
      // First step: Show warning
      setShowRejectModal(true);
      setRejectStep(1);
    } else if (rejectStep === 2) {
      // Second step: Confirm with reason
      if (!rejectionReason.trim()) {
        Alert.alert('Error', 'Please provide a rejection reason.');
        return;
      }

      setIsProcessing(true);
      try {
        // First call stores intent
        await adminService.rejectChallenge(selectedChallenge.challenge.id, user.id, '', true);
        // Second call confirms
        await adminService.rejectChallenge(selectedChallenge.challenge.id, user.id, rejectionReason.trim(), false);
        Alert.alert('Success', 'Challenge rejected.');
        setShowRejectModal(false);
        setRejectionReason('');
        setRejectStep(1);
        setViewMode('list');
        await loadPendingChallenges();
      } catch (error) {
        console.error('Error rejecting challenge:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject challenge.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isAdmin) {
    return null;
  }

  // List View
  if (viewMode === 'list') {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Pending Reviews
            </Text>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={handleRefresh} 
                style={styles.refreshButton}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={24} 
                  color={theme.textPrimary} 
                  style={refreshing ? styles.refreshingIcon : undefined}
                />
              </TouchableOpacity>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>{pendingChallenges.length}</Text>
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 24 + bottomNavPadding }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : pendingChallenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No pending challenges
                </Text>
              </View>
            ) : (
              pendingChallenges.map((challenge) => (
                <PendingChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={(c) => loadChallengeDetails(c.id)}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  // Detail View
  if (!selectedChallenge) {
    return null;
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => {
              setViewMode('list');
              setSelectedChallenge(null);
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {selectedChallenge.challenge.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 + bottomNavPadding }}
        >
          {/* Challenge Info */}
          <View style={[styles.challengeInfoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Challenge Details</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Category:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {selectedChallenge.challenge.category}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>End Date:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {formatDate(selectedChallenge.challenge.end_date)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Entry Fee:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                £{selectedChallenge.challenge.entry_fee}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Pot Size:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                £{selectedChallenge.challenge.participant_count! * selectedChallenge.challenge.entry_fee}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {selectedChallenge.completionStats.totalParticipants}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {selectedChallenge.completionStats.validParticipants}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Valid</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {selectedChallenge.completionStats.invalidParticipants}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Invalid</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {Math.round(selectedChallenge.completionStats.averageCompletion)}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Complete</Text>
              </View>
            </View>
          </View>

          {/* Participants */}
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Participants ({selectedChallenge.participants.length})
            </Text>
            {selectedChallenge.participants.map((participant) => (
              <ParticipantReviewCard
                key={participant.participant.id}
                participant={participant}
                onInvalidate={handleInvalidateUser}
                onViewSubmissions={(p) => {
                  setSelectedParticipant(p);
                  setShowSubmissionsModal(true);
                }}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.verifyButton, { backgroundColor: '#10B981' }]}
              onPress={handleVerifyAll}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Verify All & Approve</Text>
            </TouchableOpacity>

            {selectedChallenge.completionStats.invalidParticipants > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton, { backgroundColor: theme.primary }]}
                onPress={handleApproveAfterInvalidation}
                disabled={isProcessing}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Approve Valid Winners</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, { borderColor: '#EF4444' }]}
              onPress={() => {
                setRejectStep(1);
                setShowRejectModal(true);
              }}
              disabled={isProcessing}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={[styles.rejectButtonText, { color: '#EF4444' }]}>Reject Challenge</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Submissions Modal */}
      <Modal
        visible={showSubmissionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubmissionsModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSubmissionsModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    {selectedParticipant?.user.display_name || selectedParticipant?.user.username}'s Submissions
                  </Text>
                  <TouchableOpacity onPress={() => setShowSubmissionsModal(false)}>
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.submissionsList}>
                  {selectedParticipant?.submissions.map((submission) => (
                    <View key={submission.id} style={[styles.submissionItem, { borderColor: theme.border }]}>
                      <Image source={{ uri: submission.photo_url }} style={styles.submissionImage} />
                      <View style={styles.submissionInfo}>
                        <Text style={[styles.submissionDate, { color: theme.textSecondary }]}>
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </Text>
                        {submission.submission_notes && (
                          <Text style={[styles.submissionNotes, { color: theme.textPrimary }]}>
                            {submission.submission_notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                  {selectedParticipant?.submissions.length === 0 && (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No submissions found
                    </Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Rejection Modal (Two-Step) */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowRejectModal(false);
          setRejectStep(1);
          setRejectionReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {rejectStep === 1 ? 'Reject Challenge?' : 'Confirm Rejection'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectStep(1);
                  setRejectionReason('');
                }}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {rejectStep === 1 ? (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Are you sure you want to reject this challenge? This action cannot be undone and all participants will be notified.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => {
                      setShowRejectModal(false);
                      setRejectStep(1);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => setRejectStep(2)}
                  >
                    <Text style={styles.confirmButtonText}>Continue to Reject</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Please provide a reason for rejecting this challenge:
                </Text>
                <TextInput
                  style={[styles.reasonInput, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.textPrimary }]}
                  placeholder="Enter rejection reason..."
                  placeholderTextColor={theme.textSecondary}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => {
                      setRejectStep(1);
                      setRejectionReason('');
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleRejectChallenge}
                    disabled={isProcessing || !rejectionReason.trim()}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
  },
  refreshingIcon: {
    opacity: 0.5,
  },
  badgeContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  challengeInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  participantsSection: {
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  approveButton: {
    backgroundColor: '#3B82F6',
  },
  rejectButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // IMPORTANT: Always set white background for modals
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    opacity: 1,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submissionsList: {
    maxHeight: 400,
  },
  submissionItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submissionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  submissionNotes: {
    fontSize: 14,
  },
});

