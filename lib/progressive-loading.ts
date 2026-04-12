import { LaborResult } from './types';
import { getCachedResult, cacheResult } from './offline-cache';
import { fetchLaborResult } from './api';
import { ApiParams } from './types';

export interface ProgressiveLoadState {
  cached: LaborResult | null;
  fresh: LaborResult | null;
  isFetching: boolean;
  error: string | null;
  cacheAge: number | null; // milliseconds
  isCacheStale: boolean;
}

/**
 * Load result with progressive strategy: show cached instantly, fetch fresh in background
 */
export async function loadResultProgressively(
  entryId: string,
  params: ApiParams,
  onStateChange?: (state: ProgressiveLoadState) => void
): Promise<ProgressiveLoadState> {
  const state: ProgressiveLoadState = {
    cached: null,
    fresh: null,
    isFetching: false,
    error: null,
    cacheAge: null,
    isCacheStale: false,
  };

  // Step 1: Load cached result immediately
  try {
    const cached = await getCachedResult(entryId);
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      state.cached = cached.result;
      state.cacheAge = cacheAge;
      state.isCacheStale = cacheAge > 3600000; // 1 hour
      onStateChange?.(state);
      console.log(`📦 [Progressive] Loaded cached result for ${entryId}, age: ${cacheAge}ms`);
    }
  } catch (error) {
    console.error('Failed to load cached result:', error);
  }

  // Step 2: Fetch fresh result in background
  state.isFetching = true;
  onStateChange?.(state);

  try {
    const fresh = await fetchLaborResult(params);
    if (fresh) {
      state.fresh = fresh;
      state.error = null;

      // Cache the fresh result
      await cacheResult(entryId, fresh);
      console.log(`📦 [Progressive] Fetched and cached fresh result for ${entryId}`);
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Failed to fetch result';
    console.error('Failed to fetch fresh result:', error);
  } finally {
    state.isFetching = false;
    onStateChange?.(state);
  }

  return state;
}

/**
 * Get the best available result (fresh > cached)
 */
export function getBestResult(state: ProgressiveLoadState): LaborResult | null {
  return state.fresh || state.cached;
}

/**
 * Check if result has been updated
 */
export function hasResultUpdated(state: ProgressiveLoadState): boolean {
  if (!state.cached || !state.fresh) return false;
  return state.cached.exam_result !== state.fresh.exam_result;
}

/**
 * Format cache age for display
 */
export function formatCacheAge(ageMs: number | null): string {
  if (ageMs === null) return 'Unknown';

  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Determine if cache is stale (older than threshold)
 */
export function isCacheStale(ageMs: number | null, thresholdMs: number = 3600000): boolean {
  if (ageMs === null) return true;
  return ageMs > thresholdMs;
}
