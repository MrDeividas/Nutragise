import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Save token to database
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Send DM notification (called from backend/edge function)
  async sendDMNotification(recipientToken: string, senderName: string, message: string): Promise<void> {
    // This will be implemented as a Supabase Edge Function
    // For now, create the structure
    console.log('DM notification:', { recipientToken, senderName, message });
  }

  // Listen for notifications
  setupNotificationListener(onNotificationReceived: (notification: any) => void) {
    return Notifications.addNotificationReceivedListener(onNotificationReceived);
  }

  // Handle notification response (when user taps notification)
  setupNotificationResponseListener(onNotificationTapped: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(onNotificationTapped);
  }
}

export const pushNotificationService = new PushNotificationService();

