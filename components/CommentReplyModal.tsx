import React, { useState, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { goalInteractionsService, GoalComment } from '../lib/goalInteractions';

interface CommentReplyModalProps {
  visible: boolean;
  parentComment: GoalComment;
  onClose: () => void;
  onReplyAdded?: () => void;
}

export default function CommentReplyModal({ 
  visible, 
  parentComment, 
  onClose, 
  onReplyAdded 
}: CommentReplyModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const handleSubmitReply = async () => {
    if (!user || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const replyId = await goalInteractionsService.addCommentReply(
        parentComment.id, 
        replyText.trim()
      );
      
      if (replyId) {
        setReplyText('');
        onReplyAdded?.();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to add reply. Please try again.');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      return commentDate.toLocaleDateString();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Reply
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Parent Comment */}
          <View style={styles.parentCommentContainer}>
            <View style={styles.parentCommentHeader}>
              <View style={styles.parentCommentUserInfo}>
                {parentComment.user_profile?.avatar_url ? (
                  <Image 
                    source={{ uri: parentComment.user_profile.avatar_url }} 
                    style={styles.parentCommentAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.parentCommentAvatarPlaceholder}>
                    <Text style={styles.parentCommentAvatarInitial}>
                      {parentComment.user_profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.parentCommentUserDetails}>
                  <Text style={[styles.parentCommentAuthor, { color: theme.textPrimary }]}>
                    {parentComment.user_profile?.display_name || parentComment.user_profile?.username || 'Unknown User'}
                    <Text style={[styles.parentCommentTime, { color: theme.textTertiary }]}>
                      {' • '}{getTimeAgo(parentComment.created_at)}
                    </Text>
                  </Text>
                  <Text style={[styles.parentCommentText, { color: theme.textSecondary }]}>
                    {parentComment.comment_text}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reply Input */}
          <View style={[styles.replyInputContainer, { borderTopColor: theme.border }]}>
            <TextInput
              ref={textInputRef}
              style={[styles.replyInput, { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.textPrimary,
                borderColor: theme.border
              }]}
              placeholder={`Reply to ${parentComment.user_profile?.display_name || parentComment.user_profile?.username || 'user'}...`}
              placeholderTextColor={theme.textTertiary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={500}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: replyText.trim() ? theme.primary : theme.textTertiary }
              ]}
              onPress={handleSubmitReply}
              disabled={!replyText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  parentCommentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  parentCommentHeader: {
    marginBottom: 4,
  },
  parentCommentUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  parentCommentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  parentCommentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentCommentAvatarInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  parentCommentUserDetails: {
    flex: 1,
  },
  parentCommentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  parentCommentTime: {
    fontSize: 12,
  },
  parentCommentText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 44,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 