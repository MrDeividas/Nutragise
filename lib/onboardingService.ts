import { supabase } from './supabase';
import { dailyHabitsService } from './dailyHabitsService';
import { OnboardingData } from '../state/onboardingStore';

class OnboardingService {
  /**
   * Save all onboarding data to database
   */
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<boolean> {
    try {
      console.log('💾 Saving onboarding data for user:', userId);
      console.log('📊 Data to save:', JSON.stringify(data, null, 2));
      
      // Update profile with onboarding fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          referral_code: data.referralCode,
          date_of_birth: data.dateOfBirth,
          life_description: data.lifeDescription,
          change_reason: data.changeReason,
          proud_moment: data.proudMoment,
          morning_motivation: data.morningMotivation,
          current_state: data.currentState,
          is_premium: data.isPremium,
          auth_method: data.authMethod,
          onboarding_completed: true,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        return false;
      }
      
      console.log('✅ Profile updated successfully');

      // Save selected habits
      if (data.selectedHabits.length > 0) {
        await dailyHabitsService.updateSelectedHabits(userId, data.selectedHabits);
      }

      // Save habit frequencies/schedules
      for (const [habitId, schedule] of Object.entries(data.habitFrequencies)) {
        await dailyHabitsService.updateHabitSchedule(userId, habitId, schedule);
      }

      return true;
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      return false;
    }
  }

  /**
   * Create initial goal during onboarding
   */
  async createInitialGoal(userId: string, goalData: any): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          title: goalData.title,
          description: goalData.description,
          category: goalData.category,
          start_date: new Date().toISOString().split('T')[0],
          end_date: goalData.endDate,
          milestones: goalData.milestones || [],
          completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating goal:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createInitialGoal:', error);
      return null;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      return data?.onboarding_completed || false;
    } catch (error) {
      console.error('Error in hasCompletedOnboarding:', error);
      return false;
    }
  }
}

export const onboardingService = new OnboardingService();

