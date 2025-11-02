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

      // Save selected habits (this will also set habits_last_changed timestamp)
      if (data.selectedHabits.length > 0) {
        await dailyHabitsService.updateSelectedHabits(userId, data.selectedHabits);
      }

      // Save habit frequencies/schedules (this will also update habits_last_changed timestamp)
      for (const [habitId, schedule] of Object.entries(data.habitFrequencies)) {
        await dailyHabitsService.updateHabitSchedule(userId, habitId, schedule);
      }
      
      // If habits were saved, ensure habits_last_changed is set (backup in case only schedules were updated)
      if (data.selectedHabits.length > 0 || Object.keys(data.habitFrequencies).length > 0) {
        const { error: timestampError } = await supabase
          .from('profiles')
          .update({ habits_last_changed: new Date().toISOString() })
          .eq('id', userId);
        
        if (timestampError) {
          console.warn('Failed to set habits_last_changed timestamp:', timestampError);
        }
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
   * Save partial onboarding data (for users who exit early)
   */
  async savePartialOnboardingData(userId: string, data: Partial<OnboardingData>, currentStep: number): Promise<boolean> {
    try {
      console.log('💾 Saving partial onboarding data for user:', userId);
      console.log('📊 Partial data to save:', JSON.stringify(data, null, 2));
      console.log('📍 Current step:', currentStep);
      
      // Build update object with only provided fields
      const updateData: any = {
        onboarding_completed: false,
        onboarding_last_step: currentStep,
      };

      // Only add fields that have actual values
      if (data.referralCode !== undefined && data.referralCode !== null) {
        updateData.referral_code = data.referralCode;
      }
      if (data.isPremium !== undefined && data.isPremium !== null) {
        updateData.is_premium = data.isPremium;
      }

      // Update profile with partial onboarding fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        return false;
      }
      
      console.log('✅ Profile updated successfully with partial data');

      return true;
    } catch (error) {
      console.error('Error saving partial onboarding data:', error);
      return false;
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

