import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  entries: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

class SmartCacheService {
  private static instance: SmartCacheService;
  private readonly STORAGE_PREFIX = '@labor_checker_cache_';
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000;

  private constructor() {
    this.loadMemoryCache();
  }

  static getInstance(): SmartCacheService {
    if (!SmartCacheService.instance) {
      SmartCacheService.instance = new SmartCacheService();
    }
    return SmartCacheService.instance;
  }

  private async loadMemoryCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));

      for (const key of cacheKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const entry = JSON.parse(stored);
          const memKey = key.replace(this.STORAGE_PREFIX, '');
          this.memoryCache.set(memKey, entry);
        }
      }
    } catch (error) {
      console.error('[SmartCache] Failed to load memory cache:', error);
    }
  }

  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.memoryCache.set(key, entry);

    try {
      await AsyncStorage.setItem(
        this.STORAGE_PREFIX + key,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error('[SmartCache] Failed to save cache:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      await this.remove(key);
      return null;
    }

    return entry.data as T;
  }

  async getWithMetadata<T>(key: string): Promise<{ data: T; isStale: boolean; age: number } | null> {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const isStale = age > entry.ttl;

    if (isStale) {
      await this.remove(key);
      return null;
    }

    return {
      data: entry.data as T,
      isStale: false,
      age,
    };
  }

  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    return age <= entry.ttl;
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.error('[SmartCache] Failed to remove cache:', error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[SmartCache] Failed to clear cache:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    let totalSize = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.memoryCache.values()) {
      totalSize += JSON.stringify(entry).length;

      if (!oldestEntry || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (!newestEntry || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      size: totalSize,
      entries: this.memoryCache.size,
      oldestEntry,
      newestEntry,
    };
  }

  async cleanup(): Promise<number> {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        await this.remove(key);
        removed++;
      }
    }

    console.log(`[SmartCache] Cleaned up ${removed} expired entries`);
    return removed;
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

export const smartCache = SmartCacheService.getInstance();
