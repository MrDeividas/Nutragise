import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { Challenge } from '../types/challenges';
import { getChallengeDisplayTitle } from '../lib/challengeTitleUtils';

interface Props {
  challenges: Challenge[];
  onDelete: (challengeId: string) => void;
}

function challengeHasStarted(challenge: Challenge): boolean {
  if (!challenge.start_date) return false;
  return new Date() >= new Date(challenge.start_date);
}

export default function MyChallengesSection({ challenges, onDelete }: Props) {
  const { theme } = useTheme();

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied!', 'Join code copied to clipboard');
  };

  const handleDelete = (challenge: Challenge) => {
    const title = getChallengeDisplayTitle(challenge.title);
    if (challengeHasStarted(challenge)) {
      Alert.alert(
        'Cannot delete',
        'This challenge has already started and can no longer be deleted.'
      );
      return;
    }

    Alert.alert(
      'Delete Challenge',
      `Are you sure you want to delete "${title}"? All participants will be refunded.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(challenge.id),
        },
      ]
    );
  };

  if (challenges.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground }]}>
        <Ionicons name="trophy-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Challenges Yet</Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Create your first challenge below!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {challenges.map((challenge) => {
          const started = challengeHasStarted(challenge);
          return (
            <View
              key={challenge.id}
              style={[
                styles.challengeCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {getChallengeDisplayTitle(challenge.title)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          challenge.status === 'active'
                            ? '#10B98120'
                            : challenge.status === 'completed'
                              ? '#6B728020'
                              : '#F59E0B20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            challenge.status === 'active'
                              ? '#10B981'
                              : challenge.status === 'completed'
                                ? '#6B7280'
                                : '#F59E0B',
                        },
                      ]}
                    >
                      {challenge.status}
                    </Text>
                  </View>
                </View>

                {challenge.visibility === 'private' && (
                  <View style={[styles.typeBadge, { backgroundColor: `${theme.primary}20` }]}>
                    <Ionicons name="lock-closed" size={12} color={theme.primary} />
                    <Text style={[styles.typeText, { color: theme.primary }]}>Private</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={16} color={theme.textSecondary} />
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    {challenge.participant_count || 0} participants
                  </Text>
                </View>

                {challenge.entry_fee && challenge.entry_fee > 0 ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash" size={16} color={theme.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                      £{challenge.entry_fee.toFixed(2)} entry
                    </Text>
                  </View>
                ) : null}

                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color={theme.textSecondary} />
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    {challenge.duration_weeks} week{challenge.duration_weeks > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {challenge.visibility === 'private' && challenge.join_code ? (
                <TouchableOpacity
                  style={[
                    styles.codeContainer,
                    { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}40` },
                  ]}
                  onPress={() => handleCopyCode(challenge.join_code!)}
                >
                  <View style={styles.codeLeft}>
                    <Ionicons name="key" size={16} color={theme.primary} />
                    <Text style={[styles.codeLabel, { color: theme.textPrimary }]}>Join Code:</Text>
                    <Text style={[styles.codeText, { color: theme.primary }]}>
                      {challenge.join_code}
                    </Text>
                  </View>
                  <Ionicons name="copy" size={18} color={theme.primary} />
                </TouchableOpacity>
              ) : null}

              {challenge.entry_fee && challenge.entry_fee > 0 ? (
                <View style={[styles.feeWarning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                  <Ionicons name="information-circle" size={14} color="#F59E0B" />
                  <Text style={styles.feeWarningText}>
                    30% fee if any Free member joins; 0% if all are Pro
                  </Text>
                </View>
              ) : null}

              {started ? (
                <Text style={[styles.startedNote, { color: theme.textSecondary }]}>
                  Challenge has started — delete is unavailable.
                </Text>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
                    onPress={() => handleDelete(challenge)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    gap: 12,
  },
  challengeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  codeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  feeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  feeWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  startedNote: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
