import { create } from 'zustand';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type InAppBanner = {
  id: string;
  type: string;
  title: string;
  body: string;
  avatarUrl?: string | null;
  postId?: string | null;
  fromUserId?: string | null;
  habitType?: string | null;
  goalId?: string | null;
};

interface NotificationsState {
  unreadCount: number;
  userId: string | null;
  banner: InAppBanner | null;
  subscribe: (userId: string) => void;
  unsubscribe: () => void;
  refresh: (forUserId?: string) => Promise<void>;
  clearCount: () => void;
  showBanner: (banner: InAppBanner) => void;
  hideBanner: () => void;
}

let channel: RealtimeChannel | null = null;
let bannerTimer: ReturnType<typeof setTimeout> | null = null;

const QUIET_TYPES = new Set(['habit_reward', 'achievement_unlocked']);
/** Types that should never contribute to the tab badge */
const BADGE_EXCLUDED_TYPES = new Set(['habit_reward']);

function formatBannerCopy(n: {
  notification_type: string;
  habit_type?: string | null;
  fromName: string;
}): { title: string; body: string } {
  switch (n.notification_type) {
    case 'post_like':
      return { title: 'New like', body: `${n.fromName} liked your post` };
    case 'post_comment':
      return { title: 'New comment', body: `${n.fromName} commented on your post` };
    case 'post_reply':
      return { title: 'New reply', body: `${n.fromName} replied to your comment` };
    case 'follow':
      return { title: 'New follower', body: `${n.fromName} started following you` };
    case 'habit_invite':
      return {
        title: 'Habit invite',
        body: n.habit_type
          ? `${n.fromName} invited you to track "${n.habit_type}"`
          : `${n.fromName} invited you to track a habit`,
      };
    case 'habit_invite_accepted':
      return {
        title: 'Invite accepted',
        body: n.habit_type
          ? `${n.fromName} accepted your "${n.habit_type}" invite`
          : `${n.fromName} accepted your habit invite`,
      };
    case 'habit_nudge':
      return {
        title: 'Habit nudge',
        body: n.habit_type
          ? `${n.fromName} nudged you to complete "${n.habit_type}"`
          : `${n.fromName} nudged you about a habit`,
      };
    case 'challenge_approved':
      return { title: 'Challenge approved', body: 'Your challenge was approved' };
    case 'challenge_rejected':
      return { title: 'Challenge update', body: 'Your challenge needs changes' };
    case 'submission_invalidated':
      return { title: 'Submission update', body: 'A challenge submission was invalidated' };
    case 'achievement_unlocked':
      return {
        title: 'Achievement unlocked',
        body: n.habit_type ? String(n.habit_type) : 'You unlocked a new achievement',
      };
    default:
      return { title: 'Notification', body: `${n.fromName} interacted with you` };
  }
}

async function buildBannerFromRow(row: any): Promise<InAppBanner | null> {
  if (!row?.id || QUIET_TYPES.has(row.notification_type)) return null;

  let fromName = 'Someone';
  let avatarUrl: string | null = null;

  if (row.from_user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', row.from_user_id)
      .maybeSingle();
    if (profile) {
      fromName = profile.display_name || profile.username || fromName;
      avatarUrl = profile.avatar_url || null;
    }
  }

  const { title, body } = formatBannerCopy({
    notification_type: row.notification_type,
    habit_type: row.habit_type,
    fromName,
  });

  return {
    id: row.id,
    type: row.notification_type,
    title,
    body,
    avatarUrl,
    postId: row.post_id ?? null,
    fromUserId: row.from_user_id ?? null,
    habitType: row.habit_type ?? null,
    goalId: row.goal_id ?? null,
  };
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  userId: null,
  banner: null,

  subscribe: (userId: string) => {
    const current = get();
    if (current.userId === userId && channel) return;

    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }

    set({ userId });

    notificationService.getUnreadCount(userId).then((count) => {
      set({ unreadCount: count });
    });

    channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const type = (payload.new as any)?.notification_type as string | undefined;
          if (type && BADGE_EXCLUDED_TYPES.has(type)) {
            return;
          }
          // Re-sync from DB so the badge can't drift from optimistic +1
          notificationService.getUnreadCount(userId).then((count) => {
            set({ unreadCount: count });
          });

          // Only show drop-down banner while app is foregrounded
          if (AppState.currentState !== 'active') return;

          buildBannerFromRow(payload.new).then((banner) => {
            if (banner) get().showBanner(banner);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          notificationService.getUnreadCount(userId).then((count) => {
            set({ unreadCount: count });
          });
        }
      )
      .subscribe();
  },

  unsubscribe: () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    if (bannerTimer) {
      clearTimeout(bannerTimer);
      bannerTimer = null;
    }
    set({ unreadCount: 0, userId: null, banner: null });
  },

  refresh: async (forUserId?: string) => {
    const userId = forUserId || get().userId;
    if (!userId) {
      set({ unreadCount: 0 });
      return;
    }
    const count = await notificationService.getUnreadCount(userId);
    set({ unreadCount: count });
  },

  clearCount: () => set({ unreadCount: 0 }),

  showBanner: (banner) => {
    if (bannerTimer) {
      clearTimeout(bannerTimer);
      bannerTimer = null;
    }
    set({ banner });
    bannerTimer = setTimeout(() => {
      set({ banner: null });
      bannerTimer = null;
    }, 3800);
  },

  hideBanner: () => {
    if (bannerTimer) {
      clearTimeout(bannerTimer);
      bannerTimer = null;
    }
    set({ banner: null });
  },
}));
