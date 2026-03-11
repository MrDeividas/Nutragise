import { supabase } from './supabase';
import { challengePotService } from './challengePotService';

/**
 * Maps habit types to their corresponding challenge titles
 */
const HABIT_TO_CHALLENGE_MAP: Record<string, string> = {
  gym: 'Gym Challenge',
  run: 'Exercise Challenge', // Note: run habit maps to Exercise Challenge
  update_goal: 'Goal Update Challenge',
  microlearn: 'Microlearn Challenge',
  focus: 'Focus Challenge',
  reflect: 'Reflection Challenge',
  water: 'Water Challenge',
  cold_shower: 'Cold Shower Challenge',
  screen_time: 'Screen Time Challenge',
  sleep: 'Sleep Challenge',
  meditation: 'Meditation Challenge',
};

class HabitChallengeSyncService {
  /**
   * Get the challenge title for a given habit type
   */
  private getChallengeTitleForHabit(habitType: string): string | null {
    return HABIT_TO_CHALLENGE_MAP[habitType] || null;
  }

  /**
   * Find the active challenge instance for a habit on a given date
   */
  private async getActiveChallengeForHabit(
    habitType: string,
    date: string
  ): Promise<{ id: string; title: string } | null> {
    try {
      const challengeTitle = this.getChallengeTitleForHabit(habitType);
      if (!challengeTitle) {
        return null;
      }

      // Parse the date and get start/end of day in UTC
      const targetDate = new Date(date + 'T00:00:00Z');
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Find active challenge instance for this week
      // Weekly challenges start on Monday and end on Sunday
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, title, start_date, end_date')
        .eq('title', challengeTitle)
        .eq('is_recurring', true)
        .lte('start_date', endOfDay.toISOString())
        .gte('end_date', startOfDay.toISOString())
        .in('status', ['upcoming', 'active'])
        .order('start_date', { ascending: false })
        .limit(1);

      if (error) {
        if (__DEV__) {
          console.error('Error finding active challenge:', error);
        }
        return null;
      }

      if (!challenges || challenges.length === 0) {
        if (__DEV__) {
          console.log(`No active challenge found for ${challengeTitle} on ${date}`);
        }
        return null;
      }

      return {
        id: challenges[0].id,
        title: challenges[0].title,
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error in getActiveChallengeForHabit:', error);
      }
      return null;
    }
  }

  /**
   * Check if user is participating in a challenge
   */
  private async isUserParticipating(
    challengeId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine
        if (__DEV__) {
          console.error('Error checking participation:', error);
        }
        return false;
      }

      return !!data;
    } catch (error) {
      if (__DEV__) {
        console.error('Error in isUserParticipating:', error);
      }
      return false;
    }
  }

  /**
   * Check if submission already exists for this day
   */
  private async submissionExists(
    challengeId: string,
    userId: string,
    date: string
  ): Promise<boolean> {
    try {
      const targetDate = new Date(date + 'T00:00:00Z');
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .gte('submitted_at', startOfDay.toISOString())
        .lte('submitted_at', endOfDay.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine
        if (__DEV__) {
          console.error('Error checking submission existence:', error);
        }
        return false;
      }

      return !!data;
    } catch (error) {
      if (__DEV__) {
        console.error('Error in submissionExists:', error);
      }
      return false;
    }
  }

  /**
   * Create automatic submission for a challenge
   */
  private async createAutomaticSubmission(
    challengeId: string,
    userId: string,
    date: string
  ): Promise<string | null> {
    try {
      const submittedAt = new Date(date + 'T12:00:00Z'); // Use noon UTC for the submission time

      const { data: submission, error } = await supabase
        .from('challenge_submissions')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          photo_url: null, // Automatic submissions don't require photos
          week_number: 1, // For 7-day challenges, use week 1
          submission_notes: 'Automatic submission from habit completion',
          verification_status: 'approved', // Auto-approved for automatic verification
          submitted_at: submittedAt.toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        if (__DEV__) {
          console.error('Error creating automatic submission:', error);
        }
        return null;
      }

      return submission?.id || null;
    } catch (error) {
      if (__DEV__) {
        console.error('Error in createAutomaticSubmission:', error);
      }
      return null;
    }
  }

  /**
   * Main sync function: Sync habit completion to challenge submission
   */
  async syncHabitCompletionToChallenge(
    userId: string,
    habitType: string,
    date: string
  ): Promise<boolean> {
    try {
      // Get the challenge title for this habit
      const challengeTitle = this.getChallengeTitleForHabit(habitType);
      if (!challengeTitle) {
        if (__DEV__) {
          console.log(`No challenge mapping for habit type: ${habitType}`);
        }
        return false;
      }

      // Find the active challenge instance for this date
      const challenge = await this.getActiveChallengeForHabit(habitType, date);
      if (!challenge) {
        if (__DEV__) {
          console.log(
            `No active challenge found for ${challengeTitle} on ${date}`
          );
        }
        return false;
      }

      // Check if user is participating
      const isParticipating = await this.isUserParticipating(
        challenge.id,
        userId
      );
      if (!isParticipating) {
        if (__DEV__) {
          console.log(
            `User ${userId} is not participating in ${challengeTitle}`
          );
        }
        return false;
      }

      // Check if submission already exists for this day
      const alreadyExists = await this.submissionExists(
        challenge.id,
        userId,
        date
      );
      if (alreadyExists) {
        if (__DEV__) {
          console.log(
            `Submission already exists for ${challengeTitle} on ${date}`
          );
        }
        return true; // Return true since submission already exists
      }

      // Create the automatic submission
      const submissionId = await this.createAutomaticSubmission(
        challenge.id,
        userId,
        date
      );
      if (!submissionId) {
        if (__DEV__) {
          console.error(
            `Failed to create submission for ${challengeTitle} on ${date}`
          );
        }
        return false;
      }

      // Track daily proof for pot system
      try {
        await challengePotService.trackDailyProof(
          challenge.id,
          userId,
          date,
          true,
          submissionId
        );
      } catch (proofError) {
        // Don't fail if proof tracking fails
        if (__DEV__) {
          console.warn('Error tracking daily proof:', proofError);
        }
      }

      if (__DEV__) {
        console.log(
          `✅ Synced habit completion: ${habitType} -> ${challengeTitle} on ${date}`
        );
      }

      return true;
    } catch (error) {
      // Don't throw - sync failures shouldn't break habit completion
      if (__DEV__) {
        console.error('Error in syncHabitCompletionToChallenge:', error);
      }
      return false;
    }
  }
}

export const habitChallengeSyncService = new HabitChallengeSyncService();
