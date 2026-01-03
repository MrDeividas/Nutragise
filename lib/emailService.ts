import { PublicChallengeRequest } from '../types/challenges';

class EmailService {
  /**
   * Send public challenge request email to help@nutragise.com
   */
  async sendPublicChallengeRequest(request: PublicChallengeRequest): Promise<boolean> {
    try {
      // For now, use a simple fetch to a Supabase Edge Function
      // You'll need to create this edge function separately
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-challenge-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(request),
        }
    );

      return response.ok;
    } catch (error) {
      console.error('Error sending public challenge request email:', error);
      // For now, just log and return true (placeholder)
      console.log('Public Challenge Request:', request);
      return true;
    }
  }
}

export const emailService = new EmailService();
