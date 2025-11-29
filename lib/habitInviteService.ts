import { supabase } from './supabase';
import { HabitAccountabilityPartner, HabitPartnerProgress } from '../types/database';
import { notificationService } from './notificationService';

class HabitInviteService {
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

      if (existing) {
        if (existing.status === 'cancelled' || existing.status === 'declined') {
          // Re-send invite
          const { data, error } = await supabase
            .from('habit_accountability_partners')
            .update({
              status: 'pending',
              mode,
              created_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;

          // Create notification
          await notificationService.createNotification({
            user_id: inviteeId,
            from_user_id: inviterId,
            notification_type: 'habit_invite',
            habit_type: habitType === 'core' ? identifier : 'custom', // Store identifier in habit_type field for notification convenience, or use metadata
            // Ideally we should add specific fields to notification table, but for now we can use existing structure
          });

          return data;
        }
        return existing; // Already pending or active
      }

      // Create new invite
      const { data, error } = await supabase
        .from('habit_accountability_partners')
        .insert({
          inviter_id: inviterId,
          invitee_id: inviteeId,
          habit_type: habitType,
          habit_key: habitKey,
          custom_habit_id: customHabitId,
          mode,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await notificationService.createNotification({
        user_id: inviteeId,
        from_user_id: inviterId,
        notification_type: 'habit_invite',
        // We'll handle specific data storage in notification service update
      });

      return data;
    } catch (error) {
      console.error('Error sending habit invite:', error);
      throw error;
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

      // Notify inviter
      if (partnership) {
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
          console.error('❌ Partner progress subscription failed:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Partner progress subscription timed out');
        }
      });

    return channel;
  }
}

export const habitInviteService = new HabitInviteService();

