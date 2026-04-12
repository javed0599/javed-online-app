import AsyncStorage from '@react-native-async-storage/async-storage';
import { LaborResult } from './types';

export interface CachedResult {
  result: LaborResult;
  timestamp: string;
  isOffline: boolean;
}

const CACHE_PREFIX = 'offline_cache_';
const CACHE_INDEX_KEY = 'offline_cache_index';

/**
 * Cache a result locally for offline access
 */
export async function cacheResult(entryId: string, result: LaborResult): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${entryId}`;
    const cached: CachedResult = {
      result,
      timestamp: new Date().toISOString(),
      isOffline: false,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));

    // Update cache index
    const index = await getCacheIndex();
    if (!index.includes(entryId)) {
      index.push(entryId);
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
    }

    console.log(`📦 [Cache] Cached result for entry ${entryId}`);
  } catch (error) {
    console.error('Failed to cache result:', error);
  }
}

/**
 * Get cached result for an entry
 */
export async function getCachedResult(entryId: string): Promise<CachedResult | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${entryId}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Failed to get cached result:', error);
    return null;
  }
}

/**
 * Get all cached results
 */
export async function getAllCachedResults(): Promise<Record<string, CachedResult>> {
  try {
    const index = await getCacheIndex();
    const results: Record<string, CachedResult> = {};

    for (const entryId of index) {
      const cached = await getCachedResult(entryId);
      if (cached) {
        results[entryId] = cached;
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to get all cached results:', error);
    return {};
  }
}

/**
 * Clear cache for a specific entry
 */
export async function clearEntryCache(entryId: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${entryId}`;
    await AsyncStorage.removeItem(cacheKey);

    // Update index
    const index = await getCacheIndex();
    const updatedIndex = index.filter((id) => id !== entryId);
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(updatedIndex));

    console.log(`📦 [Cache] Cleared cache for entry ${entryId}`);
  } catch (error) {
    console.error('Failed to clear entry cache:', error);
  }
}

/**
 * Clear all cached results
 */
export async function clearAllCache(): Promise<void> {
  try {
    const index = await getCacheIndex();

    for (const entryId of index) {
      const cacheKey = `${CACHE_PREFIX}${entryId}`;
      await AsyncStorage.removeItem(cacheKey);
    }

    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    console.log('📦 [Cache] Cleared all cached results');
  } catch (error) {
    console.error('Failed to clear all cache:', error);
  }
}

/**
 * Get cache index (list of cached entry IDs)
 */
export async function getCacheIndex(): Promise<string[]> {
  try {
    const index = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Failed to get cache index:', error);
    return [];
  }
}

/**
 * Get cache size info
 */
export async function getCacheSizeInfo(): Promise<{
  count: number;
  oldestTimestamp?: string;
  newestTimestamp?: string;
}> {
  try {
    const index = await getCacheIndex();
    let oldestTimestamp: string | undefined;
    let newestTimestamp: string | undefined;

    for (const entryId of index) {
      const cached = await getCachedResult(entryId);
      if (cached) {
        if (!oldestTimestamp || cached.timestamp < oldestTimestamp) {
          oldestTimestamp = cached.timestamp;
        }
        if (!newestTimestamp || cached.timestamp > newestTimestamp) {
          newestTimestamp = cached.timestamp;
        }
      }
    }

    return {
      count: index.length,
      oldestTimestamp,
      newestTimestamp,
    };
  } catch (error) {
    console.error('Failed to get cache size info:', error);
    return { count: 0 };
  }
}

/**
 * Format cache timestamp for display
 */
export function formatCacheTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    return timestamp;
  }
}

/**
 * Check if cached result is stale (older than threshold)
 */
export function isCacheStale(timestamp: string, thresholdMs: number = 3600000): boolean {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    return now.getTime() - date.getTime() > thresholdMs;
  } catch {
    return true;
  }
}
