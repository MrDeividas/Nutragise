import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { challengesService } from '../lib/challengesService';
import { walletService } from '../lib/walletService';
import { stripeService } from '../lib/stripeService';
import { challengePotService } from '../lib/challengePotService';
import { socialService } from '../lib/socialService';
import { supabase } from '../lib/supabase';
import {
  ChallengeWithDetails,
  ChallengeProgress,
  ChallengeSubmission,
  ChallengeRequirement,
  getChallengeWeekNumber,
  getCurrentWeekForRecurringChallenge,
  isRecurringChallenge,
} from '../types/challenges';
import { PotStatus } from '../types/wallet';
import ChallengeSubmissionModal from '../components/ChallengeSubmissionModal';
import CustomBackground from '../components/CustomBackground';
import UpgradeToProModal from '../components/UpgradeToProModal';
import { postsService } from '../lib/postsService';
import { getDailyPostDate, localDeviceCalendarYmd } from '../lib/timeService';
import { getChallengeDisplayTitle, isCuratedGymChallengeForCardHero, challengeAllowsGalleryProofUpload, stripTrailingChallengeWord } from '../lib/challengeTitleUtils';

const { width, height: windowHeight } = Dimensions.get('window');

/** Prefer today's proof with a photo; else most recent submission that has a photo. */
function getParticipantPreviewSubmission(subs: ChallengeSubmission[]): ChallengeSubmission | null {
  const todayStr = localDeviceCalendarYmd();
  const todaySub = subs.find((s) => {
    const d = s.submission_date || s.submitted_at?.split('T')?.[0];
    return d === todayStr && s.photo_url;
  });
  if (todaySub) return todaySub;
  const withPhoto = subs
    .filter((s) => s.photo_url)
    .sort((a, b) => {
      const da = a.submission_date || a.submitted_at.slice(0, 10);
      const db = b.submission_date || b.submitted_at.slice(0, 10);
      return db.localeCompare(da);
    });
  return withPhoto[0] ?? null;
}

