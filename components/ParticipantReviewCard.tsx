import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParticipantWithSubmissions } from '../types/challenges';
import { useTheme } from '../state/themeStore';

interface ParticipantReviewCardProps {
  participant: ParticipantWithSubmissions;
  onInvalidate: (userId: string, reason: string) => Promise<void>;
  onViewSubmissions: (participant: ParticipantWithSubmissions) => void;
}

export default function ParticipantReviewCard({
  participant,
  onInvalidate,
  onViewSubmissions,
}: ParticipantReviewCardProps) {
  const { theme } = useTheme();
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [invalidationReason, setInvalidationReason] = useState('');
  const [isInvalidating, setIsInvalidating] = useState(false);

  const handleInvalidate = async () => {
    if (!invalidationReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for invalidation');
      return;
    }

    setIsInvalidating(true);
    try {
      await onInvalidate(participant.participant.user_id, invalidationReason.trim());
      setShowInvalidateModal(false);
      setInvalidationReason('');
    } catch (error) {
      Alert.alert('Error', 'Failed to invalidate submission. Please try again.');
    } finally {
      setIsInvalidating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'active':
        return '#3B82F6';
      default:
        return theme.textSecondary;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => onViewSubmissions(participant)}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {participant.user.avatar_url ? (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
                  {participant.user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={[styles.username, { color: theme.textPrimary }]}>
                {participant.user.display_name || participant.user.username}
              </Text>
              <Text style={[styles.userHandle, { color: theme.textSecondary }]}>
                @{participant.user.username}
              </Text>
            </View>
          </View>

          {participant.isInvalid ? (
            <View style={[styles.invalidBadge, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="close-circle" size={14} color="#EF4444" />
              <Text style={[styles.invalidText, { color: '#EF4444' }]}>Invalid</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(participant.participant.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(participant.participant.status) }]}>
                {participant.participant.status}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {Math.round(participant.completionPercentage)}% complete
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="camera-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {participant.submissions.length} submission{participant.submissions.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {!participant.isInvalid && (
          <TouchableOpacity
            style={[styles.invalidateButton, { borderColor: '#EF4444' }]}
            onPress={(e) => {
              e.stopPropagation();
              setShowInvalidateModal(true);
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={[styles.invalidateButtonText, { color: '#EF4444' }]}>Invalidate</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Invalidation Modal */}
      <Modal
        visible={showInvalidateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvalidateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Invalidate Submission
              </Text>
              <TouchableOpacity onPress={() => setShowInvalidateModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Invalidating {participant.user.display_name || participant.user.username}'s submission will exclude them from winner calculations.
            </Text>

            <Text style={[styles.label, { color: theme.textPrimary }]}>Reason (required)</Text>
            <TextInput
              style={[styles.reasonInput, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Enter reason for invalidation..."
              placeholderTextColor={theme.textSecondary}
              value={invalidationReason}
              onChangeText={setInvalidationReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setShowInvalidateModal(false);
                  setInvalidationReason('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#EF4444' }]}
                onPress={handleInvalidate}
                disabled={isInvalidating || !invalidationReason.trim()}
              >
                <Text style={styles.confirmButtonText}>
                  {isInvalidating ? 'Invalidating...' : 'Confirm Invalidation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  invalidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  invalidText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  invalidateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  invalidateButtonText: {
    fontSize: 14,
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
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
});

