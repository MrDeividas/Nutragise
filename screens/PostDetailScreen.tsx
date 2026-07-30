import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';
import CustomBackground from '../components/CustomBackground';
import PostCommentModal from '../components/PostCommentModal';

type PostDetailParams = {
  PostDetail: {
    postId: string;
    openComments?: boolean;
  };
};

type LoadedPost = {
  id: string;
  kind: 'post' | 'daily_post';
  title: string;
  body: string;
  photos: string[];
  habits: string[];
  date?: string;
  author?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
};

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PostDetailParams, 'PostDetail'>>();
  const { theme } = useTheme();
  const postId = route.params?.postId;
  const openComments = !!route.params?.openComments;

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<LoadedPost | null>(null);
  const [commentsVisible, setCommentsVisible] = useState(openComments);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: regular } = await supabase
          .from('posts')
          .select('id, user_id, content, caption, photos, habits_completed, date')
          .eq('id', postId)
          .maybeSingle();

        let loaded: LoadedPost | null = null;

        if (regular) {
          loaded = {
            id: regular.id,
            kind: 'post',
            title: 'Post',
            body: regular.caption || regular.content || '',
            photos: Array.isArray(regular.photos) ? regular.photos : [],
            habits: Array.isArray(regular.habits_completed) ? regular.habits_completed : [],
            date: regular.date,
            author: { id: regular.user_id },
          };
        } else {
          const { data: daily } = await supabase
            .from('daily_posts')
            .select('id, user_id, captions, photos, habits_completed, date')
            .eq('id', postId)
            .maybeSingle();

          if (daily) {
            const caption = Array.isArray(daily.captions)
              ? [...daily.captions].reverse().find((c: string) => !!c?.trim()) || ''
              : '';
            loaded = {
              id: daily.id,
              kind: 'daily_post',
              title: 'Daily Post',
              body: caption,
              photos: Array.isArray(daily.photos) ? daily.photos : [],
              habits: Array.isArray(daily.habits_completed) ? daily.habits_completed : [],
              date: daily.date,
              author: { id: daily.user_id },
            };
          }
        }

        if (loaded?.author?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', loaded.author.id)
            .maybeSingle();
          if (profile) {
            loaded.author = profile;
          }
        }

        if (!cancelled) {
          setPost(loaded);
        }
      } catch (error) {
        console.error('Error loading post detail:', error);
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (openComments && post) {
      setCommentsVisible(true);
    }
  }, [openComments, post]);

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {post?.title || 'Post'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={"#1f2937"} />
          </View>
        ) : !post ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              This post is no longer available
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.authorRow}>
              {post.author?.avatar_url ? (
                <Image source={{ uri: post.author.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.backgroundTertiary }]}>
                  <Ionicons name="person" size={18} color={theme.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.authorName, { color: theme.textPrimary }]}>
                  {post.author?.display_name || post.author?.username || 'User'}
                </Text>
                {!!post.date && (
                  <Text style={[styles.meta, { color: theme.textTertiary }]}>{post.date}</Text>
                )}
              </View>
            </View>

            {!!post.body && (
              <Text style={[styles.body, { color: theme.textPrimary }]}>{post.body}</Text>
            )}

            {post.habits.length > 0 && (
              <Text style={[styles.habits, { color: theme.textSecondary }]}>
                Habits: {post.habits.join(', ')}
              </Text>
            )}

            {post.photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} resizeMode="cover" />
            ))}

            <TouchableOpacity
              style={[styles.commentsButton, { backgroundColor: theme.primary }]}
              onPress={() => setCommentsVisible(true)}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              <Text style={styles.commentsButtonText}>View comments</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {post && (
          <PostCommentModal
            visible={commentsVisible}
            postId={post.id}
            postTitle={post.kind === 'daily_post' ? 'Daily Post' : post.title}
            onClose={() => setCommentsVisible(false)}
          />
        )}
      </SafeAreaView>
    </CustomBackground>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  body: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
  habits: { fontSize: 13, marginBottom: 12 },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  commentsButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentsButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
