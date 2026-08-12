import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '../types/challenges';
import { challengesService } from '../lib/challengesService';
import { getChallengeDisplayTitle } from '../lib/challengeTitleUtils';
import {
  formatChallengeShortDate,
  getChallengePeriodDays,
} from '../lib/challengeDates';
import ChallengeCard from './ChallengeCard';

const DARK = '#1f2937';
const MUTED = '#6B7280';
const PAGE_BG = '#FCFAF9';
const CARD_BORDER = '#EEF0F3';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  onNeedTopUp?: (info: { entryFee: number; balance: number; shortBy: number }) => void;
}

export default function JoinPrivateChallengeModal({
  visible,
  onClose,
  onSubmit,
  onNeedTopUp,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [segmentTrackWidth, setSegmentTrackWidth] = useState(0);
  const segmentIndicatorX = useRef(new Animated.Value(0)).current;
  const segmentHasPositioned = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setCode('');
    setError('');
    setLoading(false);
    setValidating(false);
    setChallenge(null);
    segmentHasPositioned.current = false;
  }, [visible]);

  const segmentTabWidth = segmentTrackWidth > 0 ? segmentTrackWidth / 2 : 0;
  const segmentIndex = step === 1 ? 0 : 1;

  useEffect(() => {
    if (segmentTabWidth <= 0) return;
    const toValue = segmentIndex * segmentTabWidth;
    if (!segmentHasPositioned.current) {
      segmentHasPositioned.current = true;
      segmentIndicatorX.setValue(toValue);
      return;
    }
    Animated.spring(segmentIndicatorX, {
      toValue,
      useNativeDriver: true,
      stiffness: 230,
      damping: 24,
      mass: 0.9,
    }).start();
  }, [segmentIndex, segmentTabWidth, segmentIndicatorX]);

  const handleReset = () => {
    setStep(1);
    setCode('');
    setError('');
    setLoading(false);
    setValidating(false);
    setChallenge(null);
    segmentHasPositioned.current = false;
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleValidateCode = async () => {
    if (!code.trim()) {
      setError('Please enter a join code');
      return;
    }
    if (code.trim().length !== 8) {
      setError('Join code must be 8 characters');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const challengeData = await challengesService.getChallengeByCode(code.trim().toUpperCase());
      if (!challengeData) {
        setError('Invalid join code');
        return;
      }
      setChallenge(challengeData);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to validate join code');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!challenge) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(code.trim().toUpperCase());
      handleClose();
    } catch (err: any) {
      if (err?.code === 'INSUFFICIENT_WALLET_BALANCE') {
        handleClose();
        onNeedTopUp?.({
          entryFee: Number(err.entryFee) || Number(challenge.entry_fee) || 0,
          balance: Number(err.balance) || 0,
          shortBy: Number(err.shortBy) || 0,
        });
        return;
      }
      setError(err.message || 'Failed to join challenge or insufficient funds');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(formatted);
    setError('');
  };

  const durationLabel = challenge
    ? (() => {
        const days = getChallengePeriodDays(challenge.start_date, challenge.end_date);
        if (days === 1) return '1 day';
        if (days < 7) return `${days} days`;
        if (challenge.duration_weeks === 1) return '1 week';
        return `${challenge.duration_weeks} weeks`;
      })()
    : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.screen, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join challenge</Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.segmentBar}>
            <View
              style={styles.segmentTrack}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - segmentTrackWidth) > 0.5) {
                  setSegmentTrackWidth(w);
                }
              }}
            >
              {segmentTabWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentIndicator,
                    {
                      width: segmentTabWidth,
                      transform: [{ translateX: segmentIndicatorX }],
                    },
                  ]}
                />
              ) : null}
              <TouchableOpacity
                style={styles.segment}
                onPress={() => {
                  setStep(1);
                  setError('');
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, step === 1 && styles.segmentTextActive]}>
                  Code
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.segment}
                onPress={() => {
                  if (challenge) setStep(2);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, step === 2 && styles.segmentTextActive]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step === 1 ? (
                <>
                  <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Step 1</Text>
                    <Text style={styles.heroTitle}>Enter your join code</Text>
                    <Text style={styles.heroSubtitle}>
                      Use the 8-character code shared by the challenge host to find their private
                      challenge.
                    </Text>
                  </View>

                  <Text style={styles.sectionLabel}>Join code</Text>
                  <View style={styles.formCard}>
                    <Text style={styles.fieldLabel}>Code</Text>
                    <TextInput
                      style={[styles.codeInput, error ? styles.codeInputError : null]}
                      placeholder="ABCD1234"
                      placeholderTextColor="#9CA3AF"
                      value={code}
                      onChangeText={handleCodeChange}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      spellCheck={false}
                      maxLength={8}
                      editable={!validating}
                      autoFocus
                    />
                    <Text style={styles.codeHint}>{code.length}/8 characters</Text>
                    {error ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (validating || code.trim().length !== 8) && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleValidateCode}
                    disabled={validating || code.trim().length !== 8}
                    activeOpacity={0.85}
                  >
                    {validating ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Step 2</Text>
                    <Text style={styles.heroTitle}>Confirm & join</Text>
                    <Text style={styles.heroSubtitle}>
                      Check the details below, then join. Entry fees are taken from your wallet.
                    </Text>
                  </View>

                  {challenge ? (
                    <>
                      <Text style={styles.sectionLabel}>Challenge</Text>
                      <View style={styles.cardPreviewRow}>
                        <ChallengeCard challenge={challenge} onPress={() => {}} />
                      </View>

                      <View style={styles.formCard}>
                        <Text style={styles.detailTitle}>
                          {getChallengeDisplayTitle(challenge.title)}
                        </Text>
                        {challenge.description?.trim() ? (
                          <Text style={styles.detailBody}>{challenge.description.trim()}</Text>
                        ) : null}

                        <View style={styles.metaRow}>
                          <View style={styles.metaChip}>
                            <Ionicons name="calendar-outline" size={14} color={DARK} />
                            <Text style={styles.metaChipText}>
                              {formatChallengeShortDate(challenge.start_date)} –{' '}
                              {formatChallengeShortDate(challenge.end_date)}
                            </Text>
                          </View>
                          <View style={styles.metaChip}>
                            <Ionicons name="time-outline" size={14} color={DARK} />
                            <Text style={styles.metaChipText}>{durationLabel}</Text>
                          </View>
                          <View style={styles.metaChip}>
                            <Ionicons name="people-outline" size={14} color={DARK} />
                            <Text style={styles.metaChipText}>
                              {challenge.participant_count || 0} joined
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.sectionLabel}>Stake</Text>
                      <View style={styles.formCard}>
                        <View style={styles.feeRow}>
                          <Text style={styles.fieldLabel}>Entry fee</Text>
                          <Text style={styles.feeAmount}>
                            {challenge.entry_fee && challenge.entry_fee > 0
                              ? `£${challenge.entry_fee}`
                              : 'Free'}
                          </Text>
                        </View>
                        {challenge.entry_fee && challenge.entry_fee > 0 ? (
                          <View style={styles.noteBox}>
                            <Ionicons name="information-circle-outline" size={18} color={DARK} />
                            <Text style={styles.noteText}>
                              This amount will be taken from your wallet when you join. If your
                              balance is short, you’ll be asked to top up first.
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {error ? (
                        <View style={[styles.errorRow, { marginBottom: 12 }]}>
                          <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      ) : null}

                      <View style={styles.footerRow}>
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => {
                            setStep(1);
                            setError('');
                          }}
                          disabled={loading}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.secondaryButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.primaryButton,
                            styles.primaryButtonFlex,
                            loading && styles.primaryButtonDisabled,
                          ]}
                          onPress={handleConfirmJoin}
                          disabled={loading}
                          activeOpacity={0.85}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>Confirm & join</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : null}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  headerBtn: {
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
  segmentBar: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  segmentTrack: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'stretch',
    width: '100%',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    backgroundColor: DARK,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  segmentText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 18,
    marginBottom: 18,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    color: DARK,
  },
  codeInputError: {
    borderColor: '#FCA5A5',
  },
  codeHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
  },
  cardPreviewRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  primaryButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryButtonFlex: {
    flex: 2,
    marginTop: 0,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
