import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { goalInteractionsService, GoalComment, CommentReply } from '../lib/goalInteractions';
import CommentLikeButton from './CommentLikeButton';
import CommentReplyButton from './CommentReplyButton';

interface CommentModalProps {
  visible: boolean;
  goalId: string;
  goalTitle: string;
  onClose: () => void;
}

export default function CommentModal({ visible, goalId, goalTitle, onClose }: CommentModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<GoalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState<{[commentId: string]: { likes: number; isLiked: boolean }}>({});
  const [commentReplies, setCommentReplies] = useState<{[commentId: string]: number}>({});
  const [commentRepliesData, setCommentRepliesData] = useState<{[commentId: string]: CommentReply[]}>({});
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [replyingToCommentData, setReplyingToCommentData] = useState<GoalComment | null>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && goalId) {
      loadComments();
    }
  }, [visible, goalId]);

  const loadComments = async () => {
    if (!goalId) return;
    
    setLoading(true);
    try {
      const commentsData = await goalInteractionsService.getGoalComments(goalId);
      setComments(commentsData);
      
      // Load like and reply data for all comments
      await Promise.all([
        loadCommentLikeData(commentsData),
        loadCommentReplyData(commentsData)
      ]);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentLikeData = async (commentsList: GoalComment[]) => {
    try {
      const likePromises = commentsList.map(async (comment) => {
        const [likeCount, isLiked] = await Promise.all([
          goalInteractionsService.getCommentLikeCount(comment.id),
          goalInteractionsService.isCommentLikedByUser(comment.id)
        ]);
        
        return {
          commentId: comment.id,
          likes: likeCount,
          isLiked: isLiked
        };
      });

      const likeResults = await Promise.all(likePromises);
      const likeData: {[commentId: string]: { likes: number; isLiked: boolean }} = {};
      
      likeResults.forEach(result => {
        likeData[result.commentId] = {
          likes: result.likes,
          isLiked: result.isLiked
        };
      });

      setCommentLikes(likeData);
    } catch (error) {
      console.error('Error loading comment like data:', error);
    }
  };

  const handleCommentLikeChange = (commentId: string, isLiked: boolean, newCount: number) => {
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: {
        likes: newCount,
        isLiked: isLiked
      }
    }));
  };

  const loadCommentReplyData = async (commentsList: GoalComment[]) => {
    try {
      const replyPromises = commentsList.map(async (comment) => {
        const [replyCount, repliesData] = await Promise.all([
          goalInteractionsService.getCommentReplyCount(comment.id),
          goalInteractionsService.getCommentReplies(comment.id)
        ]);
        return {
          commentId: comment.id,
          replyCount: replyCount,
          replies: repliesData
        };
      });

      const replyResults = await Promise.all(replyPromises);
      const replyData: {[commentId: string]: number} = {};
      const repliesData: {[commentId: string]: CommentReply[]} = {};
      
      replyResults.forEach(result => {
        replyData[result.commentId] = result.replyCount;
        repliesData[result.commentId] = result.replies;
      });

      setCommentReplies(replyData);
      setCommentRepliesData(repliesData);
    } catch (error) {
      console.error('Error loading comment reply data:', error);
    }
  };

  const handleReplyPress = (comment: GoalComment) => {
    setReplyingToComment(comment.id);
    setReplyingToCommentData(comment);
    // Focus the main comment input after a short delay
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyingToCommentData(null);
  };

  const handleCommentChange = (text: string) => {
    // Ensure first character is capitalized if it's a letter
    if (text.length === 1 && /[a-z]/.test(text)) {
      setNewComment(text.toUpperCase());
    } else {
      setNewComment(text);
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

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      let success = false;
      
      if (replyingToComment) {
        // Submit as reply
        const replyId = await goalInteractionsService.addCommentReply(replyingToComment, newComment.trim());
        success = !!replyId;
      } else {
        // Submit as new comment
        const commentId = await goalInteractionsService.addGoalComment(goalId, newComment.trim());
        success = !!commentId;
      }
      
      if (success) {
        setNewComment('');
        setReplyingToComment(null);
        setReplyingToCommentData(null);
        // Reload comments to show the new one
        await loadComments();
      } else {
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReply = (reply: CommentReply) => (
    <View style={styles.replyItem}>
      <View style={styles.replyUserInfo}>
        {reply.user_profile?.avatar_url ? (
          <Image 
            source={{ uri: reply.user_profile.avatar_url }} 
            style={styles.replyAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.replyAvatarPlaceholder}>
            <Text style={styles.replyAvatarInitial}>
              {reply.user_profile?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.replyUserDetails}>
          <Text style={[styles.replyAuthor, { color: theme.textPrimary }]}>
            {reply.user_profile?.display_name || reply.user_profile?.username || 'Unknown User'}
            <Text style={[styles.replyTime, { color: theme.textTertiary }]}>
              {' • '}{getTimeAgo(reply.created_at)}
            </Text>
          </Text>
          <Text style={[styles.replyText, { color: theme.textSecondary }]}>
            {reply.reply_text}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: GoalComment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          {item.user_profile?.avatar_url ? (
            <Image 
              source={{ uri: item.user_profile.avatar_url }} 
              style={styles.commentAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarInitial}>
                {item.user_profile?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.commentUserDetails}>
            <View style={styles.commentHeaderRow}>
              <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>
                {item.user_profile?.display_name || item.user_profile?.username || 'Unknown User'}
                <Text style={[styles.commentTime, { color: theme.textTertiary }]}>
                  {' • '}{getTimeAgo(item.created_at)}
                </Text>
              </Text>
              <View style={styles.commentActions}>
                <CommentReplyButton
                  onPress={() => handleReplyPress(item)}
                  replyCount={commentReplies[item.id] || 0}
                  size="small"
                  showCount={true}
                />
                <CommentLikeButton
                  commentId={item.id}
                  initialLikeCount={commentLikes[item.id]?.likes || 0}
                  initialIsLiked={commentLikes[item.id]?.isLiked || false}
                  onLikeChange={(isLiked, newCount) => handleCommentLikeChange(item.id, isLiked, newCount)}
                  size="small"
                  showCount={true}
                />
              </View>
            </View>
            <Text style={[styles.commentText, { color: theme.textSecondary }]}>
              {item.comment_text}
            </Text>
          </View>
        </View>
      </View>
      


      {/* Render Replies */}
      {commentRepliesData[item.id] && commentRepliesData[item.id].length > 0 && (
        <View style={styles.repliesContainer}>
          {commentRepliesData[item.id].map((reply) => (
            <View key={reply.id} style={styles.replyWrapper}>
              {renderReply(reply)}
            </View>
          ))}
        </View>
      )}
    </View>
  );

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
              Comments
            </Text>
            <View style={styles.headerSpacer} />
          </View>



          {/* Comments List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading comments...
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color={theme.textTertiary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No comments yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                    Be the first to comment!
                  </Text>
                </View>
              }
            />
          )}

          {/* Add Comment */}
          <View style={[styles.addCommentContainer, { borderTopColor: theme.border }]}>
            {replyingToCommentData && (
              <View style={styles.replyingToContainer}>
                <Text style={[styles.replyingToText, { color: theme.textSecondary }]}>
                  Replying to {replyingToCommentData.user_profile?.display_name || replyingToCommentData.user_profile?.username || 'user'}
                </Text>
                <TouchableOpacity onPress={handleCancelReply} style={styles.cancelReplyButton}>
                  <Ionicons name="close" size={16} color={theme.textTertiary} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputRow}>
              <View style={styles.commentInputContainer}>
                <TextInput
                  ref={textInputRef}
                  style={[styles.commentInput, { 
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }]}
                  placeholder={replyingToCommentData ? 
                    `Reply to ${replyingToCommentData.user_profile?.display_name || replyingToCommentData.user_profile?.username || 'user'}...` : 
                    "Add a comment..."
                  }
                  placeholderTextColor={theme.textTertiary}
                                  value={newComment}
                onChangeText={handleCommentChange}
                  multiline
                  maxLength={500}
                  blurOnSubmit={false}
                                  autoCapitalize="sentences"
                autoCorrect={true}
                spellCheck={true}
                textContentType="none"
                returnKeyType="default"
                enablesReturnKeyAutomatically={true}
                clearButtonMode="while-editing"
                keyboardType="default"
                autoComplete="off"
                  onSubmitEditing={() => {
                    if (newComment.trim()) {
                      handleSubmitComment();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Enter') {
                      if (newComment.trim()) {
                        handleSubmitComment();
                      }
                    }
                  }}
                />
                {newComment.length > 0 && (
                  <Text style={[styles.characterCount, { color: theme.textTertiary }]}>
                    {newComment.length}/500
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: newComment.trim() ? theme.primary : theme.textTertiary }
                ]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
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
  goalTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  goalTitle: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    marginBottom: 4,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  commentUserDetails: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  repliesContainer: {
    marginLeft: 44, // Indent replies to the right
    marginTop: 8,
  },
  replyWrapper: {
    marginBottom: 8,
  },
  replyItem: {
    marginBottom: 4,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
  replyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyAvatarInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  replyUserDetails: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyTime: {
    fontSize: 10,
  },
  replyText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  inlineReplyContainer: {
    marginLeft: 44,
    marginTop: 8,
    marginBottom: 8,
  },
  inlineReplyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inlineReplyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    minHeight: 36,
  },
  inlineReplyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineReplyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  replyingToText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cancelReplyButton: {
    padding: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  commentInputContainer: {
    flex: 1,
    position: 'relative',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 10,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  addCommentContainer: {
    borderTopWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 44,
    lineHeight: 20,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 