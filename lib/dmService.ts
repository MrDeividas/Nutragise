import { supabase } from './supabase';
import { Chat, Message, ChatWithProfile, TypingIndicator } from '../types/database';

class DMService {
  // Get or create chat between two users
  async getOrCreateChat(userId1: string, userId2: string): Promise<string | null> {
    try {
      // Ensure consistent ordering (smaller UUID first)
      const [participant1, participant2] = userId1 < userId2 
        ? [userId1, userId2] 
        : [userId2, userId1];

      // Check if chat exists
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('participant_1', participant1)
        .eq('participant_2', participant2)
        .single();

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          participant_1: participant1,
          participant_2: participant2
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        return null;
      }

      return newChat.id;
    } catch (error) {
      console.error('Error in getOrCreateChat:', error);
      return null;
    }
  }

  // Get user's chats with profiles and unread counts (OPTIMIZED - single query)
  async getUserChats(userId: string, filterFollowing?: boolean): Promise<ChatWithProfile[]> {
    try {
      // Use optimized RPC function that does everything in one query
      const { data, error } = await supabase
        .rpc('get_user_chats_optimized', { p_user_id: userId });

      if (error) {
        console.error('Error fetching chats:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      // Transform the flat data into ChatWithProfile format
      let result: ChatWithProfile[] = data.map((row: any) => ({
        id: row.chat_id,
        participant_1: row.participant_1,
        participant_2: row.participant_2,
        last_message_id: row.last_message_id,
        last_message_preview: row.last_message_preview,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        other_user: {
          id: row.other_user_id,
          username: row.other_user_username || 'Unknown',
          display_name: row.other_user_display_name || 'Unknown User',
          avatar_url: row.other_user_avatar_url
        },
        unread_count: row.unread_count || 0,
        is_following: row.is_following || false
      }));

      // Apply following filter if requested
      if (filterFollowing !== undefined) {
        result = result.filter(chat => chat.is_following === filterFollowing);
      }

      return result;
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return [];
    }
  }

  // Send message
  async sendMessage(chatId: string, senderId: string, content: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  // Get messages for a chat
  async getChatMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true }) // Query in correct order
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || []; // Already in correct order (oldest first)
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return [];
    }
  }

  // Mark messages as read (optimized - only if there are unread messages)
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Check if there are any unread messages first
      const { data: unreadCount } = await supabase
        .from('unread_counts')
        .select('unread_count')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .single();
      
      // Skip if no unread messages
      if (!unreadCount || unreadCount.unread_count === 0) {
        return;
      }

      // Mark all unread messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      // Reset unread count
      await supabase
        .from('unread_counts')
        .update({ unread_count: 0 })
        .eq('user_id', userId)
        .eq('chat_id', chatId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Set typing indicator
  async setTypingIndicator(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      // Always use UPSERT (UPDATE is more reliable than DELETE for real-time)
      await supabase
        .from('typing_indicators')
        .upsert({
          chat_id: chatId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'chat_id,user_id'
        });
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  // Subscribe to new messages
  subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    const channel = supabase.channel(`messages:${chatId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: '' },
      },
    });
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Messages subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Messages subscription failed:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Messages subscription timed out');
        }
      });
    
    return channel;
  }

  // Subscribe to typing indicators
  subscribeToTyping(chatId: string, callback: (typing: TypingIndicator) => void) {
    const channel = supabase.channel(`typing:${chatId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: '' },
      },
    });
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // When typing starts/stops/continues - use the is_typing field
            callback(payload.new as TypingIndicator);
          } else if (payload.eventType === 'DELETE') {
            // Fallback for DELETE (shouldn't happen now, but keep for safety)
            callback({ 
              chat_id: chatId,
              user_id: payload.old.user_id,
              is_typing: false,
              updated_at: new Date().toISOString()
            } as TypingIndicator);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Typing subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Typing subscription failed:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Typing subscription timed out');
        }
      });
    
    return channel;
  }

  // Subscribe to chat updates (for chat list)
  subscribeToChats(userId: string, callback: () => void) {
    return supabase
      .channel(`chats:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participant_1=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participant_2=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Get total unread count for badge
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('unread_counts')
        .select('unread_count')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return data?.reduce((sum, item) => sum + item.unread_count, 0) || 0;
    } catch (error) {
      console.error('Error in getTotalUnreadCount:', error);
      return 0;
    }
  }
}

export const dmService = new DMService();

