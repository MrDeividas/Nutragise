import AsyncStorage from '@react-native-async-storage/async-storage';
import { InsightCard } from '../types/insights';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface InsightCache {
  insights: InsightCard[];
  analytics: {
    streaks: any;
    patterns: any;
    correlations: any;
  };
}

class CacheService {
  private static CACHE_EXPIRY = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  private static PERIODS = ['past7', 'currentWeek', 'last30'] as const;

  /**
   * Generate cache key for user insights (period-scoped)
   */
  private static getInsightCacheKey(userId: string, period: string = 'past7'): string {
    return `insights_${userId}_${period}`;
  }

  /**
   * Check if cache is valid (not expired)
   */
  private static isCacheValid<T>(cache: CacheItem<T> | null): boolean {
    if (!cache) return false;
    return Date.now() < cache.expiresAt;
  }

  /**
   * Get cached insights for user + period
   */
  static async getCachedInsights(
    userId: string,
    period: string = 'past7'
  ): Promise<InsightCache | null> {
    try {
      const cacheKey = this.getInsightCacheKey(userId, period);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) return null;

      const cache: CacheItem<InsightCache> = JSON.parse(cached);

      if (!this.isCacheValid(cache)) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache insights for user + period
   */
  static async cacheInsights(
    userId: string,
    insights: InsightCard[],
    analytics: any,
    period: string = 'past7'
  ): Promise<void> {
    try {
      const cacheKey = this.getInsightCacheKey(userId, period);
      const cache: CacheItem<InsightCache> = {
        data: {
          insights,
          analytics,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_EXPIRY,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  /**
   * Clear cache for user (all periods)
   */
  static async clearCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        ...this.PERIODS.map((period) =>
          AsyncStorage.removeItem(this.getInsightCacheKey(userId, period))
        ),
        // Legacy key without period
        AsyncStorage.removeItem(`insights_${userId}`),
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache status (for debugging)
   */
  static async getCacheStatus(
    userId: string,
    period: string = 'past7'
  ): Promise<{
    exists: boolean;
    isValid: boolean;
    expiresIn: number | null;
  }> {
    try {
      const cacheKey = this.getInsightCacheKey(userId, period);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return { exists: false, isValid: false, expiresIn: null };
      }

      const cache: CacheItem<InsightCache> = JSON.parse(cached);
      const isValid = this.isCacheValid(cache);
      const expiresIn = isValid ? cache.expiresAt - Date.now() : null;

      return { exists: true, isValid, expiresIn };
    } catch (error) {
      console.error('Error checking cache status:', error);
      return { exists: false, isValid: false, expiresIn: null };
    }
  }

  /**
   * Invalidate cache when user completes new habits
   */
  static async invalidateOnHabitCompletion(userId: string): Promise<void> {
    // Clear cache when user completes habits to ensure fresh data
    await this.clearCache(userId);
  }
}

export default CacheService;
