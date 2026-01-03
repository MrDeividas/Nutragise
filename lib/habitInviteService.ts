import { supabase } from './supabase';
import { HabitAccountabilityPartner, HabitPartnerProgress, CustomHabit } from '../types/database';
import { notificationService } from './notificationService';
import { dailyHabitsService } from './dailyHabitsService';
import { habitsService } from './habitsService';

// Core habit name mapping
const CORE_HABIT_NAMES: Record<string, string> = {
  gym: 'Gym',
  run: 'Run',
  sleep: 'Sleep',
  water: 'Water',
  reflect: 'Reflect',
  focus: 'Focus',
  update_goal: 'Update Goal',
  meditation: 'Meditation',
  microlearn: 'Microlearn',
  cold_shower: 'Cold Shower',
  screen_time: 'Screen Time Limit',
  like: 'Like Posts',
  comment: 'Comment Posts',
  share: 'Share Posts',
};

class HabitInviteService {
  /**
   * Get display name for a habit (core or custom)
   */
  private async getHabitDisplayName(habitType: 'core' | 'custom', identifier: string): Promise<string> {
    if (habitType === 'core') {
      return CORE_HABIT_NAMES[identifier] || identifier;
    } else {
      // For custom habits, fetch the title
      const habitDetails = await this.getCustomHabitDetails(identifier);
      return habitDetails?.title || 'Custom Habit';
    }
  }

