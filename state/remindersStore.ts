import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '../lib/pushNotificationService';
import { supabase } from '../lib/supabase';

export interface Reminder {
  id: string;
  user_id?: string;
  title: string;
  time: string | null; // ISO date string or specific format
  hasNotification: boolean;
  repeat: 'none' | 'daily' | 'weekly';
  notificationId?: string;
  completed: boolean;
}

interface RemindersState {
  reminders: Reminder[];
  fetchReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

function buildReminderTrigger(
  triggerDate: Date,
  repeat: 'none' | 'daily' | 'weekly'
): Notifications.NotificationTriggerInput {
  if (repeat === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
    };
  }
  if (repeat === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: triggerDate.getDay() + 1, // 1=Sunday … 7=Saturday
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: triggerDate,
  };
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],
      fetchReminders: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data) {
            const mappedReminders = data.map((r) => ({
              id: r.id,
              user_id: r.user_id,
              title: r.title,
              time: r.time,
              hasNotification: r.has_notification,
              repeat: r.repeat_type,
              notificationId: r.notification_id,
              completed: r.completed,
            }));
            set({ reminders: mappedReminders });
          }
        } catch (error) {
          console.error('Error fetching reminders:', error);
        }
      },
      addReminder: async (reminderData) => {
        const newId = Math.random().toString(36).substring(2, 9);
        let notificationId: string | undefined;

        if (reminderData.hasNotification && reminderData.time) {
          const triggerDate = new Date(reminderData.time);

          if (triggerDate > new Date() || reminderData.repeat !== 'none') {
            try {
              const scheduledId = await pushNotificationService.scheduleLocalNotification(
                'Reminder',
                reminderData.title,
                { reminderId: newId, type: 'habit_reminder' },
                buildReminderTrigger(triggerDate, reminderData.repeat)
              );
              notificationId = scheduledId || undefined;
              if (!scheduledId) {
                console.warn('Reminder saved without notification — permission denied or schedule failed');
              }
            } catch (e) {
              console.warn('Failed to schedule local notification:', e);
            }
          }
        }

        const newReminder: Reminder = {
          ...reminderData,
          id: newId,
          notificationId,
          completed: false,
        };

        set((state) => ({
          reminders: [...state.reminders, newReminder],
        }));

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('reminders')
              .insert([
                {
                  user_id: user.id,
                  title: reminderData.title,
                  time: reminderData.time,
                  has_notification: reminderData.hasNotification,
                  repeat_type: reminderData.repeat,
                  notification_id: notificationId || null,
                  completed: false,
                },
              ])
              .select()
              .single();

            if (!error && data) {
              set((state) => ({
                reminders: state.reminders.map((r) =>
                  r.id === newId ? { ...r, id: data.id } : r
                ),
              }));
            }
          }
        } catch (error) {
          console.error('Error syncing new reminder to database:', error);
        }
      },
      toggleReminder: async (id) => {
        const state = get();
        const reminder = state.reminders.find((r) => r.id === id);
        const newCompletedStatus = !reminder?.completed;

        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, completed: newCompletedStatus } : r
          ),
        }));

        try {
          await supabase
            .from('reminders')
            .update({ completed: newCompletedStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        } catch (error) {
          console.error('Error toggling reminder in db:', error);
        }
      },
      deleteReminder: async (id) => {
        const { reminders } = get();
        const reminder = reminders.find((r) => r.id === id);

        if (reminder?.notificationId) {
          await pushNotificationService.cancelScheduledNotification(reminder.notificationId);
        }

        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));

        try {
          await supabase.from('reminders').delete().eq('id', id);
        } catch (error) {
          console.error('Error deleting reminder in db:', error);
        }
      },
    }),
    {
      name: 'reminders-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
