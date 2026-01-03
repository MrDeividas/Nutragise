import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { Challenge } from '../types/challenges';
import { challengesService } from '../lib/challengesService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
}

export default function JoinPrivateChallengeModal({ visible, onClose, onSubmit }: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1); // 1 = enter code, 2 = confirm
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const handleReset = () => {
    setStep(1);
    setCode('');
    setError('');
    setLoading(false);
    setValidating(false);
    setChallenge(null);
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
      setError(err.message || 'Failed to join challenge or insufficient funds');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and limit to 8 characters
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(formatted);
    setError('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={styles.titleContainer}>
                  <Ionicons name="key" size={24} color={theme.primary} />
                  <Text style={[styles.title, { color: theme.textPrimary }]}>Join Private Challenge</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {step === 1 ? (
                  <>
                    <Text style={[styles.description, { color: theme.textSecondary }]}>
                      Enter the 8-character join code shared by the challenge creator
                    </Text>

                    {/* Join Code Input */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: theme.textPrimary }]}>Join Code</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.cardBackground,
                            color: theme.textPrimary,
                            borderColor: error ? '#EF4444' : theme.border,
                          },
                        ]}
                        placeholder="ABCD1234"
                        placeholderTextColor={theme.textSecondary}
                        value={code}
                        onChangeText={handleCodeChange}
                        autoCapitalize="characters"
                        maxLength={8}
                        editable={!validating}
                      />
                      {error && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={16} color="#EF4444" />
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      )}
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                      style={[
                        styles.joinButton,
                        { backgroundColor: theme.primary, opacity: validating || !code.trim() ? 0.5 : 1 },
                      ]}
                      onPress={handleValidateCode}
                      disabled={validating || !code.trim()}
                    >
                      {validating ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Text style={styles.joinButtonText}>Continue</Text>
                          <Ionicons name="arrow-forward" size={20} color="white" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Confirmation Step */}
                    <Text style={[styles.confirmationTitle, { color: theme.textPrimary }]}>
                      Confirm Challenge Entry
                    </Text>

                    {challenge && (
                      <>
                        {/* Challenge Details */}
                        <View style={[styles.challengeCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                          <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>
                            {challenge.title}
                          </Text>
                          <Text style={[styles.challengeDescription, { color: theme.textSecondary }]}>
                            {challenge.description}
                          </Text>
                          
                          <View style={styles.challengeInfo}>
                            <View style={styles.infoRow}>
                              <Ionicons name="calendar" size={16} color={theme.textSecondary} />
                              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                {`${challenge.duration_weeks || 0} week${challenge.duration_weeks > 1 ? 's' : ''}`}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Ionicons name="people" size={16} color={theme.textSecondary} />
                              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                {`${challenge.participant_count || 0} participants`}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Entry Fee Section */}
                        <View style={[styles.feeSection, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}40` }]}>
                          <View style={styles.feeRow}>
                            <Text style={[styles.feeLabel, { color: theme.textPrimary }]}>Entry Fee</Text>
                            <Text style={[styles.feeAmount, { color: theme.primary }]}>
                              {challenge.entry_fee && challenge.entry_fee > 0 ? `£${challenge.entry_fee.toFixed(2)}` : 'Free'}
                            </Text>
                          </View>
                          {challenge.entry_fee && challenge.entry_fee > 0 && (
                            <Text style={[styles.feeNote, { color: theme.textSecondary }]}>
                              This amount will be deducted from your wallet and held in escrow until the challenge completes.
                            </Text>
                          )}
                        </View>

                        {error && (
                          <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                          </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.backButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                            onPress={() => {
                              setStep(1);
                              setError('');
                            }}
                            disabled={loading}
                          >
                            <Ionicons name="arrow-back" size={18} color={theme.textPrimary} />
                            <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>Back</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.confirmButton,
                              { backgroundColor: theme.primary, opacity: loading ? 0.5 : 1 },
                            ]}
                            onPress={handleConfirmJoin}
                            disabled={loading}
                          >
                            {loading ? (
                              <ActivityIndicator color="white" />
                            ) : (
                              <>
                                <Text style={styles.confirmButtonText}>Confirm & Join</Text>
                                <Ionicons name="checkmark" size={20} color="white" />
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
  },
  feeSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  feeNote: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

