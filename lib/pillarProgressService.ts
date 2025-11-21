import { supabase } from './supabase';

export type PillarType = 'strength_fitness' | 'growth_wisdom' | 'discipline' | 'team_spirit' | 'overall';

export interface PillarProgress {
  id: string;
  user_id: string;
  pillar_type: PillarType;
  progress_percentage: number;
  last_activity_date: string | null;
  actions_today: number;
  created_at: string;
  updated_at: string;
}

export interface PillarProgressMap {
  strength_fitness: number;
  growth_wisdom: number;
  discipline: number;
  team_spirit: number;
  overall: number;
}

class PillarProgressService {
  private readonly PROGRESS_INCREMENT = 0.36;
  private readonly MAX_ACTIONS_PER_DAY = 2;
  private readonly DECAY_GRACE_DAYS = 3;
  private readonly DECAY_AMOUNT = 0.36;
  
  // Cache decay check - only run once per minute
  private lastDecayCheck: { [userId: string]: number } = {};
  private readonly DECAY_CHECK_INTERVAL = 60000; // 1 minute

  /**
   * Initialize pillar progress records for a new user
   */
  async initializeUserPillars(userId: string): Promise<boolean> {
    try {
      // First check if pillars already exist
      const { data: existingPillars } = await supabase
        .from('pillar_progress')
        .select('pillar_type')
        .eq('user_id', userId);

      const existingTypes = new Set(existingPillars?.map(p => p.pillar_type) || []);
      
      const pillars: PillarType[] = ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit', 'overall'];
      const missingPillars = pillars.filter(p => !existingTypes.has(p));

      // Only insert missing pillars, don't update existing ones
      if (missingPillars.length === 0) {
        return true; // All pillars already exist
      }

      const records = missingPillars.map(pillar => ({
        user_id: userId,
        pillar_type: pillar,
        progress_percentage: 35.0,
        last_activity_date: new Date().toISOString().split('T')[0],
        actions_today: 0
      }));

      const { error } = await supabase
        .from('pillar_progress')
        .insert(records); // Use INSERT instead of UPSERT to avoid overwriting

      if (error) {
        console.error('Error initializing user pillars:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in initializeUserPillars:', error);
      return false;
    }
  }

  /**
   * Track an action and update pillar progress
   */
  async trackAction(userId: string, pillarType: PillarType, actionType: string): Promise<boolean> {
    try {
      // Don't track actions for overall - it's calculated
      if (pillarType === 'overall') {
        return true;
      }

      // Ensure pillars exist first
      await this.initializeUserPillars(userId);

      // Get current pillar progress
      const { data: pillar, error: fetchError } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('pillar_type', pillarType)
        .single();

      if (fetchError) {
        // If pillar doesn't exist, try initializing again
        if (fetchError.code === 'PGRST116') {
          const initialized = await this.initializeUserPillars(userId);
          if (!initialized) {
            console.error('Failed to initialize pillars after fetch error');
            return false;
          }
          // Retry the fetch
          const { data: retryPillar, error: retryError } = await supabase
            .from('pillar_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('pillar_type', pillarType)
            .single();
          
          if (retryError) {
            console.error('Error fetching pillar progress after init:', retryError);
            return false;
          }
          
          // Use retryPillar for the rest of the function
          return this.processPillarUpdate(userId, pillarType, retryPillar);
        }
        console.error('Error fetching pillar progress:', {
          error: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
          userId,
          pillarType
        });
        return false;
      }

      return this.processPillarUpdate(userId, pillarType, pillar);
    } catch (error: any) {
      console.error('Error in trackAction:', {
        error: error?.message || error,
        name: error?.name,
        stack: error?.stack,
        userId,
        pillarType,
        actionType
      });
      return false;
    }
  }

  /**
   * Process the actual pillar update (extracted for reuse)
   */
  private async processPillarUpdate(userId: string, pillarType: PillarType, pillar: any): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      let actionsToday = pillar.actions_today || 0;
      
      // Reset actions_today if it's a new day
      if (pillar.last_activity_date !== today) {
        actionsToday = 0;
      }

      // Check if max actions reached for today
      if (actionsToday >= this.MAX_ACTIONS_PER_DAY) {
        return false;
      }

      // Don't apply decay when tracking an action - only when retrieving progress
      // This ensures progress always goes UP when completing habits
      const currentProgress = pillar.progress_percentage || 35;
      
      // Calculate new progress
      const newProgress = Math.min(100, currentProgress + this.PROGRESS_INCREMENT);
      const newActionsToday = actionsToday + 1;

      console.log(`📈 ${pillarType}: ${currentProgress.toFixed(2)}% → ${newProgress.toFixed(2)}% (+${this.PROGRESS_INCREMENT})`);

      // Update pillar progress
      const { error: updateError } = await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: newProgress,
          last_activity_date: today,
          actions_today: newActionsToday,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_type', pillarType);

      if (updateError) {
        console.error('❌ Error updating pillar progress:', {
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          userId,
          pillarType
        });
        return false;
      }

      console.log(`✅ ${pillarType} progress updated successfully`);

      // Update overall pillar
      await this.updateOverallPillar(userId);

      return true;
    } catch (error: any) {
      console.error('❌ Error in processPillarUpdate:', error);
      return false;
    }
  }

