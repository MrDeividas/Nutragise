import React, { useState, useEffect, useCallback } from 'react';
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
import { adminService, ContentReportItem } from '../lib/adminService';
import { challengesService } from '../lib/challengesService';
import { Challenge, ChallengeReviewData, ParticipantWithSubmissions } from '../types/challenges';
import PendingChallengeCard from '../components/PendingChallengeCard';
import ParticipantReviewCard from '../components/ParticipantReviewCard';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { getChallengeDisplayTitle } from '../lib/challengeTitleUtils';

const DARK = '#1f2937';
const MUTED = '#6B7280';

type ViewMode = 'list' | 'detail';
type ListTab = 'challenges' | 'posts';

const REASON_LABELS: Record<string, string> = {
  inappropriate_photo: 'Inappropriate photo',
  inappropriate_content: 'Inappropriate content',
  block_account: 'Account blocked',
};

export default function AdminReviewScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listTab, setListTab] = useState<ListTab>('challenges');
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [pendingReports, setPendingReports] = useState<ContentReportItem[]>([]);
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
  const [warningReport, setWarningReport] = useState<ContentReportItem | null>(null);
  const [warningMessage, setWarningMessage] = useState(
    'Your recent post was reported and reviewed. Please keep community content respectful.'
  );
  const [banReport, setBanReport] = useState<ContentReportItem | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && viewMode === 'list') {
      void checkForEndedChallenges();
      void loadQueues();
    }
  }, [isAdmin, viewMode]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin && viewMode === 'list') {
        const timer = setTimeout(() => {
          void checkForEndedChallenges();
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
    } catch {
      Alert.alert('Error', 'Failed to verify admin status.');
      navigation.goBack();
    }
  };

  const checkForEndedChallenges = async () => {
    try {
      await challengesService.checkAndUpdateEndedChallenges();
    } catch (error) {
      console.error('Error checking for ended challenges:', error);
    }
  };

  const loadQueues = async () => {
    try {
      setLoading(true);
      const [challenges, reports] = await Promise.all([
        adminService.getPendingChallenges(),
        adminService.getPendingContentReports(),
      ]);
      setPendingChallenges(challenges);
      setPendingReports(reports);
    } catch (error) {
      console.error('Error loading admin queues:', error);
      Alert.alert('Error', 'Failed to load review queues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkForEndedChallenges();
    await loadQueues();
  };

  const loadChallengeDetails = async (challengeId: string) => {
    try {
      setLoading(true);
      const reviewData = await adminService.getChallengeReviewData(challengeId);
      setSelectedChallenge(reviewData);
      setViewMode('detail');
    } catch {
      Alert.alert('Error', 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateUser = async (userId: string, reason: string) => {
    if (!selectedChallenge) return;
    await adminService.invalidateUserSubmission(
      selectedChallenge.challenge.id,
      userId,
      user!.id,
      reason
    );
    await loadChallengeDetails(selectedChallenge.challenge.id);
    Alert.alert('Success', 'User submission invalidated.');
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
          onPress: async () => {
            setIsProcessing(true);
            try {
              await adminService.verifyAllParticipants(selectedChallenge.challenge.id, user.id);
              Alert.alert('Success', 'Challenge approved and money distributed.');
              setViewMode('list');
              setSelectedChallenge(null);
              await loadQueues();
            } catch {
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
    Alert.alert('Approve Challenge', 'Approve this challenge and distribute money to valid winners?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await adminService.approveChallengeAfterInvalidation(selectedChallenge.challenge.id, user.id);
            Alert.alert('Success', 'Challenge approved and money distributed.');
            setViewMode('list');
            await loadQueues();
          } catch {
            Alert.alert('Error', 'Failed to approve challenge.');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleRejectChallenge = async () => {
    if (!selectedChallenge || !user) return;
    if (rejectStep === 1) {
      setShowRejectModal(true);
      setRejectStep(1);
      return;
    }
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason.');
      return;
    }
    setIsProcessing(true);
    try {
      await adminService.rejectChallenge(selectedChallenge.challenge.id, user.id, '', true);
      await adminService.rejectChallenge(
        selectedChallenge.challenge.id,
        user.id,
        rejectionReason.trim(),
        false
      );
      Alert.alert('Success', 'Challenge rejected.');
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectStep(1);
      setViewMode('list');
      await loadQueues();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject challenge.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveReport = async (report: ContentReportItem, status: 'dismissed' | 'actioned') => {
    if (!user?.id) return;
    try {
      await adminService.resolveContentReport(report.id, user.id, status);
      setPendingReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update report.');
    }
  };

  const handleDeletePost = (report: ContentReportItem) => {
    if (!report.post_id) {
      Alert.alert('Unavailable', 'No post is linked to this report.');
      return;
    }
    Alert.alert(
      'Delete post?',
      'This permanently removes the post from the community feed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              setIsProcessing(true);
              await adminService.deleteReportedPost(report, user.id);
              setPendingReports((prev) => prev.filter((r) => r.id !== report.id));
              Alert.alert('Deleted', 'The post has been removed.');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete post.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const openWarnUser = (report: ContentReportItem) => {
    const targetUserId = report.reported_user_id || report.postPreview?.userId;
    if (!targetUserId) {
      Alert.alert('Unavailable', 'No user is linked to this report.');
      return;
    }
    setWarningMessage(
      'Your recent post was reported and reviewed. Please keep community content respectful.'
    );
    setWarningReport(report);
  };

  const sendWarning = async () => {
    if (!user?.id || !warningReport) return;
    try {
      setIsProcessing(true);
      await adminService.warnReportedUser(warningReport, user.id, warningMessage);
      setPendingReports((prev) => prev.filter((r) => r.id !== warningReport.id));
      setWarningReport(null);
      Alert.alert('Sent', 'Warning message sent to the user.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send warning.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openBanUser = (report: ContentReportItem) => {
    const targetUserId = report.reported_user_id || report.postPreview?.userId;
    if (!targetUserId) {
      Alert.alert('Unavailable', 'No user is linked to this report.');
      return;
    }
    if (targetUserId === user?.id) {
      Alert.alert('Not available', 'You can’t ban yourself.');
      return;
    }
    setBanReport(report);
  };

  const applyBan = async (duration: 3 | 7 | 'forever') => {
    if (!user?.id || !banReport) return;
    const label =
      duration === 'forever' ? 'permanently' : `for ${duration} days`;
    Alert.alert(
      'Confirm ban',
      `Ban @${banReport.reportedUser?.username || 'user'} ${label}? They won’t be able to sign in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await adminService.banReportedUser(banReport, user.id, duration);
              setPendingReports((prev) => prev.filter((r) => r.id !== banReport.id));
              setBanReport(null);
              Alert.alert('Banned', `User banned ${label}.`);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to ban user.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (!isAdmin) return null;

  if (viewMode === 'list') {
    const totalCount = pendingChallenges.length + pendingReports.length;

    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Review</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.backButton} disabled={refreshing}>
              <Ionicons name="refresh" size={22} color={DARK} style={refreshing ? { opacity: 0.4 } : undefined} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 24 + bottomNavPadding }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DARK} />}
          >
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Review queue</Text>
              <Text style={styles.heroSupport}>
                Only flagged challenge submissions and reported community posts appear here.
              </Text>
              <Text style={styles.heroCount}>{totalCount} item{totalCount === 1 ? '' : 's'} waiting</Text>
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, listTab === 'challenges' && styles.tabActive]}
                onPress={() => setListTab('challenges')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, listTab === 'challenges' && styles.tabTextActive]}>
                  Challenges ({pendingChallenges.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, listTab === 'posts' && styles.tabActive]}
                onPress={() => setListTab('posts')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, listTab === 'posts' && styles.tabTextActive]}>
                  Posts ({pendingReports.length})
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={DARK} />
              </View>
            ) : listTab === 'challenges' ? (
              pendingChallenges.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={MUTED} />
                  <Text style={styles.emptyTitle}>No flagged challenges</Text>
                  <Text style={styles.emptySupport}>
                    Challenges with no participants or no flagged submissions stay out of this queue.
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
              )
            ) : pendingReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="shield-checkmark-outline" size={40} color={MUTED} />
                <Text style={styles.emptyTitle}>No flagged posts</Text>
                <Text style={styles.emptySupport}>
                  Reports from the community feed will show up here.
                </Text>
              </View>
            ) : (
              pendingReports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reasonChip}>
                      <Text style={styles.reasonChipText}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </Text>
                    </View>
                    <Text style={styles.reportTime}>{formatDate(report.created_at)}</Text>
                  </View>

                  <Text style={styles.reportMeta}>
                    Reported by @{report.reporter?.username || 'user'}
                    {report.reportedUser
                      ? ` · about @${report.reportedUser.username || 'user'}`
                      : ''}
                  </Text>

                  {report.postPreview?.photoUrl ? (
                    <Image source={{ uri: report.postPreview.photoUrl }} style={styles.reportPhoto} />
                  ) : null}

                  {!!report.postPreview?.content?.trim() && (
                    <Text style={styles.reportContent} numberOfLines={4}>
                      {report.postPreview.content.trim()}
                    </Text>
                  )}

                  {!report.postPreview && (
                    <Text style={styles.reportMissing}>Original post unavailable</Text>
                  )}

                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => resolveReport(report, 'dismissed')}
                      activeOpacity={0.85}
                      disabled={isProcessing}
                    >
                      <Text style={styles.dismissBtnText}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.warnBtn}
                      onPress={() => openWarnUser(report)}
                      activeOpacity={0.85}
                      disabled={isProcessing}
                    >
                      <Text style={styles.warnBtnText}>Warn user</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeletePost(report)}
                      activeOpacity={0.85}
                      disabled={isProcessing || !report.post_id}
                    >
                      <Text style={styles.deleteBtnText}>Delete post</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.banBtn}
                      onPress={() => openBanUser(report)}
                      activeOpacity={0.85}
                      disabled={isProcessing}
                    >
                      <Text style={styles.banBtnText}>Ban user</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Modal
            visible={!!warningReport}
            transparent
            animationType="fade"
            onRequestClose={() => setWarningReport(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Send warning</Text>
                  <TouchableOpacity onPress={() => setWarningReport(null)}>
                    <Ionicons name="close" size={22} color={MUTED} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalBody}>
                  This will notify{' '}
                  {warningReport?.reportedUser?.username
                    ? `@${warningReport.reportedUser.username}`
                    : 'the user'}{' '}
                  in-app and by push.
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  value={warningMessage}
                  onChangeText={setWarningMessage}
                  multiline
                  autoCapitalize="sentences"
                  autoCorrect
                  placeholder="Warning message…"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setWarningReport(null)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionedBtn, { flex: 1 }, (!warningMessage.trim() || isProcessing) && styles.btnDisabled]}
                    onPress={sendWarning}
                    disabled={!warningMessage.trim() || isProcessing}
                  >
                    <Text style={styles.actionedBtnText}>{isProcessing ? 'Sending…' : 'Send warning'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={!!banReport}
            transparent
            animationType="fade"
            onRequestClose={() => setBanReport(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ban user</Text>
                  <TouchableOpacity onPress={() => setBanReport(null)}>
                    <Ionicons name="close" size={22} color={MUTED} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalBody}>
                  Choose how long to ban{' '}
                  {banReport?.reportedUser?.username
                    ? `@${banReport.reportedUser.username}`
                    : 'this user'}
                  . They won’t be able to sign in while banned.
                </Text>
                <TouchableOpacity
                  style={styles.banOption}
                  onPress={() => applyBan(3)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.banOptionTitle}>3 days</Text>
                  <Text style={styles.banOptionDesc}>Temporary ban</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.banOption}
                  onPress={() => applyBan(7)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.banOptionTitle}>7 days</Text>
                  <Text style={styles.banOptionDesc}>Temporary ban</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.banOption, styles.banOptionForever]}
                  onPress={() => applyBan('forever')}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.banOptionTitle, { color: '#DC2626' }]}>Forever</Text>
                  <Text style={styles.banOptionDesc}>Permanent ban</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalCancel, { marginTop: 8 }]} onPress={() => setBanReport(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  if (!selectedChallenge) return null;

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setViewMode('list');
              setSelectedChallenge(null);
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getChallengeDisplayTitle(selectedChallenge.challenge.title)}
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 + bottomNavPadding }}
        >
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Challenge details</Text>
            <InfoRow label="Category" value={selectedChallenge.challenge.category} />
            <InfoRow label="End date" value={formatDate(selectedChallenge.challenge.end_date)} />
            <InfoRow label="Entry fee" value={`£${selectedChallenge.challenge.entry_fee}`} />
            <InfoRow
              label="Pot size"
              value={`£${(selectedChallenge.challenge.participant_count || 0) * selectedChallenge.challenge.entry_fee}`}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Statistics</Text>
            <View style={styles.statsGrid}>
              <Stat value={selectedChallenge.completionStats.totalParticipants} label="Total" />
              <Stat value={selectedChallenge.completionStats.validParticipants} label="Valid" color="#059669" />
              <Stat value={selectedChallenge.completionStats.invalidParticipants} label="Invalid" color="#DC2626" />
              <Stat
                value={`${Math.round(selectedChallenge.completionStats.averageCompletion)}%`}
                label="Avg complete"
              />
            </View>
          </View>

          <Text style={styles.sectionLabelOutside}>
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

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryBtn, isProcessing && styles.btnDisabled]}
              onPress={handleVerifyAll}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Verify all & approve</Text>
            </TouchableOpacity>

            {selectedChallenge.completionStats.invalidParticipants > 0 && (
              <TouchableOpacity
                style={[styles.secondaryBtn, isProcessing && styles.btnDisabled]}
                onPress={handleApproveAfterInvalidation}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>Approve valid winners</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
              onPress={() => {
                setRejectStep(1);
                setShowRejectModal(true);
              }}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.rejectBtnText}>Reject challenge</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showSubmissionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmissionsModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSubmissionsModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedParticipant?.user.display_name || selectedParticipant?.user.username}
                    ’s submissions
                  </Text>
                  <TouchableOpacity onPress={() => setShowSubmissionsModal(false)}>
                    <Ionicons name="close" size={22} color={MUTED} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 420 }}>
                  {selectedParticipant?.submissions.map((submission) => (
                    <View key={submission.id} style={styles.submissionItem}>
                      {submission.photo_url ? (
                        <Image source={{ uri: submission.photo_url }} style={styles.submissionImage} />
                      ) : (
                        <View style={[styles.submissionImage, styles.submissionImageEmpty]}>
                          <Ionicons name="image-outline" size={24} color={MUTED} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.submissionDate}>
                          {new Date(submission.submitted_at).toLocaleDateString()}
                          {submission.is_flagged ? ' · Flagged' : ''}
                        </Text>
                        {!!submission.submission_notes && (
                          <Text style={styles.submissionNotes}>{submission.submission_notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                  {selectedParticipant?.submissions.length === 0 && (
                    <Text style={styles.emptySupport}>No submissions found</Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRejectModal(false);
          setRejectStep(1);
          setRejectionReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {rejectStep === 1 ? 'Reject challenge?' : 'Confirm rejection'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectStep(1);
                  setRejectionReason('');
                }}
              >
                <Ionicons name="close" size={22} color={MUTED} />
              </TouchableOpacity>
            </View>

            {rejectStep === 1 ? (
              <>
                <Text style={styles.modalBody}>
                  This can’t be undone. Participants will be notified.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => {
                      setShowRejectModal(false);
                      setRejectStep(1);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalDanger} onPress={() => setRejectStep(2)}>
                    <Text style={styles.modalDangerText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalBody}>Please provide a rejection reason:</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Enter rejection reason…"
                  placeholderTextColor="#9CA3AF"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  autoCapitalize="sentences"
                  autoCorrect
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => {
                      setRejectStep(1);
                      setRejectionReason('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalDanger, (!rejectionReason.trim() || isProcessing) && styles.btnDisabled]}
                    onPress={handleRejectChallenge}
                    disabled={isProcessing || !rejectionReason.trim()}
                  >
                    <Text style={styles.modalDangerText}>
                      {isProcessing ? 'Rejecting…' : 'Confirm'}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Stat({
  value,
  label,
  color = DARK,
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSupport: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 10,
  },
  heroCount: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: DARK,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  emptySupport: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
    textAlign: 'center',
    fontWeight: '500',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reasonChip: {
    backgroundColor: '#FEF2F2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  reportTime: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  reportMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    marginBottom: 10,
  },
  reportPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  reportContent: {
    fontSize: 14,
    lineHeight: 20,
    color: DARK,
    fontWeight: '500',
    marginBottom: 12,
  },
  reportMissing: {
    fontSize: 13,
    color: MUTED,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dismissBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  warnBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },
  warnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  deleteBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  banBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111827',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: DARK,
  },
  banBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  banOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  banOptionForever: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  banOptionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginBottom: 2,
  },
  banOptionDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  actionedBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: DARK,
  },
  actionedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  sectionLabelOutside: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  actionButtons: {
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: DARK,
    fontSize: 16,
    fontWeight: '700',
  },
  rejectBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginRight: 8,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 14,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 14,
    color: DARK,
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: MUTED,
  },
  modalDanger: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDangerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submissionItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  submissionImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  submissionImageEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  submissionDate: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 4,
  },
  submissionNotes: {
    fontSize: 14,
    color: DARK,
    fontWeight: '500',
  },
});
