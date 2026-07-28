import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useNotificationsStore } from '../state/notificationsStore';

// Show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  /**
   * Full initialisation — call this once when a user logs in.
   * Requests permission, gets token, saves it to DB, sets up Android channel.
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Push notifications only work on real devices
      if (!Device.isDevice) {
        console.log('📵 Push notifications skipped — running on simulator');
        return;
      }

      // Android requires a notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6C47FF',
        });
        await Notifications.setNotificationChannelAsync('dms', {
          name: 'Direct Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
        await Notifications.setNotificationChannelAsync('challenges', {
          name: 'Challenges',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const token = await this.registerForPushNotifications();
      if (token) {
        await this.savePushToken(userId, token);
        console.log('✅ Push notifications registered');
      }
    } catch (error) {
      // Non-fatal — app works fine without push notifications
      console.warn('⚠️ Push notification setup failed (non-fatal):', error);
    }
  }

  /**
   * Request permissions and get the Expo push token.
   */
  private async registerForPushNotifications(): Promise<string | null> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('🔕 Push notification permission denied');
      return null;
    }

    // projectId is required — read from app.json extra.eas.projectId if available
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenData.data;
  }

  /**
   * Upsert the push token for this user in the database.
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Remove the push token when a user logs out so they stop receiving notifications.
   */
  async removePushToken(userId: string): Promise<void> {
    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  /**
   * Set up listeners for incoming notifications and taps.
   * Pass a navigation handler to route the user on tap.
   * Returns a cleanup function — call it in useEffect cleanup.
   */
  setupListeners(onTap: (data: Record<string, any>) => void): () => void {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received:', notification.request.content.title);
        useNotificationsStore.getState().refresh();
      }
    );

    // Fired when the user taps a notification (foreground or background)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, any>;
        console.log('👆 Notification tapped:', data);
        onTap(data);
      }
    );

    return () => this.removeListeners();
  }

  /**
   * Remove notification listeners — call on logout or unmount.
   */
  removeListeners(): void {
    this.notificationListener?.remove();
    this.responseListener?.remove();
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Schedule a local notification (e.g. habit reminder).
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: Record<string, any> = {},
    trigger: Notifications.NotificationTriggerInput = null
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger,
    });
  }

  /**
   * Cancel a single scheduled local notification by id.
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.warn('Failed to cancel scheduled notification:', error);
    }
  }

  /**
   * Cancel all scheduled local notifications.
   */
  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Clear the notification badge count (iOS).
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const pushNotificationService = new PushNotificationService();