  /**
   * Check and apply decay if needed for a specific pillar
   * DISABLED: Decay functionality removed until requirements are finalized
   */
  async checkAndApplyDecay(userId: string, pillarType: PillarType): Promise<void> {
    // Decay disabled - no longer applying automatic progress reduction
    return;
  }

  /**
   * Apply decay to all pillars for a user
   * DISABLED: Decay functionality removed until requirements are finalized
   */
  async applyDecay(userId: string): Promise<void> {
    // Decay disabled - no longer applying automatic progress reduction
    return;
  }

  /**
   * Update the overall pillar as average of other 4 pillars
   */
  async updateOverallPillar(userId: string): Promise<void> {
    try {
      const pillars: PillarType[] = ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit'];
      
      const { data, error } = await supabase
        .from('pillar_progress')
        .select('progress_percentage')
        .eq('user_id', userId)
        .in('pillar_type', pillars);

      if (error || !data || data.length === 0) {
        console.error('Error fetching pillars for overall calculation:', error);
        return;
      }

      const average = data.reduce((sum, p) => sum + p.progress_percentage, 0) / data.length;

      await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: average,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_type', 'overall');
    } catch (error) {
      console.error('Error in updateOverallPillar:', error);
    }
  }

  /**
   * Deduct progress when a habit is removed/undone
   */
  async deductAction(userId: string, pillarType: PillarType, actionType: string): Promise<boolean> {
    try {
      // Don't track actions for overall - it's calculated
      if (pillarType === 'overall') {
        return true;
      }

      // Get current pillar progress
      const { data: pillar, error: fetchError } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('pillar_type', pillarType)
        .single();

      if (fetchError || !pillar) {
        console.error('Error fetching pillar for deduction:', fetchError);
        return false;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Only deduct if the action was added today
      if (pillar.last_activity_date !== today || pillar.actions_today <= 0) {
        return false;
      }

      // Calculate new progress (deduct the increment)
      const newProgress = Math.max(0, pillar.progress_percentage - this.PROGRESS_INCREMENT);
      const newActionsToday = Math.max(0, pillar.actions_today - 1);

      // Update pillar progress
      const { error: updateError } = await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: newProgress,
          actions_today: newActionsToday,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_type', pillarType);

      if (updateError) {
        console.error('❌ Error deducting pillar progress:', updateError);
        return false;
      }

      // Update overall pillar
      await this.updateOverallPillar(userId);

      return true;
    } catch (error: any) {
      console.error('❌ Error in deductAction:', error);
      return false;
    }
  }

  /**
   * Get all pillar progress for a user
   */
  async getPillarProgress(userId: string): Promise<PillarProgressMap> {
    try {
      // Ensure pillars exist
      await this.initializeUserPillars(userId);

      // NOTE: Don't apply decay here - it's already called on app open in ActionScreen
      // This prevents spam when ProfileScreen refreshes multiple times

      const { data, error } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching pillar progress:', error);
        // Return defaults
        return {
          strength_fitness: 35,
          growth_wisdom: 35,
          discipline: 35,
          team_spirit: 35,
          overall: 35
        };
      }

      const progressMap: PillarProgressMap = {
        strength_fitness: 35,
        growth_wisdom: 35,
        discipline: 35,
        team_spirit: 35,
        overall: 35
      };

      data?.forEach((pillar: PillarProgress) => {
        progressMap[pillar.pillar_type] = pillar.progress_percentage;
      });

      return progressMap;
    } catch (error) {
      console.error('Error in getPillarProgress:', error);
      return {
        strength_fitness: 35,
        growth_wisdom: 35,
        discipline: 35,
        team_spirit: 35,
        overall: 35
      };
    }
  }
}

export const pillarProgressService = new PillarProgressService();

