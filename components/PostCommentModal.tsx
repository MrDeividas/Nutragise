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
import { supabase } from '../lib/supabase';
import PostCommentLikeButton from './PostCommentLikeButton';
import PostCommentReplyButton from './PostCommentReplyButton';
import { notificationService } from '../lib/notificationService';

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface PostCommentReply {
  id: string;
  parent_comment_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface PostCommentModalProps {
  visible: boolean;
  postId: string;
  postTitle: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function PostCommentModal({ visible, postId, postTitle, onClose, onCommentAdded }: PostCommentModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState<{[commentId: string]: { likes: number; isLiked: boolean }}>({});
  const [commentReplies, setCommentReplies] = useState<{[commentId: string]: number}>({});
  const [commentRepliesData, setCommentRepliesData] = useState<{[commentId: string]: PostCommentReply[]}>({});
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [replyingToCommentData, setReplyingToCommentData] = useState<PostComment | null>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      // First get the comments
      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error getting post comments:', commentsError);
        setComments([]);
        return;
      }

      if (!comments || comments.length === 0) {
        setComments([]);
        return;
      }

      // Get user IDs from comments
      const userIds = [...new Set(comments.map(comment => comment.user_id))];

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error getting user profiles for comments:', profilesError);
        // Return comments without profiles
        setComments(comments.map(comment => ({
          ...comment,
          profiles: undefined
        })));
        return;
      }

      // Create a map of user ID to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Combine comments with profiles
      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id)
      }));

      setComments(commentsWithProfiles);
      
      // Load like and reply data for all comments
      await Promise.all([
        loadCommentLikeData(commentsWithProfiles),
        loadCommentReplyData(commentsWithProfiles)
      ]);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentLikeData = async (commentsList: PostComment[]) => {
    try {
      const likePromises = commentsList.map(async (comment) => {
        const { count, error: countError } = await supabase
          .from('post_comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        const { data: userLike, error: userLikeError } = await supabase
          .from('post_comment_likes')
          .select('*')
          .eq('comment_id', comment.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        return {
          commentId: comment.id,
          likes: count || 0,
          isLiked: !userLikeError && userLike
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

  const loadCommentReplyData = async (commentsList: PostComment[]) => {
    try {
      const replyPromises = commentsList.map(async (comment) => {
        const { count, error: countError } = await supabase
          .from('post_comment_replies')
          .select('*', { count: 'exact', head: true })
          .eq('parent_comment_id', comment.id);

        const { data: replies, error: repliesError } = await supabase
          .from('post_comment_replies')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        return {
          commentId: comment.id,
          replyCount: count || 0,
          replies: replies || []
        };
      });

      const replyResults = await Promise.all(replyPromises);
      const replyData: {[commentId: string]: number} = {};
      const repliesData: {[commentId: string]: PostCommentReply[]} = {};
      
      replyResults.forEach(result => {
        replyData[result.commentId] = result.replyCount;
        repliesData[result.commentId] = result.replies;
      });

      // Load user profiles for all replies
      const allReplies = Object.values(repliesData).flat();
      if (allReplies.length > 0) {
        const userIds = [...new Set(allReplies.map(reply => reply.user_id))];
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (!profilesError && profiles) {
          // Create a map of user ID to profile
          const profileMap = new Map();
          profiles.forEach(profile => {
            profileMap.set(profile.id, profile);
          });

          // Add profiles to replies
          Object.keys(repliesData).forEach(commentId => {
            repliesData[commentId] = repliesData[commentId].map(reply => ({
              ...reply,
              profiles: profileMap.get(reply.user_id)
            }));
          });
        }
      }

      setCommentReplies(replyData);
      setCommentRepliesData(repliesData);
    } catch (error) {
      console.error('Error loading comment reply data:', error);
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

  const handleReplyPress = (comment: PostComment) => {
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
    setNewComment(text);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const submitComment = async () => {
    if (!user || !postId || !newComment.trim()) return;
    
    setSubmitting(true);
    try {
      let success = false;
      let commentId = '';

      if (replyingToComment) {
        // Add reply
        const { data, error } = await supabase
          .from('post_comment_replies')
          .insert({
            parent_comment_id: replyingToComment,
            user_id: user.id,
            reply_text: newComment.trim(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding reply:', error);
        } else {
          success = !!data;
          commentId = data?.id || '';
        }
      } else {
        // Add comment
        const { data, error } = await supabase
          .from('post_comments')
          .insert({
            post_id: postId,
            user_id: user.id,
            content: newComment.trim(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding comment:', error);
        } else {
          success = !!data;
          commentId = data?.id || '';
        }
      }
      
      if (success) {
        setNewComment('');
        setReplyingToComment(null);
        setReplyingToCommentData(null);
        // Reload comments to show the new one
        await loadComments();
        
        // Create notification
        if (replyingToComment) {
          // Create reply notification
          await notificationService.createPostReplyNotification(replyingToComment, commentId, user.id);
        } else {
          // Create comment notification
          await notificationService.createPostCommentNotification(postId, commentId, user.id);
        }
        
        // Notify parent to refresh comment count
        if (onCommentAdded) {
          onCommentAdded();
        }
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

  const renderReply = (reply: PostCommentReply) => (
    <View style={styles.replyItem}>
      <View style={styles.replyUserInfo}>
        {reply.profiles?.avatar_url ? (
          <Image 
            source={{ uri: reply.profiles.avatar_url }} 
            style={styles.replyAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.replyAvatarPlaceholder}>
            <Text style={styles.replyAvatarInitial}>
              {reply.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.replyUserDetails}>
          <Text style={[styles.replyAuthor, { color: theme.textPrimary }]}>
            {reply.profiles?.display_name || reply.profiles?.username || 'Unknown User'}
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

  const renderComment = ({ item }: { item: PostComment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          {item.profiles?.avatar_url ? (
            <Image 
              source={{ uri: item.profiles.avatar_url }} 
              style={styles.commentAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarInitial}>
                {item.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.commentUserDetails}>
            <View style={styles.commentHeaderRow}>
              <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>
                {item.profiles?.display_name || item.profiles?.username || 'Unknown User'}
                <Text style={[styles.commentTime, { color: theme.textTertiary }]}>
                  {' • '}{getTimeAgo(item.created_at)}
                </Text>
              </Text>
              <View style={styles.commentActions}>
                <PostCommentReplyButton
                  onPress={() => handleReplyPress(item)}
                  replyCount={commentReplies[item.id] || 0}
                  size="small"
                  showCount={true}
                />
                <PostCommentLikeButton
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
              {item.content}
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
                  Replying to {replyingToCommentData.profiles?.display_name || replyingToCommentData.profiles?.username || 'user'}
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
                    `Reply to ${replyingToCommentData.profiles?.display_name || replyingToCommentData.profiles?.username || 'user'}...` : 
                    "Add a comment..."
                  }
                  placeholderTextColor={theme.textTertiary}
                  value={newComment}
                  onChangeText={handleCommentChange}
                  multiline
                  maxLength={500}
                  blurOnSubmit={false}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { 
                    backgroundColor: newComment.trim() ? theme.primary : theme.backgroundSecondary,
                    opacity: submitting ? 0.5 : 1
                  }
                ]}
                onPress={submitComment}
                disabled={!newComment.trim() || submitting}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newComment.trim() ? '#ffffff' : theme.textTertiary} 
                />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  commentsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  commentAvatarInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    fontWeight: '400',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  repliesContainer: {
    marginLeft: 44,
    marginTop: 8,
  },
  replyWrapper: {
    marginBottom: 8,
  },
  replyItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  replyAvatarInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
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
    fontWeight: '400',
  },
  replyText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  addCommentContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelReplyButton: {
    padding: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInputContainer: {
    flex: 1,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