  /**
   * Send an accountability invite to a friend
   */
  async sendHabitInvite(
    inviterId: string,
    inviteeId: string,
    habitType: 'core' | 'custom',
    identifier: string, // habit_key or custom_habit_id
    mode: 'supportive' | 'competitive'
  ): Promise<HabitAccountabilityPartner | null> {
    try {
      const habitKey = habitType === 'core' ? identifier : null;
      const customHabitId = habitType === 'custom' ? identifier : null;

      // Check for existing invitation
      const { data: existing } = await supabase
        .from('habit_accountability_partners')
        .select('*')
        .eq('inviter_id', inviterId)
        .eq('invitee_id', inviteeId)
        .eq('habit_type', habitType)
        .eq(habitType === 'core' ? 'habit_key' : 'custom_habit_id', identifier)
        .single();

      // Get habit snapshot for custom habits
      let habitSnapshot = null;
      if (habitType === 'custom' && customHabitId) {
        const habitDetails = await this.getCustomHabitDetails(customHabitId);
        if (habitDetails) {
          habitSnapshot = {
            title: habitDetails.title,
            preset_key: habitDetails.preset_key,
            category: habitDetails.category,
            habit_mode: habitDetails.habit_mode,
            description: habitDetails.description,
            accent_color: habitDetails.accent_color,
            icon_name: habitDetails.icon_name,
            schedule_type: habitDetails.schedule_type,
            days_of_week: habitDetails.days_of_week,
            days_of_month: habitDetails.days_of_month,
            quantity_per_week: habitDetails.quantity_per_week,
            quantity_per_fortnight: habitDetails.quantity_per_fortnight,
            quantity_per_month: habitDetails.quantity_per_month,
            every_x_days: habitDetails.every_x_days,
            start_date: habitDetails.start_date,
            timezone: habitDetails.timezone,
            goal_duration_minutes: habitDetails.goal_duration_minutes,
            metadata: habitDetails.metadata,
          };
        }
      }

      if (existing) {
        if (existing.status === 'cancelled' || existing.status === 'declined') {
          // Re-send invite
          const updateData: any = {
            status: 'pending',
            mode,
            habit_snapshot: habitSnapshot,
            created_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('habit_accountability_partners')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;

          // Get habit display name for notification
          const habitDisplayName = await this.getHabitDisplayName(habitType, identifier);

          // Create notification
          await notificationService.createNotification({
            user_id: inviteeId,
            from_user_id: inviterId,
            notification_type: 'habit_invite',
            habit_type: habitDisplayName, // Store habit display name for notification
          });

          return data;
        }
        return existing; // Already pending or active
      }

      // Create new invite
      const insertData: any = {
        inviter_id: inviterId,
        invitee_id: inviteeId,
        habit_type: habitType,
        habit_key: habitKey,
        custom_habit_id: customHabitId,
        habit_snapshot: habitSnapshot,
        mode,
        status: 'pending'
      };
      
      // Only add new fields if they exist in the database (after migration)
      if (habitType === 'custom' && customHabitId) {
        insertData.inviter_habit_id = customHabitId;
        insertData.invitee_habit_id = null;
      }
      
      const { data, error } = await supabase
        .from('habit_accountability_partners')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Get habit display name for notification
      const habitDisplayName = await this.getHabitDisplayName(habitType, identifier);

      // Create notification
      await notificationService.createNotification({
        user_id: inviteeId,
        from_user_id: inviterId,
        notification_type: 'habit_invite',
        habit_type: habitDisplayName, // Store habit display name for notification
      });

      return data;
    } catch (error) {
      console.error('Error sending habit invite:', error);
      throw error;
    }
  }

  /**
   * Get all pending invites sent by a user
   */
  async getPendingInvites(userId: string): Promise<HabitAccountabilityPartner[]> {
    try {
      // Fetch pending invites where user is the inviter
      const { data: invites, error } = await supabase
        .from('habit_accountability_partners')
        .select('*')
        .eq('inviter_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      
      if (!invites || invites.length === 0) {
        console.log('[getPendingInvites] No pending invites found');
        return [];
      }

      console.log('[getPendingInvites] Found invites:', invites.map(i => ({
        id: i.id,
        habit_type: i.habit_type,
        habit_key: i.habit_key,
        custom_habit_id: i.custom_habit_id,
        inviter_habit_id: i.inviter_habit_id,
        invitee_id: i.invitee_id
      })));

      // Fetch invitee profiles
      const inviteeIds = invites.map((inv: any) => inv.invitee_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', inviteeIds);
        
      if (profilesError) {
        console.error('Error fetching invitee profiles:', profilesError);
      }

      const profilesMap = new Map();
      if (profiles) {
        profiles.forEach(p => profilesMap.set(p.id, p));
      }

      // Combine data
      return invites.map((invite: any) => ({
        ...invite,
        partner: profilesMap.get(invite.invitee_id) || { id: invite.invitee_id, username: 'Unknown User' }
      }));
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      return [];
    }
  }

  /**
   * Get all active partnerships for a user
   */
  async getActivePartners(userId: string): Promise<HabitAccountabilityPartner[]> {
    try {
      // 1. Fetch partnerships without joins to avoid FK ambiguity
      const { data: partnerships, error } = await supabase
        .from('habit_accountability_partners')
        .select('*')
        .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;
      
      if (!partnerships || partnerships.length === 0) return [];

      // 2. Collect user IDs to fetch profiles for
      const userIdsToFetch = new Set<string>();
      partnerships.forEach((p: any) => {
        if (p.inviter_id !== userId) userIdsToFetch.add(p.inviter_id);
        if (p.invitee_id !== userId) userIdsToFetch.add(p.invitee_id);
      });

      if (userIdsToFetch.size === 0) return partnerships as any;

      // 3. Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', Array.from(userIdsToFetch));
        
      if (profilesError) {
        console.error('Error fetching partner profiles:', profilesError);
      }

      const profilesMap = new Map();
      if (profiles) {
        profiles.forEach(p => profilesMap.set(p.id, p));
      }

      // 4. Combine data
      return partnerships.map((partnership: any) => {
        const isInviter = partnership.inviter_id === userId;
        const partnerId = isInviter ? partnership.invitee_id : partnership.inviter_id;
        const partnerProfile = profilesMap.get(partnerId);
        
        return {
          ...partnership,
          partner: partnerProfile || { id: partnerId, username: 'Unknown User' }
        };
      });
    } catch (error) {
      console.error('Error fetching active partners:', error);
      return [];
    }
  }

  /**
   * Get habit schedule for a specific habit from a user's profile
   */
  private async getHabitSchedule(userId: string, habitKey: string): Promise<boolean[] | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('habit_schedules')
        .eq('id', userId)
        .single();

      if (error || !data?.habit_schedules) {
        return null;
      }

      return data.habit_schedules[habitKey] || null;
    } catch (error) {
      console.error('Error fetching habit schedule:', error);
      return null;
    }
  }

  /**
   * Get custom habit details by habit ID
   */
  private async getCustomHabitDetails(habitId: string): Promise<CustomHabit | null> {
    try {
      const { data, error } = await supabase
        .from('custom_habits')
        .select('*')
        .eq('id', habitId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching custom habit details:', error);
        return null;
      }

      if (!data) {
        console.log(`[AutoCreate] Custom habit ${habitId} not found (may have been deleted)`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching custom habit details:', error);
      return null;
    }
  }

  /**
   * Check if user already has a custom habit (checks if they have any custom habits)
   */
  private async userHasCustomHabits(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('custom_habits')
        .select('id')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .limit(1);

      if (error) {
        console.error('Error checking custom habits:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking custom habits:', error);
      return false;
    }
  }

  /**
   * Auto-create or enable habit for invitee when accepting partnership
   */
  private async autoCreateHabitForInvitee(
    inviteeId: string,
    inviterId: string,
    habitType: 'core' | 'custom',
    habitKey: string | null,
    customHabitId: string | null,
    habitSnapshot: any = null
  ): Promise<string | null> {
    try {
      if (habitType === 'core' && habitKey) {
        // Handle core habit
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_daily_habits')
          .eq('id', inviteeId)
          .single();

        const selectedHabits = profile?.selected_daily_habits || [];

        // Check if habit is already enabled
        if (!selectedHabits.includes(habitKey)) {
          console.log(`[AutoCreate] Enabling core habit '${habitKey}' for invitee`);
          
          // Enable the habit
          await dailyHabitsService.updateSelectedHabits(
            inviteeId,
            [...selectedHabits, habitKey]
          );

          // Copy inviter's schedule
          const inviterSchedule = await this.getHabitSchedule(inviterId, habitKey);
          if (inviterSchedule) {
            console.log(`[AutoCreate] Copying schedule for '${habitKey}'`);
            await dailyHabitsService.updateHabitSchedule(
              inviteeId,
              habitKey,
              inviterSchedule
            );
          }

          console.log(`[AutoCreate] Successfully enabled core habit '${habitKey}'`);
        } else {
          console.log(`[AutoCreate] Core habit '${habitKey}' already enabled, skipping`);
        }
      } else if (habitType === 'custom') {
        // Handle custom habit
        console.log(`[AutoCreate] Processing custom habit for invitee`);
        
        // Try to fetch inviter's habit details (if still exists)
        let inviterHabit = null;
        if (customHabitId) {
          inviterHabit = await this.getCustomHabitDetails(customHabitId);
        }

        // If habit not found, use the snapshot saved at invite time
        if (!inviterHabit && habitSnapshot) {
          console.log(`[AutoCreate] Using habit snapshot (original habit not found)`);
          inviterHabit = habitSnapshot;
        }

        if (inviterHabit) {
          // Check if invitee already has this specific habit (by title match)
          const { data: existingHabits } = await supabase
            .from('habits')
            .select('id')
            .eq('user_id', inviteeId)
            .eq('title', inviterHabit.title)
            .limit(1);

          if (!existingHabits || existingHabits.length === 0) {
            console.log(`[AutoCreate] Creating custom habit copy for invitee: "${inviterHabit.title}"`);
            
            // Create exact copy for invitee
            const newHabit = await habitsService.createHabit(inviteeId, {
              title: inviterHabit.title,
              preset_key: inviterHabit.preset_key,
              category: inviterHabit.category,
              habit_mode: inviterHabit.habit_mode,
              description: inviterHabit.description,
              accent_color: inviterHabit.accent_color,
              icon_name: inviterHabit.icon_name,
              schedule_type: inviterHabit.schedule_type,
              days_of_week: inviterHabit.days_of_week,
              days_of_month: inviterHabit.days_of_month,
              quantity_per_week: inviterHabit.quantity_per_week,
              quantity_per_fortnight: inviterHabit.quantity_per_fortnight,
              quantity_per_month: inviterHabit.quantity_per_month,
              every_x_days: inviterHabit.every_x_days,
              start_date: inviterHabit.start_date,
              timezone: inviterHabit.timezone,
              goal_duration_minutes: inviterHabit.goal_duration_minutes,
              metadata: inviterHabit.metadata,
            });

            console.log(`[AutoCreate] Successfully created custom habit copy: "${inviterHabit.title}" with ID: ${newHabit.id}`);
            return newHabit.id; // Return the new habit ID
          } else {
            console.log(`[AutoCreate] Invitee already has habit "${inviterHabit.title}", skipping creation`);
            return existingHabits[0].id; // Return existing habit ID
          }
        } else {
          console.log(`[AutoCreate] Could not find habit details (no habit found and no snapshot available)`);
        }
      }
    } catch (error) {
      // Log error but don't fail the partnership acceptance
      console.error('[AutoCreate] Error auto-creating habit:', error);
    }
    return null;
  }

  /**
   * Accept an invite
   */
  async acceptInvite(partnershipId: string, userId: string): Promise<boolean> {
    try {
      const { data: partnership, error } = await supabase
        .from('habit_accountability_partners')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', partnershipId)
        .eq('invitee_id', userId) // Security check
        .select()
        .single();

      if (error) throw error;

      // Auto-create or enable habit for invitee if they don't have it
      if (partnership) {
        const newHabitId = await this.autoCreateHabitForInvitee(
          userId,
          partnership.inviter_id,
          partnership.habit_type,
          partnership.habit_key,
          partnership.custom_habit_id,
          partnership.habit_snapshot
        );

        // For custom habits, update the partnership to reference the invitee's new habit ID
        if (partnership.habit_type === 'custom' && newHabitId) {
          console.log(`[AutoCreate] Updating partnership to reference invitee's habit ID: ${newHabitId}`);
          
          // Try updating with new field, fall back to old field if column doesn't exist
          try {
            await supabase
              .from('habit_accountability_partners')
              .update({ invitee_habit_id: newHabitId })
              .eq('id', partnershipId);
          } catch (err: any) {
            if (err?.code === 'PGRST204') {
              // Column doesn't exist yet, use legacy field
              console.log('[AutoCreate] Using legacy custom_habit_id field (migration not run yet)');
              await supabase
                .from('habit_accountability_partners')
                .update({ custom_habit_id: newHabitId })
                .eq('id', partnershipId);
            } else {
              throw err;
            }
          }
        }

        // Notify inviter
        await notificationService.createNotification({
          user_id: partnership.inviter_id,
          from_user_id: userId,
          notification_type: 'habit_invite_accepted',
        });
      }

      return true;
    } catch (error) {
      console.error('Error accepting invite:', error);
      return false;
    }
  }

  /**
   * Decline an invite
   */
  async declineInvite(partnershipId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('habit_accountability_partners')
        .update({ status: 'declined' })
        .eq('id', partnershipId)
        .eq('invitee_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error declining invite:', error);
      return false;
    }
  }

  /**
   * Cancel a pending invite (for the inviter)
   */
  async cancelInvite(partnershipId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('habit_accountability_partners')
        .update({ status: 'cancelled' })
        .eq('id', partnershipId)
        .eq('inviter_id', userId); // Only inviter can cancel

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling invite:', error);
      return false;
    }
  }

  /**
   * Remove/cancel an active partnership
   */
  async removePartnership(partnershipId: string, userId: string): Promise<boolean> {
    try {
      // Update status to 'cancelled' instead of deleting
      // This preserves the history
      const { error } = await supabase
        .from('habit_accountability_partners')
        .update({ status: 'cancelled' })
        .eq('id', partnershipId)
        .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`); // Allow either user to cancel

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing partnership:', error);
      return false;
    }
  }

  /**
   * Update partner progress
   */
  async updatePartnerProgress(
    partnershipId: string,
    userId: string,
    date: string,
    completed: boolean
  ): Promise<void> {
    try {
      console.log('[updatePartnerProgress] Writing to database:', { partnershipId, userId, date, completed });
      const { data, error } = await supabase
        .from('habit_partner_progress')
        .upsert({
          partnership_id: partnershipId,
          user_id: userId,
          date: date,
          completed: completed
        }, { onConflict: 'partnership_id,user_id,date' })
        .select();

      if (error) {
        console.error('[updatePartnerProgress] Database error:', error);
        throw error;
      }
      
      console.log('[updatePartnerProgress] Successfully wrote:', data);
    } catch (error) {
      console.error('[updatePartnerProgress] Failed:', error);
      throw error; // Re-throw so caller can handle
    }
  }

  /**
   * Check if partner completed a habit for a specific date
   */
  async checkPartnerCompletion(
    partnershipId: string, 
    partnerId: string, 
    date: string,
    habitType: 'core' | 'custom',
    habitIdentifier: string
  ): Promise<{ completed: boolean; streak: number }> {
    try {
      // Query the shared progress table
      const { data } = await supabase
        .from('habit_partner_progress')
        .select('completed, streak_count')
        .eq('partnership_id', partnershipId)
        .eq('user_id', partnerId)
        .eq('date', date)
        .single();
      
      return { 
        completed: data?.completed || false, 
        streak: data?.streak_count || 0 
      };
    } catch (error) {
      console.error('Error checking partner completion:', error);
      return { completed: false, streak: 0 };
    }
  }

  /**
   * Get the last nudge time for a partnership
   */
  async getLastNudgeTime(partnershipId: string): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('habit_nudges')
        .select('nudged_at')
        .eq('partnership_id', partnershipId)
        .order('nudged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching last nudge time:', error);
        return null;
      }

      return data ? new Date(data.nudged_at) : null;
    } catch (error) {
      console.error('Error fetching last nudge time:', error);
      return null;
    }
  }

  /**
   * Get last nudge times for multiple partnerships
   */
  async getLastNudgeTimes(partnershipIds: string[]): Promise<Record<string, Date>> {
    try {
      if (partnershipIds.length === 0) return {};

      const { data, error } = await supabase
        .from('habit_nudges')
        .select('partnership_id, nudged_at')
        .in('partnership_id', partnershipIds)
        .order('nudged_at', { ascending: false });

      if (error) {
        console.error('Error fetching last nudge times:', error);
        return {};
      }

      // Get the most recent nudge for each partnership
      const nudgeTimes: Record<string, Date> = {};
      data?.forEach((nudge) => {
        if (!nudgeTimes[nudge.partnership_id]) {
          nudgeTimes[nudge.partnership_id] = new Date(nudge.nudged_at);
        }
      });

      return nudgeTimes;
    } catch (error) {
      console.error('Error fetching last nudge times:', error);
      return {};
    }
  }

  /**
   * Check if a nudge can be sent (3-hour cooldown)
   */
  async canSendNudge(partnershipId: string): Promise<boolean> {
    try {
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

      const { data, error } = await supabase
        .from('habit_nudges')
        .select('nudged_at')
        .eq('partnership_id', partnershipId)
        .gte('nudged_at', threeHoursAgo.toISOString())
        .order('nudged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking nudge cooldown:', error);
        return true; // Allow nudge if there's an error checking
      }

      // If there's a recent nudge, can't send another
      return !data;
    } catch (error) {
      console.error('Error checking nudge cooldown:', error);
      return true; // Allow nudge if there's an error
    }
  }

  /**
   * Send a nudge to partner to complete their habit
   */
  async sendNudge(
    partnershipId: string,
    nudgerId: string,
    nudgedUserId: string,
    habitTitle: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if nudge is allowed (3-hour cooldown)
      const canNudge = await this.canSendNudge(partnershipId);
      if (!canNudge) {
        return {
          success: false,
          message: 'You can only nudge once every 3 hours'
        };
      }

      // Get partnership details to get habit info
      const { data: partnership, error: partnershipError } = await supabase
        .from('habit_accountability_partners')
        .select('habit_type, habit_key, custom_habit_id')
        .eq('id', partnershipId)
        .single();

      if (partnershipError || !partnership) {
        console.error('Error fetching partnership:', partnershipError);
        return {
          success: false,
          message: 'Failed to send nudge'
        };
      }

      // Record the nudge in the database
      const { error: insertError } = await supabase
        .from('habit_nudges')
        .insert({
          partnership_id: partnershipId,
          nudger_id: nudgerId,
          nudged_user_id: nudgedUserId,
          habit_type: partnership.habit_type,
          habit_key: partnership.habit_key,
          custom_habit_id: partnership.custom_habit_id,
        });

      if (insertError) {
        console.error('Error recording nudge:', insertError);
        return {
          success: false,
          message: 'Failed to send nudge'
        };
      }

      // Send notification to the partner
      const notificationSent = await notificationService.createHabitNudgeNotification(
        nudgedUserId,
        nudgerId,
        habitTitle
      );

      if (!notificationSent) {
        console.error('Failed to send nudge notification');
      }

      return {
        success: true,
        message: 'Nudge sent successfully!'
      };
    } catch (error) {
      console.error('Error sending nudge:', error);
      return {
        success: false,
        message: 'Failed to send nudge'
      };
    }
  }

  /**
   * Subscribe to partner progress updates
   * @param partnershipIds Array of partnership IDs to listen for
   * @param callback Function to call when partner progress changes
   * @returns Realtime channel for cleanup
   */
  subscribeToPartnerProgress(
    partnershipIds: string[],
    callback: (progress: HabitPartnerProgress) => void
  ) {
    if (partnershipIds.length === 0) {
      // Return a dummy channel if no partnerships
      return supabase.channel('partner-progress-empty');
    }

    // Create a Set for fast lookup
    const partnershipIdSet = new Set(partnershipIds);
    
    // Use unique channel name to avoid conflicts
    const channelName = `partner-progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    });

    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'habit_partner_progress'
        },
        (payload) => {
          // Filter in callback - only process if it's one of our partnerships
          const progress = payload.new || payload.old;
          if (!progress || !partnershipIdSet.has(progress.partnership_id)) {
            return;
          }

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as HabitPartnerProgress);
          } else if (payload.eventType === 'DELETE') {
            // On delete, we still want to refresh (partner uncompleted)
            callback(payload.old as HabitPartnerProgress);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Partner progress subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('ℹ️ Partner progress subscription status:', status, err?.message || 'No error details');
        } else if (status === 'TIMED_OUT') {
          console.log('⏱️ Partner progress subscription timed out (retrying automatically)');
        }
      });

    return channel;
  }
}

export const habitInviteService = new HabitInviteService();

