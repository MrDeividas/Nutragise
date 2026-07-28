import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationsState {
  unreadCount: number;
  userId: string | null;
  /** Start listening for realtime inserts & mark-read updates */
  subscribe: (userId: string) => void;
  /** Stop listening and reset */
  unsubscribe: () => void;
  /** Force-refresh the count from the DB */
  refresh: () => Promise<void>;
  /** Optimistically set count to 0 (call after markAllAsRead) */
  clearCount: () => void;
}

let channel: RealtimeChannel | null = null;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  userId: null,

  subscribe: (userId: string) => {
    const current = get();
    if (current.userId === userId && channel) return;

    // Clean up any previous subscription
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }

    set({ userId });

    // Initial load
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
        () => {
          set((s) => ({ unreadCount: s.unreadCount + 1 }));
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
          // Re-fetch after bulk mark-as-read or single mark-as-read
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
    set({ unreadCount: 0, userId: null });
  },

  refresh: async () => {
    const { userId } = get();
    if (!userId) return;
    const count = await notificationService.getUnreadCount(userId);
    set({ unreadCount: count });
  },

  clearCount: () => set({ unreadCount: 0 }),
}));
