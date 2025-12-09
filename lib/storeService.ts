/**
 * Store Service
 * Manages store items, user inventory, and token transactions
 */

import { supabase } from './supabase';

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

      // Tokens = level (1 token per level)
      // If tokens field doesn't match level, sync it
      const expectedTokens = data?.level || 1;
      if (data?.tokens !== expectedTokens) {
        await this.syncTokensWithLevel(userId, expectedTokens);
        return expectedTokens;
      }

      return data?.tokens || 0;
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
      if (profile.level < item.level_required) {
        return { success: false, message: `You need to be level ${item.level_required} to claim this item` };
      }

      // 5. Check if user has enough tokens
      if (profile.tokens < item.price_tokens) {
        return { success: false, message: `Insufficient tokens. You need ${item.price_tokens} tokens` };
      }

      // 6. Deduct tokens
      const newTokenBalance = profile.tokens - item.price_tokens;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: newTokenBalance })
        .eq('id', userId);

      if (updateError) {
        console.error('Error deducting tokens:', updateError);
        return { success: false, message: 'Failed to deduct tokens' };
      }

      // 7. Add to inventory (or update quantity)
      const { data: existingItem } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (existingItem) {
        // Update existing
        const { error: inventoryError } = await supabase
          .from('user_inventory')
          .update({ 
            quantity: existingItem.quantity + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Rollback tokens
          await supabase.from('profiles').update({ tokens: profile.tokens }).eq('id', userId);
          return { success: false, message: 'Failed to update inventory' };
        }
      } else {
        // Create new
        const { error: inventoryError } = await supabase
          .from('user_inventory')
          .insert({
            user_id: userId,
            item_id: itemId,
            quantity: 1
          });

        if (inventoryError) {
          console.error('Error adding to inventory:', inventoryError);
          // Rollback tokens
          await supabase.from('profiles').update({ tokens: profile.tokens }).eq('id', userId);
          return { success: false, message: 'Failed to add to inventory' };
        }
      }

      console.log('✅ Item claimed successfully:', { userId, itemId, newTokenBalance });

      return { 
        success: true, 
        message: `${item.name} claimed successfully!`,
        newTokenBalance
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

      // Decrement quantity
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({ 
          quantity: inventoryItem.quantity - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error('Error using item:', updateError);
        return { success: false, message: 'Failed to use item' };
      }

      console.log('✅ Item used successfully:', { userId, itemId });

      return { 
        success: true, 
        message: 'Item used successfully',
        inventoryId: inventoryItem.id
      };
    } catch (error) {
      console.error('Error in useItem:', error);
      return { success: false, message: 'Failed to use item' };
    }
  }
}

export const storeService = new StoreService();