function submissionCalendarDate(s: ChallengeSubmission): string | null {
  const raw = s.submission_date || s.submitted_at?.split('T')?.[0];
  if (!raw || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  return raw.slice(0, 10);
}

/** Distinct calendar days with a submission, within challenge [startStr, endStr] inclusive (YYYY-MM-DD). */
function countDistinctSubmissionDaysInRange(
  subs: ChallengeSubmission[],
  startStr: string,
  endStr: string
): number {
  const set = new Set<string>();
  for (const s of subs) {
    const d = submissionCalendarDate(s);
    if (d && d >= startStr && d <= endStr) set.add(d);
  }
  return set.size;
}

function getSortedRequirements(challenge: ChallengeWithDetails): ChallengeRequirement[] {
  const reqs = challenge.requirements ?? [];
  return [...reqs].sort((a, b) => (a.requirement_order ?? 0) - (b.requirement_order ?? 0));
}

function getPrimaryRequirement(challenge: ChallengeWithDetails): ChallengeRequirement | null {
  const sorted = getSortedRequirements(challenge);
  return sorted[0] ?? null;
}

function getScheduleActivityLabel(challenge: ChallengeWithDetails): string {
  const primary = getPrimaryRequirement(challenge);
  const text = primary?.requirement_text?.trim();
  if (text) return text;
  const title = getChallengeDisplayTitle(challenge.title)?.trim();
  if (title) return title;
  return 'Daily check-in';
}

function getWeekActivityCountLabel(challenge: ChallengeWithDetails): string {
  const primary = getPrimaryRequirement(challenge);
  const frequency = primary?.frequency ?? 'daily';
  if (frequency === 'weekly') {
    const count = Math.max(1, primary?.target_count ?? 1);
    return `${count} ${count === 1 ? 'Activity' : 'Activities'}`;
  }
  return '7 Activities';
}

function getHowToWinText(challenge: ChallengeWithDetails): string {
  const reqs = getSortedRequirements(challenge);
  const hasPot = (challenge.entry_fee ?? 0) > 0;
  const missConsequence = hasPot
    ? 'Missing required check-ins will disqualify you from winning the pot.'
    : 'Missing required check-ins means you will not complete the challenge.';

  if (reqs.length === 0) {
    const fallback = challenge.description?.trim();
    if (fallback) {
      return `${fallback} ${missConsequence}`;
    }
    return `Complete the challenge activities for the full duration. ${missConsequence}`;
  }

  const lines = reqs.map((req) => {
    const freq = req.frequency === 'weekly' ? 'weekly' : 'daily';
    const target = req.target_count > 0 ? `, ${req.target_count} required` : '';
    return `• ${req.requirement_text} (${freq}${target})`;
  });

  return `Complete the following to finish this challenge:\n${lines.join('\n')}\n\n${missConsequence}`;
}

function getHowToVerifyText(challenge: ChallengeWithDetails): string {
  const primary = getPrimaryRequirement(challenge);
  const requirementHint = primary?.requirement_text?.trim();
  const frequency = primary?.frequency ?? 'daily';
  const period = frequency === 'weekly' ? 'week' : 'day';
  const allowsGallery = challengeAllowsGalleryProofUpload(challenge.title);
  const type = challenge.verification_type ?? 'photo';

  if (type === 'manual') {
    return requirementHint
      ? `Submit proof for review: ${requirementHint}. The host will verify your submissions manually.`
      : 'Submit your proof for host review. Manual verification is used for this challenge.';
  }

  if (type === 'automatic') {
    return requirementHint
      ? `Progress is tracked automatically for: ${requirementHint}. Keep doing the activity for the full challenge duration.`
      : 'Progress is tracked automatically. Keep completing the challenge activity for the full duration.';
  }

  // photo (default)
  const subject = requirementHint
    ? `Take a clear photo that proves: ${requirementHint}.`
    : 'Take a clear verification photo for each required check-in.';
  const galleryNote = allowsGallery
    ? ' You may upload a screenshot or gallery photo for this challenge.'
    : ' Photos should be clear and show the date when possible.';
  return `${subject}${galleryNote} You can submit one verification photo per ${period} during the challenge period.`;
}

function upsertSubmissionByDate(
  subs: ChallengeSubmission[],
  nextSubmission: ChallengeSubmission
): ChallengeSubmission[] {
  const nextDate = submissionCalendarDate(nextSubmission);
  const filtered = nextDate
    ? subs.filter((s) => submissionCalendarDate(s) !== nextDate)
    : subs.filter((s) => s.id !== nextSubmission.id);

  return [nextSubmission, ...filtered].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export default function ChallengeDetailScreen({ route }: any) {
  const navigation = useNavigation() as any;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  /** Support both param names; avoid crash if params missing briefly */
  const challengeId = route.params?.challengeId ?? route.params?.id;
  const { initPaymentSheet, presentPaymentSheet, collectBankAccountForSetup } = useStripe();
  
  const [challenge, setChallenge] = useState<ChallengeWithDetails | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('about');
  const [potStatus, setPotStatus] = useState<PotStatus | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [participantTodaySubmissions, setParticipantTodaySubmissions] = useState<Set<string>>(new Set());
  /** All submissions grouped by userId, enriched with has_flagged_by_me */
  const [participantSubmissions, setParticipantSubmissions] = useState<Record<string, ChallengeSubmission[]>>({});
  const [flaggingSubmissionId, setFlaggingSubmissionId] = useState<string | null>(null);
  /** Submission currently being previewed full-screen (null = closed) */
  const [previewedSubmission, setPreviewedSubmission] = useState<ChallengeSubmission | null>(null);
  /** Existing submission to pre-load when replacing today's photo */
  const [replacingSubmission, setReplacingSubmission] = useState<ChallengeSubmission | null>(null);
  /** 1-indexed day selected in the participants day picker */
  const [selectedParticipantDay, setSelectedParticipantDay] = useState<number>(1);

  useEffect(() => {
    loadChallengeDetails();
    loadUserProfile();
  }, [challengeId]);

  // Refresh progress when schedule tab becomes active (but not on every render)
  const prevActiveTab = useRef(activeTab);
  useEffect(() => {
    if (activeTab === 'schedule' && prevActiveTab.current !== 'schedule' && isParticipating && challenge && user) {
      const refreshProgress = async () => {
        const progressData = await challengesService.getChallengeProgress(challenge.id, user.id);
        setProgress(progressData);
        await loadParticipantTodaySubmissions(challenge.id);
      };
      refreshProgress();
    }
    if (activeTab === 'participants' && prevActiveTab.current !== 'participants' && challenge && user) {
      loadParticipantSubmissionsData(challenge.id, user.id);
      setSelectedParticipantDay(getCurrentChallengeDay());
    }
    prevActiveTab.current = activeTab;
  }, [activeTab, challenge?.id, user?.id, isParticipating]);

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

  const loadParticipantTodaySubmissions = async (challengeId: string) => {
    if (!challengeId) return;
    
    const todayDateString = localDeviceCalendarYmd();

    // Query all submissions for this challenge from today using submission_date
    const { data: submissions, error } = await supabase
      .from('challenge_submissions')
      .select('user_id, submission_date, submitted_at')
      .eq('challenge_id', challengeId)
      .eq('submission_date', todayDateString);
    
    if (!error && submissions) {
      const todayUserIds = new Set(submissions.map(sub => sub.user_id));
      
      if (__DEV__) {
        console.log('👥 Participant today submissions:', {
          challengeId,
          todayDateString,
          totalTodaySubmissions: submissions.length,
          todaySubmissions: Array.from(todayUserIds),
        });
      }
      
      setParticipantTodaySubmissions(todayUserIds);
    } else if (error) {
      console.error('❌ Error loading participant today submissions:', error);
    }
  };

  const loadParticipantSubmissionsData = async (cId: string, currentUserId: string) => {
    const data = await challengesService.getParticipantSubmissions(cId, currentUserId);
    setParticipantSubmissions(data);
  };

  const handleFlagSubmission = async (submission: ChallengeSubmission) => {
    if (!user) return;
    if (flaggingSubmissionId) return; // already processing

    if (submission.has_flagged_by_me) {
      // Offer to un-flag
      Alert.alert(
        'Remove Flag',
        'You have already flagged this submission. Do you want to remove your flag?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove Flag',
            style: 'destructive',
            onPress: async () => {
              setFlaggingSubmissionId(submission.id);
              const result = await challengesService.unflagSubmission(submission.id, user.id);
              setFlaggingSubmissionId(null);
              if (result.success) {
                if (challenge) loadParticipantSubmissionsData(challenge.id, user.id);
              } else {
                Alert.alert('Error', 'Could not remove flag. Please try again.');
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Flag Submission',
      'Flag this submission as suspicious? If flagged, it will be sent for admin review when the challenge ends.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag',
          style: 'destructive',
          onPress: async () => {
            setFlaggingSubmissionId(submission.id);
            const result = await challengesService.flagSubmission(submission.id, user.id);
            setFlaggingSubmissionId(null);
            if (result.success) {
              Alert.alert('Flagged', 'This submission has been flagged for admin review.');
              if (challenge) loadParticipantSubmissionsData(challenge.id, user.id);
            } else if (result.error === 'already_flagged') {
              Alert.alert('Already Flagged', 'You have already flagged this submission.');
            } else {
              Alert.alert('Error', 'Could not flag submission. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Load participation / progress / wallet / pot / submissions after the main challenge row.
   * Runs async so a slow or stuck secondary request never blocks the "Loading challenge details…" screen.
   */
  const loadSecondaryChallengeDetails = async (
    challengeData: ChallengeWithDetails,
    cId: string,
    userId: string
  ) => {
    try {
      const isParticipatingCheck = await challengesService.isUserParticipating(cId, userId);
      setIsParticipating(isParticipatingCheck);

      if (isParticipatingCheck) {
        try {
          const progressData = await challengesService.getChallengeProgress(challengeData.id, userId);
          if (__DEV__) {
            console.log('📊 Loaded progress data for challenge:', {
              challengeId: challengeData.id,
              challengeTitle: challengeData.title,
              isRecurring: isRecurringChallenge(challengeData),
              totalSubmissions: progressData
                ? Object.values(progressData.submissions_by_week).flat().length
                : 0,
              submissionsByWeek: progressData?.submissions_by_week,
              allSubmissions: progressData
                ? Object.values(progressData.submissions_by_week).flat().map((s) => ({
                    id: s.id,
                    week_number: s.week_number,
                    submitted_at: s.submitted_at,
                    photo_url: s.photo_url,
                    verification_status: s.verification_status,
                    date: new Date(s.submitted_at).toDateString(),
                  }))
                : [],
            });
          }
          setProgress(progressData);
        } catch (e) {
          console.error('Error loading challenge progress:', e);
        }
      }

      if (challengeData.entry_fee && challengeData.entry_fee > 0) {
        try {
          const pot = await challengePotService.getPotStatus(cId);
          setPotStatus(pot);
        } catch (e) {
          console.error('Error loading pot status:', e);
        }
      }

      try {
        const balance = await walletService.getBalance(userId);
        setWalletBalance(balance);
      } catch (e) {
        console.error('Error loading wallet balance:', e);
      }

      try {
        await loadParticipantTodaySubmissions(challengeData.id);
      } catch (e) {
        console.error('Error loading today submissions:', e);
      }

      try {
        await loadParticipantSubmissionsData(challengeData.id, userId);
      } catch (e) {
        console.error('Error loading participant submissions:', e);
      }
    } catch (error) {
      console.error('Secondary challenge details load failed:', error);
    }
  };

  const loadChallengeDetails = async () => {
    if (!challengeId) {
      setChallenge(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const challengeData = await challengesService.getChallengeById(challengeId);
      setChallenge(challengeData);

      if (challengeData && user) {
        void loadSecondaryChallengeDetails(challengeData, challengeId, user.id);
      }
    } catch (error) {
      console.error('Error loading challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details');
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  };

  /** Top up wallet by `amount`, then join challenge by debiting entry fee from wallet. */
  const chargeWalletThenJoin = async (topUpAmount: number, entryFee: number) => {
    if (!user || !challenge) return;

    const { clientSecret, paymentIntentId, stripeFee, totalAmount } =
      await stripeService.createPaymentIntent(topUpAmount, user.id, {
        userId: user.id,
        purpose: 'wallet_deposit',
      });

    if (!clientSecret) {
      throw new Error('Failed to create payment');
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Nutragise',
      paymentIntentClientSecret: clientSecret,
      defaultBillingDetails: {
        name: user.email?.split('@')[0] || 'User',
        email: user.email || undefined,
      },
      returnURL: 'nutrapp://stripe-redirect',
    });
    if (initError) throw new Error(initError.message);

    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      if (presentError.code === 'Canceled') return;
      throw new Error(presentError.message);
    }

    await walletService.depositToWallet(user.id, topUpAmount, paymentIntentId);
    const newBalance = await walletService.getBalance(user.id);
    setWalletBalance(newBalance);

    if (newBalance < entryFee) {
      throw new Error('Wallet top-up succeeded but balance is still too low. Please try again.');
    }

    const { paymentIntentId: transferId } =
      await challengesService.initiateChallengeJoinWithWallet(challenge.id, user.id, entryFee);
    await challengesService.completeChallengeJoin(challenge.id, user.id, transferId);

    const feeNote =
      stripeFee && stripeFee > 0
        ? `\n\nCard charged: £${(totalAmount || topUpAmount).toFixed(2)} (includes £${stripeFee.toFixed(2)} deposit fee)`
        : '\n\nNo deposit fee (Pro)';

    Alert.alert(
      'Joined!',
      `£${topUpAmount.toFixed(2)} added to your wallet, then £${entryFee.toFixed(2)} taken for this challenge.${feeNote}`
    );
    setIsParticipating(true);
    await loadChallengeDetails();
  };

  const executePaidChallengeJoin = async () => {
    if (!user || !challenge) return;

    const entryFee = challenge.entry_fee || 0;
    const feeLabel = `£${entryFee.toFixed(2)}`;

    try {
      setJoining(true);

      const freshBalance = await walletService.getBalance(user.id);
      setWalletBalance(freshBalance);

      if (freshBalance >= entryFee) {
        const { paymentIntentId } =
          await challengesService.initiateChallengeJoinWithWallet(challenge.id, user.id, entryFee);
        await challengesService.completeChallengeJoin(challenge.id, user.id, paymentIntentId);
        Alert.alert('Joined!', `${feeLabel} taken from your wallet for this challenge.`);
        setIsParticipating(true);
        await loadChallengeDetails();
        return;
      }

      const shortBy = Math.max(0.01, Math.ceil((entryFee - freshBalance) * 100) / 100);
      setJoining(false);

      Alert.alert(
        'Top up to join',
        `Entry is ${feeLabel}. Your wallet has £${freshBalance.toFixed(2)}.\n\nCharge £${shortBy.toFixed(2)} to your wallet, then we'll take ${feeLabel} to join.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Charge £${shortBy.toFixed(2)} & Join`,
            onPress: () => {
              void (async () => {
                try {
                  setJoining(true);
                  await chargeWalletThenJoin(shortBy, entryFee);
                } catch (error: any) {
                  console.error('❌ [ChallengeDetailScreen] Charge & join error:', error);
                  Alert.alert('Error', error.message || 'Failed to join challenge. Please try again.');
                } finally {
                  setJoining(false);
                }
              })();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [ChallengeDetailScreen] Error joining challenge:', error);
      Alert.alert('Error', error.message || 'Failed to join challenge. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return;

    if (challenge.is_pro_only && !userProfile?.is_pro) {
      setShowUpgradeModal(true);
      return;
    }

    if (!userProfile?.is_pro && (challenge.duration_weeks || 1) > 1) {
      setShowUpgradeModal(true);
      return;
    }

    const entryFee = challenge.entry_fee || 0;

    if (entryFee <= 0) {
      try {
        setJoining(true);
        await challengesService.completeChallengeJoin(challenge.id, user.id, null);
        Alert.alert('Joined!', 'You have joined the challenge. Good luck!');
        setIsParticipating(true);
        await loadChallengeDetails();
      } catch (error: any) {
        console.error('❌ [ChallengeDetailScreen] Error joining challenge:', error);
        Alert.alert('Error', error.message || 'Failed to join challenge. Please try again.');
      } finally {
        setJoining(false);
      }
      return;
    }

    const feeLabel = `£${entryFee.toFixed(2)}`;
    const titleName = getChallengeDisplayTitle(challenge.title);

    Alert.alert(
      'Challenge entry',
      `You're joining "${titleName}".\n\nEntry is ${feeLabel}, paid from your wallet. If you don't have enough, we'll ask to charge your card to top up, then take ${feeLabel} from your wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => void executePaidChallengeJoin() },
      ]
    );
  };

  const handleUploadPhoto = () => {
    if (!challenge) return;

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

    const startYmd = challenge.start_date.split('T')[0].slice(0, 10);
    const endYmd = challenge.end_date.split('T')[0].slice(0, 10);
    const todayYmd = localDeviceCalendarYmd();
    if (todayYmd < startYmd || todayYmd > endYmd) {
      Alert.alert(
        'Cannot add proof',
        'You can only take a photo while the challenge is running. Past challenge days cannot be added or changed.',
        [{ text: 'OK' }],
      );
      return;
    }
    const challengeEndMoment = new Date(challenge.end_date);
    challengeEndMoment.setHours(23, 59, 59, 999);
    if (now > challengeEndMoment) {
      Alert.alert(
        'Challenge ended',
        'This challenge is over. You can no longer add or change proof.',
        [{ text: 'OK' }],
      );
      return;
    }

    const challengeDays = getChallengeDays();
    if (activeTab === 'participants' && challengeDays.length > 0) {
      const sel = challengeDays.find((d) => d.dayNumber === selectedParticipantDay);
      if (!sel?.isToday) {
        Alert.alert(
          'Today only',
          'You can only take a photo for today. In Participants, select the day labelled Today, or switch to About, Schedule, or Details.',
          [{ text: 'OK' }],
        );
        return;
      }
    }

    const todaySub = getTodaysSubmission();

    if (todaySub) {
      // Already submitted today — offer to replace
      Alert.alert(
        'Replace today\'s photo?',
        'You\'ve already submitted a proof photo today. You can replace it with a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace Photo',
            onPress: () => {
              setReplacingSubmission(todaySub);
              setShowSubmissionModal(true);
            },
          },
        ]
      );
      return;
    }

    setReplacingSubmission(null);
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

  const handleSubmitPhoto = async (photoUrl: string, notes?: string, shareToCommunity?: boolean) => {
    if (!user || !challenge) return;
    
    try {
      // Calculate the correct week number based on challenge type
      const weekNumber = isRecurringChallenge(challenge) 
        ? getCurrentWeekForRecurringChallenge(challenge)
        : getChallengeWeekNumber(challenge);
      
      if (__DEV__) {
        console.log('📸 Submitting photo:', {
          challengeId: challenge.id,
          challengeTitle: getChallengeDisplayTitle(challenge.title),
          isRecurring: isRecurringChallenge(challenge),
          weekNumber,
          userId: user.id,
          shareToCommunity: !!shareToCommunity,
        });
      }
      
      const success = await challengesService.submitChallengeProof(
        challenge.id,
        user.id,
        photoUrl,
        weekNumber,
        notes
      );
      
      if (success) {
        if (__DEV__) {
          console.log('✅ Photo submitted successfully');
        }

        if (shareToCommunity) {
          try {
            const displayTitle = getChallengeDisplayTitle(challenge.title);
            const challengeLabel = stripTrailingChallengeWord(displayTitle);
            const noteText = notes?.trim() || '';
            await postsService.createPost({
              content: noteText,
              date: getDailyPostDate(new Date()),
              photos: [photoUrl],
              habits_completed: [],
              caption: noteText || undefined,
              is_public: true,
              challenge_id: challenge.id,
              challenge_title: challengeLabel,
            });
          } catch (shareError) {
            console.error('Error sharing challenge proof to community:', shareError);
            Alert.alert(
              'Proof submitted',
              'Your challenge proof was saved, but sharing to the community feed failed.'
            );
          }
        }

        const submittedAt = new Date().toISOString();
        const proofDayYmd = localDeviceCalendarYmd();
        const optimisticSubmission: ChallengeSubmission = {
          id: replacingSubmission?.id ?? `temp-${submittedAt}`,
          challenge_id: challenge.id,
          user_id: user.id,
          photo_url: photoUrl,
          submitted_at: submittedAt,
          submission_date: proofDayYmd,
          week_number: weekNumber,
          verification_status: 'pending',
          submission_notes: notes,
          is_flagged: false,
          flag_count: 0,
          has_flagged_by_me: false,
        };

        // Update the current user's row immediately so Participants/Today reflects the upload right away.
        setParticipantSubmissions((prev) => ({
          ...prev,
          [user.id]: upsertSubmissionByDate(prev[user.id] ?? [], optimisticSubmission),
        }));
        setParticipantTodaySubmissions((prev) => {
          const next = new Set(prev);
          next.add(user.id);
          return next;
        });
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            submissions_by_week: {
              ...prev.submissions_by_week,
              [weekNumber]: upsertSubmissionByDate(
                prev.submissions_by_week[weekNumber] ?? [],
                optimisticSubmission
              ),
            },
          };
        });

        // Close the submission modal
        setShowSubmissionModal(false);

        // Fetch the canonical server state right after the optimistic update.
        const [freshChallenge, freshProgress] = await Promise.all([
          challengesService.getChallengeById(challenge.id),
          challengesService.getChallengeProgress(challenge.id, user.id),
          loadParticipantTodaySubmissions(challenge.id),
          loadParticipantSubmissionsData(challenge.id, user.id),
        ]);

        setChallenge(freshChallenge);
        setProgress(freshProgress);
        
        Alert.alert('Success', 'Photo submitted successfully!');
      } else {
        Alert.alert('Error', 'Failed to submit photo');
      }
    } catch (error) {
      console.error('❌ Error submitting photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit photo';
      Alert.alert('Error', errorMessage);
    }
  };

  const getTodaysSubmission = (): ChallengeSubmission | null => {
    if (!progress || !challenge) return null;
    const todayDateString = localDeviceCalendarYmd();
    const allSubmissions = Object.values(progress.submissions_by_week).flat();
    return allSubmissions.find((sub) => {
      const d = sub.submission_date
        ? sub.submission_date
        : localDeviceCalendarYmd(new Date(sub.submitted_at));
      return d === todayDateString;
    }) ?? null;
  };

  const hasTodaysSubmission = () => getTodaysSubmission() !== null;

  const formatDuration = (weeks: number) => {
    // Calculate actual duration in days
    const startDate = new Date(challenge?.start_date || '');
    const endDate = new Date(challenge?.end_date || '');
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // If it's a same-day challenge (0 diff or 1 day inclusive)
    if (startDate.toDateString() === endDate.toDateString()) {
      return '1 day';
    }
    
    if (diffDays < 7) {
      return `${diffDays + 1} days`;
    }
    
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  };

  const formatEntryFee = (fee: number) => {
    if (fee === 0) return 'Free';
    return `£${fee}`;
  };

  /** Returns the list of calendar days for the challenge. */
  const getChallengeDays = (): {
    dayNumber: number;
    dateStr: string;
    label: string;
    weekday: string;
    dayOfMonth: string;
    monthShort: string;
    isPast: boolean;
    isToday: boolean;
  }[] => {
    if (!challenge) return [];
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const days: {
      dayNumber: number;
      dateStr: string;
      label: string;
      weekday: string;
      dayOfMonth: string;
      monthShort: string;
      isPast: boolean;
      isToday: boolean;
    }[] = [];
    const cur = new Date(start);
    let dayNum = 1;
    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const isPast = cur < today && !isToday;
      days.push({
        dayNumber: dayNum,
        dateStr,
        label: isToday ? 'Today' : `Day ${dayNum}`,
        weekday: cur.toLocaleDateString(undefined, { weekday: 'short' }),
        dayOfMonth: String(cur.getDate()),
        monthShort: cur.toLocaleDateString(undefined, { month: 'short' }),
        isPast,
        isToday,
      });
      cur.setDate(cur.getDate() + 1);
      dayNum++;
    }
    return days;
  };

  /** Returns the current challenge day number (1-indexed), clamped to [1, totalDays]. */
  const getCurrentChallengeDay = (): number => {
    if (!challenge) return 1;
    const start = new Date(challenge.start_date);
    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(diff + 1, getChallengeDays().length));
  };

  const getTimeRemaining = () => {
    if (!challenge) return { days: 0, hours: 0, minutes: 0, ended: true };
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    // Set end date to end of day to include the full last day
    endDate.setHours(23, 59, 59, 999);
    
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
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top', 'left', 'right']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.textPrimary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
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

  /** Soft fill tint from heading/text color (matches Challenge page accents). */
  const primarySoftBg =
    theme.textPrimary.startsWith('#') && theme.textPrimary.length === 7 ? `${theme.textPrimary}1A` : `${theme.textPrimary}33`;

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header — back, date + title centre, spacer for balance */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenterColumn}>
            <Text style={[styles.headerDateRange, { color: theme.textSecondary }]} numberOfLines={1}>
              {formatDateRange()}
            </Text>
            <Text
              style={[styles.headerChallengeTitle, { color: theme.textPrimary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {getChallengeDisplayTitle(challenge.title)}
            </Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Challenge Image */}
        <View style={styles.imageContainer}>
          {isCuratedGymChallengeForCardHero(challenge.title, challenge.is_user_created) ? (
            <ExpoImage
              source={require('../assets/challenge-cards/gym.png')}
              style={styles.challengeImage}
              contentFit="cover"
              contentPosition="top"
            />
          ) : challenge.image_url ? (
            <ExpoImage
              source={{ uri: challenge.image_url }}
              style={styles.challengeImage}
              contentFit="cover"
              contentPosition="top"
            />
          ) : null}
        </View>
        
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: '#1F2937' }]}>£{challenge.entry_fee || 0}</Text>
            <Text style={[styles.statLabel, { color: '#6B7280' }]}>investment</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: '#1F2937' }]}>
              £{potStatus?.totalAmount.toFixed(2) || ((challenge.participants?.length || 0) * (challenge.entry_fee || 0)).toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: '#6B7280' }]}>total pot</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: '#1F2937' }]}>{challenge.participants?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: '#6B7280' }]}>players</Text>
          </View>
        </View>

        {/* Approval Status Banner */}
        {challenge.approval_status ? (
          <View style={[
            styles.approvalBanner,
            {
              backgroundColor: challenge.approval_status === 'pending' 
                ? 'rgba(245, 158, 11, 0.1)' 
                : challenge.approval_status === 'approved'
                ? primarySoftBg
                : 'rgba(239, 68, 68, 0.1)',
              borderColor: challenge.approval_status === 'pending'
                ? '#F59E0B'
                : challenge.approval_status === 'approved'
                ? theme.textPrimary
                : '#EF4444',
            }
          ]}>
            <Ionicons
              name={
                challenge.approval_status === 'pending'
                  ? 'time-outline'
                  : challenge.approval_status === 'approved'
                  ? 'checkmark-circle'
                  : 'close-circle'
              }
              size={20}
              color={
                challenge.approval_status === 'pending'
                  ? '#F59E0B'
                  : challenge.approval_status === 'approved'
                  ? theme.textPrimary
                  : '#EF4444'
              }
            />
            <View style={styles.approvalTextContainer}>
              <Text style={[
                styles.approvalTitle,
                {
                  color: challenge.approval_status === 'pending'
                    ? '#F59E0B'
                    : challenge.approval_status === 'approved'
                    ? theme.textPrimary
                    : '#EF4444',
                }
              ]}>
                {challenge.approval_status === 'pending'
                  ? 'Pending Review'
                  : challenge.approval_status === 'approved'
                  ? 'Approved'
                  : 'Rejected'}
              </Text>
              <Text style={[styles.approvalMessage, { color: theme.textSecondary }]}>
                {challenge.approval_status === 'pending'
                  ? 'This challenge is under review. Winners will be determined after approval.'
                  : challenge.approval_status === 'approved'
                  ? challenge.reviewed_at
                    ? `Approved on ${new Date(challenge.reviewed_at).toLocaleDateString()}. Money has been distributed to winners.`
                    : 'This challenge has been approved and money distributed.'
                  : challenge.rejection_reason || 'This challenge has been rejected.'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Wallet Balance (if not participating and has entry fee) */}
        {(challenge.entry_fee ?? 0) > 0 && !isParticipating && (
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                  Your Wallet Balance
                </Text>
                <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
                  £{walletBalance.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Wallet')}
                style={[styles.addFundsButton, { backgroundColor: theme.textPrimary }]}
              >
                <Text style={styles.addFundsButtonText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('participants')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'participants' ? theme.textPrimary : theme.textSecondary }
            ]}>
              Participants
            </Text>
            {activeTab === 'participants' && <View style={[styles.tabUnderline, { backgroundColor: theme.textPrimary }]} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {/* Challenge Info */}
            <View style={styles.challengeInfo}>
              {/* Category Tag */}
              <View style={[styles.categoryTag, { backgroundColor: theme.textPrimary }]}>
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
                    {challenge.participant_count || 0} participants
                  </Text>
                </View>
              </View>

              {/* Time Remaining */}
              <View style={[styles.daysRemainingContainer, { backgroundColor: primarySoftBg }]}>
                <Ionicons name="calendar-outline" size={16} color={theme.textPrimary} />
                <Text style={[styles.daysRemainingText, { color: theme.textPrimary }]}>
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
                <View style={[styles.hostAvatar, { backgroundColor: theme.textPrimary }]}>
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
                return <View />;
              })()}
            </View>
          </View>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.tabContent} key={`schedule-${progress?.submissions_by_week ? Object.keys(progress.submissions_by_week).length : 0}`}>
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
                        {getWeekActivityCountLabel(challenge)}
                      </Text>
                    </View>
                    
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const activityDate = new Date(weekStartDate);
                      activityDate.setDate(weekStartDate.getDate() + dayIndex);
                      
                      // Get day of the week name
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const dayName = dayNames[activityDate.getDay()];
                      
                      // Check if submission exists for this date
                      // For recurring challenges, all submissions are in week 1, so check week 1
                      // For regular challenges, check the corresponding week
                      const weekToCheck = isRecurringChallenge(challenge) ? 1 : weekIndex + 1;
                      
                      // Normalize activity date to midnight for comparison
                      const normalizedActivityDate = new Date(activityDate);
                      normalizedActivityDate.setHours(0, 0, 0, 0);
                      const activityDateStr = normalizedActivityDate.toDateString();
                      
                      const hasSubmission = progress?.submissions_by_week[weekToCheck]?.some(sub => {
                        const subDate = new Date(sub.submitted_at);
                        subDate.setHours(0, 0, 0, 0);
                        const subDateStr = subDate.toDateString();
                        return subDateStr === activityDateStr;
                      });
                      
                      if (__DEV__ && activityDateStr === new Date().toDateString()) {
                        console.log('📅 Checking today\'s submission:', {
                          weekToCheck,
                          activityDateStr,
                          hasSubmission,
                          submissionsInWeek: progress?.submissions_by_week[weekToCheck]?.map(s => {
                            const d = new Date(s.submitted_at);
                            d.setHours(0, 0, 0, 0);
                            return {
                              date: d.toDateString(),
                              submitted_at: s.submitted_at,
                            };
                          }),
                        });
                      }
                      
                      // Check if date has passed without submission (missed)
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkDate = new Date(activityDate);
                      checkDate.setHours(0, 0, 0, 0);
                      const hasPassed = checkDate < today;
                      const isMissed = hasPassed && !hasSubmission && isParticipating;
                      
                      return (
                        <View key={dayIndex} style={styles.activityItem}>
                          <View style={styles.activityContent}>
                            <Text style={[styles.activityNumber, { color: theme.textSecondary }]}>
                              {dayName} • Activity {dayIndex + 1}
                            </Text>
                            <Text style={[styles.activityName, { color: theme.textPrimary }]}>
                              {getScheduleActivityLabel(challenge)}
                            </Text>
                          </View>
                          {hasSubmission && (
                            <View style={[styles.submissionCheck, { backgroundColor: theme.textPrimary }]}>
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            </View>
                          )}
                          {isMissed && (
                            <View style={[styles.submissionCheck, { backgroundColor: '#EF4444' }]}>
                              <Ionicons name="close-circle" size={16} color="#FFFFFF" />
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
              {/* Daily Proof Warning (if challenge has entry fee and user is participating) */}
              {(challenge.entry_fee ?? 0) > 0 && isParticipating && (
                <View style={[styles.warningCard, { backgroundColor: primarySoftBg, borderColor: theme.textPrimary, marginBottom: 16 }]}>
                  <Ionicons name="warning" size={20} color={theme.textPrimary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.warningTitle, { color: theme.textPrimary }]}>
                      Daily Proof Required
                    </Text>
                    <Text style={[styles.warningText, { color: theme.textSecondary }]}>
                      Submit proof every day to avoid forfeiting your £{challenge.entry_fee.toFixed(2)} investment. Missing any day will result in loss of your share.
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  How to Win
                </Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {getHowToWinText(challenge)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  How to Verify
                </Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {getHowToVerifyText(challenge)}
                </Text>
              </View>

              {(challenge.entry_fee ?? 0) > 0 && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                    How the Pot is Split
                  </Text>
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    At the end of the challenge, all participants who completed every single day will split the total pot equally. If you miss any day, you forfeit your entry fee and are not eligible for any winnings. The more people who complete the challenge, the bigger the pot!
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'participants' && (
          <View style={styles.tabContent}>
            {(() => {
              const days = getChallengeDays();
              const selectedDayObj = days.find((d) => d.dayNumber === selectedParticipantDay);
              const selectedDateStr = selectedDayObj?.dateStr ?? '';
              const totalChallengeDays = Math.max(1, days.length);
              const startStr = challenge.start_date?.split('T')[0] ?? '';
              const endStr = challenge.end_date?.split('T')[0] ?? '';
              const selectedIsFuture = selectedDayObj
                ? !selectedDayObj.isPast && !selectedDayObj.isToday
                : false;

              const submittedOnSelectedDay = (challenge.participants || []).filter((participant) => {
                const isOwnRow = participant.user_id === user?.id;
                const sharedSubs = participantSubmissions[participant.user_id] ?? [];
                const ownProgressSubs =
                  isOwnRow && progress ? Object.values(progress.submissions_by_week).flat() : [];
                const subs = sharedSubs.length > 0 ? sharedSubs : ownProgressSubs;
                const matched = subs.find((s) => submissionCalendarDate(s) === selectedDateStr);
                if (matched) return true;
                if (isOwnRow && selectedDayObj?.isToday) return !!getTodaysSubmission();
                if (selectedDayObj?.isToday) return participantTodaySubmissions.has(participant.user_id);
                return false;
              }).length;

              return (
                <>
                  {/* Clean day strip */}
                  {days.length > 0 && (
                    <View style={styles.dayPreviewHeader}>
                      <View style={styles.dayPreviewTitleRow}>
                        <View>
                          <Text style={[styles.dayPreviewEyebrow, { color: theme.textSecondary }]}>
                            Day preview
                          </Text>
                          <Text style={[styles.dayPreviewTitle, { color: theme.textPrimary }]}>
                            {selectedDayObj
                              ? selectedDayObj.isToday
                                ? 'Today'
                                : `Day ${selectedDayObj.dayNumber}`
                              : 'Select a day'}
                          </Text>
                          {selectedDayObj && (
                            <Text style={[styles.dayPreviewSubtitle, { color: theme.textSecondary }]}>
                              {selectedDayObj.weekday} {selectedDayObj.dayOfMonth} {selectedDayObj.monthShort}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.dayPreviewStat, { backgroundColor: primarySoftBg }]}>
                          <Text style={[styles.dayPreviewStatValue, { color: theme.textPrimary }]}>
                            {submittedOnSelectedDay}/{challenge.participants?.length || 0}
                          </Text>
                          <Text style={[styles.dayPreviewStatLabel, { color: theme.textSecondary }]}>
                            submitted
                          </Text>
                        </View>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dayStripContent}
                      >
                        {days.map((d) => {
                          const isSelected = d.dayNumber === selectedParticipantDay;
                          const isFuture = !d.isPast && !d.isToday;
                          return (
                            <TouchableOpacity
                              key={d.dateStr}
                              onPress={() => !isFuture && setSelectedParticipantDay(d.dayNumber)}
                              activeOpacity={isFuture ? 1 : 0.75}
                              style={[
                                styles.dayCell,
                                isSelected && { backgroundColor: theme.textPrimary, borderColor: theme.textPrimary },
                                !isSelected && { backgroundColor: '#FFFFFF', borderColor: '#EEF0F3' },
                                isFuture && { opacity: 0.35 },
                                d.isToday && !isSelected && { borderColor: theme.textPrimary },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayCellWeekday,
                                  { color: isSelected ? 'rgba(255,255,255,0.75)' : theme.textSecondary },
                                ]}
                              >
                                {d.weekday.slice(0, 2).toUpperCase()}
                              </Text>
                              <Text
                                style={[
                                  styles.dayCellNumber,
                                  { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                                ]}
                              >
                                {d.dayOfMonth}
                              </Text>
                              {d.isToday && (
                                <View
                                  style={[
                                    styles.dayCellTodayDot,
                                    { backgroundColor: isSelected ? '#FFFFFF' : theme.textPrimary },
                                  ]}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.participantsContainer}>
                    {challenge.participants && challenge.participants.length > 0 ? (
                      challenge.participants.map((participant, index) => {
                        const isOwnRow = participant.user_id === user?.id;
                        const sharedSubs = participantSubmissions[participant.user_id] ?? [];
                        const ownProgressSubs =
                          isOwnRow && progress ? Object.values(progress.submissions_by_week).flat() : [];
                        const subs = sharedSubs.length > 0 ? sharedSubs : ownProgressSubs;
                        const submittedDaysCount = countDistinctSubmissionDaysInRange(subs, startStr, endStr);

                        const matchedDaySubmission =
                          subs.find((s) => submissionCalendarDate(s) === selectedDateStr) ?? null;
                        const todayOwnSubmission =
                          isOwnRow && selectedDayObj?.isToday ? getTodaysSubmission() : null;
                        const daySubmission = matchedDaySubmission ?? todayOwnSubmission;
                        const previewSub = daySubmission;
                        const previewUri = previewSub?.photo_url ?? null;
                        const hasDaySubmission = daySubmission !== null;
                        const hasSubmittedOnDay = selectedDayObj?.isToday
                          ? participantTodaySubmissions.has(participant.user_id) || daySubmission !== null
                          : daySubmission !== null;
                        const isFlagged = daySubmission?.is_flagged ?? false;

                        const statusLabel = selectedIsFuture
                          ? 'Upcoming'
                          : hasSubmittedOnDay
                            ? 'Submitted'
                            : 'Missing';
                        const statusColor = selectedIsFuture
                          ? theme.textSecondary
                          : hasSubmittedOnDay
                            ? '#059669'
                            : '#DC2626';

                        return (
                          <View key={participant.id || index} style={styles.participantCard}>
                            <TouchableOpacity
                              style={styles.participantCardMain}
                              activeOpacity={previewUri || hasDaySubmission ? 0.85 : 1}
                              disabled={!hasDaySubmission}
                              onPress={() => previewSub && setPreviewedSubmission(previewSub)}
                            >
                              {previewUri ? (
                                <Image source={{ uri: previewUri }} style={styles.participantProofLarge} />
                              ) : (
                                <View style={styles.participantProofEmpty}>
                                  <Ionicons
                                    name={selectedIsFuture ? 'time-outline' : hasDaySubmission ? 'image-outline' : 'remove-outline'}
                                    size={22}
                                    color="#C4C9D1"
                                  />
                                </View>
                              )}

                              <View style={styles.participantMeta}>
                                <View style={styles.participantIdentity}>
                                  {participant.user?.avatar_url ? (
                                    <Image
                                      source={{ uri: participant.user.avatar_url }}
                                      style={styles.participantAvatarSm}
                                    />
                                  ) : (
                                    <View style={styles.participantAvatarSmPlaceholder}>
                                      <Text style={styles.participantAvatarInitial}>
                                        {(participant.user?.display_name || participant.user?.username || '?')
                                          .charAt(0)
                                          .toUpperCase()}
                                      </Text>
                                    </View>
                                  )}
                                  <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={[styles.participantNameClean, { color: theme.textPrimary }]} numberOfLines={1}>
                                      {isOwnRow
                                        ? 'You'
                                        : participant.user?.display_name || participant.user?.username || 'Anonymous'}
                                    </Text>
                                    <Text style={[styles.participantProgressClean, { color: theme.textSecondary }]}>
                                      {submittedDaysCount}/{totalChallengeDays} days
                                    </Text>
                                  </View>
                                </View>

                                <View style={[styles.statusPill, { backgroundColor: `${statusColor}14` }]}>
                                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                  <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
                                </View>
                              </View>

                              {isFlagged && (
                                <View style={styles.flagCorner}>
                                  <Ionicons name="flag" size={10} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>

                            {!isOwnRow && daySubmission && (
                              <TouchableOpacity
                                onPress={() => handleFlagSubmission(daySubmission)}
                                disabled={!!flaggingSubmissionId}
                                style={styles.flagSideBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons
                                  name={daySubmission.has_flagged_by_me ? 'flag' : 'flag-outline'}
                                  size={16}
                                  color={daySubmission.has_flagged_by_me ? '#F59E0B' : theme.textTertiary}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyParticipants}>
                        <Ionicons name="people-outline" size={40} color={theme.textSecondary} />
                        <Text style={[styles.emptyParticipantsText, { color: theme.textSecondary }]}>
                          No participants yet
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              );
            })()}
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
            const startYmd = challenge.start_date.split('T')[0].slice(0, 10);
            const endYmd = challenge.end_date.split('T')[0].slice(0, 10);
            const todayYmd = localDeviceCalendarYmd();
            const outsideChallengeCalendar = todayYmd < startYmd || todayYmd > endYmd;
            const challengeEndMoment = new Date(challenge.end_date);
            challengeEndMoment.setHours(23, 59, 59, 999);
            const uploadLocked =
              !hasStarted || outsideChallengeCalendar || now > challengeEndMoment;
            const dayList = getChallengeDays();
            const selectedDayForPicker = dayList.find((d) => d.dayNumber === selectedParticipantDay);
            const participantsDayLocksCamera =
              activeTab === 'participants' &&
              dayList.length > 0 &&
              !(selectedDayForPicker?.isToday ?? false);
            const photoActionLocked = uploadLocked || participantsDayLocksCamera;

            return (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        hasSubmittedToday || (hasStarted && !photoActionLocked)
                          ? theme.textPrimary
                          : theme.textSecondary,
                      opacity: hasSubmittedToday ? 1 : photoActionLocked ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleUploadPhoto}
                  disabled={photoActionLocked}
                >
                  {hasSubmittedToday ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Submitted ✓</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        {!hasStarted
                          ? 'Challenge Not Started'
                          : uploadLocked
                            ? 'Uploads closed'
                            : participantsDayLocksCamera
                              ? 'Select Today to take a photo'
                              : 'Take a photo'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Replace link — only shown when already submitted today */}
                {hasSubmittedToday && hasStarted && !photoActionLocked && (
                  <TouchableOpacity
                    onPress={handleUploadPhoto}
                    style={{ alignItems: 'center', marginTop: 8 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>
                      ↻  Replace today's photo
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.textPrimary }]}
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
        existingSubmission={replacingSubmission ?? undefined}
        onClose={() => {
          setShowSubmissionModal(false);
          setReplacingSubmission(null);
        }}
        onSubmit={handleSubmitPhoto}
      />

      {/* Full-screen proof viewer */}
      <Modal
        visible={previewedSubmission != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewedSubmission(null)}
      >
        {previewedSubmission && (() => {
          const isOwnSub = previewedSubmission.user_id === user?.id;
          const alreadyFlagged = previewedSubmission.has_flagged_by_me ?? false;
          const subDateStr = previewedSubmission.submission_date
            ? new Date(previewedSubmission.submission_date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            : new Date(previewedSubmission.submitted_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <View style={styles.participantPhotoModalRoot}>
              {/* Header bar */}
              <View style={[styles.participantPhotoModalHeader, { paddingTop: insets.top + 8 }]}>
                <View style={{ flex: 1, justifyContent: 'flex-start' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', lineHeight: 30 }}>
                    {subDateStr}
                  </Text>
                </View>
                {!isOwnSub && (
                  <TouchableOpacity
                    onPress={async () => {
                      await handleFlagSubmission(previewedSubmission);
                      // Refresh the previewedSubmission flag state after action
                      setPreviewedSubmission(null);
                    }}
                    disabled={!!flaggingSubmissionId}
                    style={styles.participantPhotoModalFlagBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={alreadyFlagged ? 'flag' : 'flag-outline'}
                      size={22}
                      color={alreadyFlagged ? '#F59E0B' : '#FFFFFF'}
                    />
                    <Text style={{ color: alreadyFlagged ? '#F59E0B' : '#FFFFFF', fontSize: 11, marginTop: 2 }}>
                      {alreadyFlagged ? 'Flagged' : 'Flag'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setPreviewedSubmission(null)}
                  style={{ padding: 4, marginLeft: 12, alignSelf: 'flex-start' }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {previewedSubmission.is_flagged && (
                <Text
                  style={{
                    color: '#F59E0B',
                    fontSize: 12,
                    fontWeight: '600',
                    paddingHorizontal: 16,
                    paddingBottom: 8,
                  }}
                >
                  Flagged
                </Text>
              )}

              {/* Photo */}
              <Pressable
                style={styles.participantPhotoModalImageArea}
                onPress={() => setPreviewedSubmission(null)}
              >
                {previewedSubmission.photo_url ? (
                  <Image
                    source={{ uri: previewedSubmission.photo_url }}
                    style={[styles.participantPhotoModalImage, { height: windowHeight * 0.65 }]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.3)" />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No photo uploaded</Text>
                  </View>
                )}
              </Pressable>

              <Text style={[styles.participantPhotoModalHint, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                Tap photo or close to dismiss
              </Text>
            </View>
          );
        })()}
      </Modal>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerCenterColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerDateRange: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  headerChallengeTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 22,
  },
  headerRightSpacer: {
    width: 40,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabText: {
    fontSize: 14,
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  approvalTextContainer: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  approvalMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addFundsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFundsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  participantsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  dayPreviewHeader: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  dayPreviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  dayPreviewEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayPreviewTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  dayPreviewSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  dayPreviewStat: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 72,
  },
  dayPreviewStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  dayPreviewStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  dayStripContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  dayCell: {
    width: 52,
    height: 68,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayCellWeekday: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  dayCellNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  dayCellTodayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF0F3',
    overflow: 'hidden',
  },
  participantCardMain: {
    flex: 1,
    minWidth: 0,
  },
  participantProofLarge: {
    width: '100%',
    height: 168,
    backgroundColor: '#F3F4F6',
  },
  participantProofEmpty: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  participantIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  participantAvatarSm: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  participantAvatarSmPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  participantNameClean: {
    fontSize: 15,
    fontWeight: '700',
  },
  participantProgressClean: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  flagCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagSideBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#EEF0F3',
    backgroundColor: '#FAFBFC',
  },
  participantPhotoModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
  },
  participantPhotoModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  participantPhotoModalFlagBtn: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  participantPhotoModalImageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  participantPhotoModalImage: {
    width: width - 32,
  },
  participantPhotoModalHint: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    paddingTop: 8,
  },
  emptyParticipants: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyParticipantsText: {
    fontSize: 15,
    marginTop: 10,
  },
});
