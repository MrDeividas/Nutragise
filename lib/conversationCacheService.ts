import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  dataContext?: any;
}

interface ConversationCache {
  messages: CachedMessage[];
  lastUpdated: number;
  expiresAt: number;
}

class ConversationCacheService {
  private static CACHE_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  /**
   * Get cache key for user conversations
   */
  private static getConversationCacheKey(userId: string): string {
    return `conversation_${userId}`;
  }

  /**
   * Check if cache is valid (not expired)
   */
  private static isCacheValid(cache: ConversationCache | null): boolean {
    if (!cache) return false;
    return Date.now() < cache.expiresAt;
  }

  /**
   * Save conversation to cache
   */
  static async saveConversation(userId: string, messages: CachedMessage[]): Promise<void> {
    try {
      const cacheKey = this.getConversationCacheKey(userId);
      const cache: ConversationCache = {
        messages,
        lastUpdated: Date.now(),
        expiresAt: Date.now() + this.CACHE_EXPIRY
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving conversation cache:', error);
    }
  }

  /**
   * Get cached conversation
   */
  static async getConversation(userId: string): Promise<CachedMessage[] | null> {
    try {
      const cacheKey = this.getConversationCacheKey(userId);
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cache: ConversationCache = JSON.parse(cached);
      
      if (!this.isCacheValid(cache)) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cache.messages;
    } catch (error) {
      console.error('Error reading conversation cache:', error);
      return null;
    }
  }

  /**
   * Add message to conversation cache
   */
  static async addMessage(userId: string, message: CachedMessage): Promise<void> {
    try {
      const existingMessages = await this.getConversation(userId) || [];
      const updatedMessages = [...existingMessages, message];
      
      // Keep only last 20 messages to prevent cache bloat
      if (updatedMessages.length > 20) {
        updatedMessages.splice(0, updatedMessages.length - 20);
      }
      
      await this.saveConversation(userId, updatedMessages);
    } catch (error) {
      console.error('Error adding message to cache:', error);
    }
  }

  /**
   * Clear conversation cache
   */
  static async clearConversation(userId: string): Promise<void> {
    try {
      const cacheKey = this.getConversationCacheKey(userId);
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing conversation cache:', error);
    }
  }

  /**
   * Get conversation context for AI
   */
  static async getConversationContext(userId: string): Promise<string> {
    try {
      const messages = await this.getConversation(userId);
      
      if (!messages || messages.length === 0) {
        return '';
      }
      
      // Get last 5 messages for context
      const recentMessages = messages.slice(-5);
      
      return recentMessages.map(msg => 
        `${msg.isUser ? 'User' : 'AI'}: ${msg.text}`
      ).join('\n');
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return '';
    }
  }

  /**
   * Check if conversation cache exists and is valid
   */
  static async hasValidCache(userId: string): Promise<boolean> {
    try {
      const messages = await this.getConversation(userId);
      return messages !== null && messages.length > 0;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Get cache status for debugging
   */
  static async getCacheStatus(userId: string): Promise<{
    exists: boolean;
    isValid: boolean;
    messageCount: number;
    expiresIn: number | null;
  }> {
    try {
      const cacheKey = this.getConversationCacheKey(userId);
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) {
        return { exists: false, isValid: false, messageCount: 0, expiresIn: null };
      }
      
      const cache: ConversationCache = JSON.parse(cached);
      const isValid = this.isCacheValid(cache);
      const expiresIn = isValid ? cache.expiresAt - Date.now() : null;
      
      return { 
        exists: true, 
        isValid, 
        messageCount: cache.messages.length,
        expiresIn 
      };
    } catch (error) {
      console.error('Error checking cache status:', error);
      return { exists: false, isValid: false, messageCount: 0, expiresIn: null };
    }
  }

  /**
   * Clean up expired caches (background task)
   */
  static async cleanupExpiredCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const conversationKeys = keys.filter(key => key.startsWith('conversation_'));
      
      for (const key of conversationKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cache: ConversationCache = JSON.parse(cached);
          if (!this.isCacheValid(cache)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired caches:', error);
    }
  }
}

export default ConversationCacheService;
