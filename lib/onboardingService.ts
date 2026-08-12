import { supabase } from './supabase';
import { dailyHabitsService } from './dailyHabitsService';
import { OnboardingData } from '../state/onboardingStore';
import { referralService } from './referralService';

class OnboardingService {
  /**
   * Save all onboarding data to database
   */
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<boolean> {
    try {
      console.log('💾 Saving onboarding data for user:', userId);
      console.log('📊 Data to save:', JSON.stringify(data, null, 2));
      
      // Update profile with onboarding fields
      // NOTE: do NOT write data.referralCode into profiles.referral_code —
      // that column is the user's own shareable code. Friend codes go via applyReferralCode.
      const updatePayload: Record<string, any> = {
        life_description: data.lifeDescription,
        change_reason: data.changeReason,
        proud_moment: data.proudMoment,
        morning_motivation: data.morningMotivation,
        current_state: data.currentState,
        // Pro is owned by RevenueCat (`is_pro` via revenuecat-webhook). Do not write
        // legacy `is_premium` (old Stripe membership flag).
        auth_method: data.authMethod,
        onboarding_completed: true,
        onboarding_last_step: null,
      };

      if (data.displayName?.trim()) {
        updatePayload.display_name = data.displayName.trim();
      }
      if (data.ageGroup) {
        // Persist age bracket; falls back safely if column is missing (retry below)
        updatePayload.age_group = data.ageGroup;
      }
      if (data.dateOfBirth) {
        updatePayload.date_of_birth = data.dateOfBirth;
      }

      let { error: profileError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

      // If age_group column doesn't exist yet, retry without it
      if (profileError && data.ageGroup) {
        console.warn('Retrying profile save without age_group:', profileError.message);
        delete updatePayload.age_group;
        const retry = await supabase.from('profiles').update(updatePayload).eq('id', userId);
        profileError = retry.error;
      }

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        return false;
      }
      
      console.log('✅ Profile updated successfully');

      // Attribute referral if they entered a friend's code
      if (data.referralCode?.trim()) {
        const referral = await referralService.applyReferralCode(data.referralCode);
        if (!referral.ok) {
          console.warn('Referral not applied:', referral.error);
        } else if (referral.referrerId) {
          console.log('✅ Referral applied →', referral.referrerName || referral.referrerId);
        }
      }

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
      const endDate =
        goalData.endDate ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 66);
          return d.toISOString().split('T')[0];
        })();

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          title: goalData.title,
          description: goalData.description || null,
          category: goalData.category || 'personal',
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
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
      // Never clobber a finished onboarding with a mid-flow partial write
      const { data: existing } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();
      if (existing?.onboarding_completed) {
        return true;
      }

      console.log('💾 Saving partial onboarding data for user:', userId);
      console.log('📊 Partial data to save:', JSON.stringify(data, null, 2));
      console.log('📍 Current step:', currentStep);
      
      // Build update object with only provided fields
      const updateData: any = {
        onboarding_completed: false,
        onboarding_last_step: currentStep,
      };

      // Only add fields that have actual values
      // Friend-entered code is applied at full save via apply_referral_code — do not
      // overwrite this user's own profiles.referral_code.
      // Do not persist data.isPremium → is_premium (legacy Stripe). Pro = RevenueCat.
      // Save onboarding answers if they exist (steps 6-10)
      if (data.lifeDescription !== undefined && data.lifeDescription !== null && data.lifeDescription !== '') {
        updateData.life_description = data.lifeDescription;
      }
      if (data.changeReason !== undefined && data.changeReason !== null && data.changeReason !== '') {
        updateData.change_reason = data.changeReason;
      }
      if (data.proudMoment !== undefined && data.proudMoment !== null && data.proudMoment !== '') {
        updateData.proud_moment = data.proudMoment;
      }
      if (data.morningMotivation !== undefined && data.morningMotivation !== null && data.morningMotivation !== '') {
        updateData.morning_motivation = data.morningMotivation;
      }
      if (data.currentState !== undefined && data.currentState !== null && data.currentState !== '') {
        updateData.current_state = data.currentState;
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

