/**
 * Store Service
 * Manages store items, user inventory, and token transactions
 */

import { supabase } from './supabase';

export const ACCOUNTABILITY_BOOST_TYPE = 'accountability_boost';
export const ACCOUNTABILITY_BOOST_DURATION_MS = 2 * 24 * 60 * 60 * 1000;
export const ACCOUNTABILITY_BOOST_ITEM_ID = 'a1000000-0000-4000-8000-0000000000b1';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price_tokens: number;
  level_required: number;
  image_url?: string;
  is_pro_only: boolean;
  type: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
  item?: StoreItem; // Joined data
}

export interface ActiveBoostStatus {
  active: boolean;
  expiresAt: string | null;
  remainingMs: number;
}

class StoreService {
  /**
   * Get all available store items
   */
  async getStoreItems(): Promise<StoreItem[]> {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .order('price_tokens', { ascending: true });

      if (error) {
        console.error('Error fetching store items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStoreItems:', error);
      return [];
    }
  }

  /**
   * Get user's current token balance
   */
  async getUserTokens(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tokens, level')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user tokens:', error);
        throw error;
      }

      // Initialize tokens once from level if unset
      if (data?.tokens == null) {
        const initial = data?.level || 1;
        await this.syncTokensWithLevel(userId, initial);
        return initial;
      }

      return data.tokens;
    } catch (error) {
      console.error('Error in getUserTokens:', error);
      return 0;
    }
  }

  /**
   * Sync user tokens with their level (1 token per level)
   */
  async syncTokensWithLevel(userId: string, level: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tokens: level })
        .eq('id', userId);

      if (error) {
        console.error('Error syncing tokens with level:', error);
      }
    } catch (error) {
      console.error('Error in syncTokensWithLevel:', error);
    }
  }

  /**
   * Deduct tokens from the user's balance
   */
  async deductTokens(
    userId: string,
    amount: number
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      if (amount <= 0) {
        return { success: false, message: 'Invalid amount' };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return { success: false, message: 'Could not load token balance' };
      }

      const current = profile.tokens ?? 0;
      if (current < amount) {
        return {
          success: false,
          message: `Not enough diamonds. Need ${amount}, you have ${current}.`,
        };
      }

      const newBalance = current - amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: newBalance })
        .eq('id', userId);

      if (updateError) {
        console.error('Error deducting tokens:', updateError);
        return { success: false, message: 'Failed to deduct diamonds' };
      }

      return { success: true, message: 'Tokens deducted', newBalance };
    } catch (error) {
      console.error('Error in deductTokens:', error);
      return { success: false, message: 'Failed to deduct diamonds' };
    }
  }

  /**
   * Get user's inventory
   */
  async getUserInventory(userId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          item:store_items(*)
        `)
        .eq('user_id', userId)
        .order('acquired_at', { ascending: false });

      if (error) {
        console.error('Error fetching user inventory:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserInventory:', error);
      return [];
    }
  }

  /**
   * Check if user has item in inventory
   */
  async hasItem(userId: string, itemId: string): Promise<{ has: boolean; quantity: number }> {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (error || !data) {
        return { has: false, quantity: 0 };
      }

      return { has: data.quantity > 0, quantity: data.quantity };
    } catch (error) {
      return { has: false, quantity: 0 };
    }
  }

  /**
   * Active Accountability Boost status (double points window)
   */
  async getActiveBoostStatus(userId: string): Promise<ActiveBoostStatus> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points_boost_expires_at')
        .eq('id', userId)
        .single();

      if (error || !data?.points_boost_expires_at) {
        return { active: false, expiresAt: null, remainingMs: 0 };
      }

      const expiresAt = data.points_boost_expires_at as string;
      const remainingMs = new Date(expiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        return { active: false, expiresAt, remainingMs: 0 };
      }

      return { active: true, expiresAt, remainingMs };
    } catch {
      return { active: false, expiresAt: null, remainingMs: 0 };
    }
  }

  /**
   * Points multiplier while Accountability Boost is active
   */
  async getPointsMultiplier(userId: string): Promise<number> {
    const status = await this.getActiveBoostStatus(userId);
    return status.active ? 2 : 1;
  }

  /**
   * Claim an item from the store (deducts tokens, adds to inventory)
   */
  async claimItem(userId: string, itemId: string): Promise<{ success: boolean; message: string; newTokenBalance?: number }> {
    try {
      // 1. Get the item details
      const { data: item, error: itemError } = await supabase
        .from('store_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError || !item) {
        return { success: false, message: 'Item not found' };
      }

      // 2. Get user's profile (tokens, level, is_pro)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tokens, level, is_pro')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return { success: false, message: 'User profile not found' };
      }

      // 3. Check if user is Pro (if item requires it)
      if (item.is_pro_only && !profile.is_pro) {
        return { success: false, message: 'This item is exclusive to Pro members' };
      }

      // 4. Check if user meets level requirement
      if ((profile.level || 1) < item.level_required) {
        return { success: false, message: `You need to be level ${item.level_required} to claim this item` };
      }

      // 5. One-time free Accountability Boost claim
      if (item.type === ACCOUNTABILITY_BOOST_TYPE) {
        const { data: existingBoost } = await supabase
          .from('user_inventory')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .maybeSingle();

        if (existingBoost) {
          return { success: false, message: 'You already claimed your Accountability Boost' };
        }
      }

      // 6. Check if user has enough tokens (0 = free)
      const price = item.price_tokens || 0;
      const currentTokens = profile.tokens ?? 0;
      if (currentTokens < price) {
        return { success: false, message: `Insufficient tokens. You need ${price} tokens` };
      }

      // 7. Deduct tokens
      const newTokenBalance = currentTokens - price;
      if (price > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ tokens: newTokenBalance })
          .eq('id', userId);

        if (updateError) {
          console.error('Error deducting tokens:', updateError);
          return { success: false, message: 'Failed to deduct tokens' };
        }
      }

      // 8. Add to inventory (or update quantity)
      const { data: existingItem } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle();

      if (existingItem) {
        const { error: inventoryError } = await supabase
          .from('user_inventory')
          .update({
            quantity: existingItem.quantity + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItem.id);

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          if (price > 0) {
            await supabase.from('profiles').update({ tokens: currentTokens }).eq('id', userId);
          }
          return { success: false, message: 'Failed to update inventory' };
        }
      } else {
        const { error: inventoryError } = await supabase
          .from('user_inventory')
          .insert({
            user_id: userId,
            item_id: itemId,
            quantity: 1,
          });

        if (inventoryError) {
          console.error('Error adding to inventory:', inventoryError);
          if (price > 0) {
            await supabase.from('profiles').update({ tokens: currentTokens }).eq('id', userId);
          }
          return { success: false, message: 'Failed to add to inventory' };
        }
      }

      return {
        success: true,
        message: `${item.name} claimed successfully!`,
        newTokenBalance,
      };
    } catch (error) {
      console.error('Error in claimItem:', error);
      return { success: false, message: 'Failed to claim item' };
    }
  }

  /**
   * Use an item from inventory (decrements quantity)
   */
  async useItem(userId: string, itemId: string): Promise<{ success: boolean; message: string; inventoryId?: string }> {
    try {
      const { data: inventoryItem, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (error || !inventoryItem) {
        return { success: false, message: 'Item not found in inventory' };
      }

      if (inventoryItem.quantity <= 0) {
        return { success: false, message: 'No items remaining' };
      }

      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({
          quantity: inventoryItem.quantity - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error('Error using item:', updateError);
        return { success: false, message: 'Failed to use item' };
      }

      return {
        success: true,
        message: 'Item used successfully',
        inventoryId: inventoryItem.id,
      };
    } catch (error) {
      console.error('Error in useItem:', error);
      return { success: false, message: 'Failed to use item' };
    }
  }

  /**
   * Activate Accountability Boost from inventory (double points for 2 days)
   */
  async activateAccountabilityBoost(
    userId: string
  ): Promise<{ success: boolean; message: string; expiresAt?: string }> {
    try {
      const { data: invRows, error } = await supabase
        .from('user_inventory')
        .select('id, quantity, item_id, item:store_items(id, type, name)')
        .eq('user_id', userId);

      if (error) {
        return { success: false, message: 'Could not load inventory' };
      }

      const boostRow = (invRows || []).find((row: any) => {
        const item = Array.isArray(row.item) ? row.item[0] : row.item;
        return item?.type === ACCOUNTABILITY_BOOST_TYPE && (row.quantity || 0) > 0;
      });

      if (!boostRow) {
        return { success: false, message: 'No Accountability Boost in inventory' };
      }

      const used = await this.useItem(userId, boostRow.item_id);
      if (!used.success) {
        return { success: false, message: used.message };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('points_boost_expires_at')
        .eq('id', userId)
        .single();

      const now = Date.now();
      const currentExpiry = profile?.points_boost_expires_at
        ? new Date(profile.points_boost_expires_at).getTime()
        : 0;
      const base = Math.max(now, currentExpiry);
      const expiresAt = new Date(base + ACCOUNTABILITY_BOOST_DURATION_MS).toISOString();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points_boost_expires_at: expiresAt })
        .eq('id', userId);

      if (updateError) {
        await supabase
          .from('user_inventory')
          .update({ quantity: boostRow.quantity || 1 })
          .eq('id', boostRow.id);
        return { success: false, message: 'Failed to activate boost' };
      }

      return {
        success: true,
        message: 'Accountability Boost activated — double points for 2 days!',
        expiresAt,
      };
    } catch (error) {
      console.error('Error in activateAccountabilityBoost:', error);
      return { success: false, message: 'Failed to activate boost' };
    }
  }
}

export const storeService = new StoreService();
