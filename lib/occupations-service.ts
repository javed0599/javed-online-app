import AsyncStorage from '@react-native-async-storage/async-storage';
import { Occupation, OccupationCache } from './types';

const OCCUPATIONS_API_URL = 'https://svp-international-api.pacc.sa/api/v1/visitor_space/occupations';
const OCCUPATIONS_CACHE_KEY = 'occupations_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface OccupationsResponse {
  occupations: Occupation[];
  pagination: {
    current: number;
    previous: number | null;
    next: number | null;
    per_page: number;
    pages: number;
    count: number;
  };
}

/**
 * Fetch occupations from API with pagination
 */
async function fetchOccupationsFromAPI(page: number = 1, perPage: number = 100): Promise<Occupation[]> {
  try {
    const url = `${OCCUPATIONS_API_URL}?per_page=${perPage}&page=${page}&locale=en`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: OccupationsResponse = await response.json();
    return data.occupations || [];
  } catch (error) {
    console.error('Failed to fetch occupations from API:', error);
    return [];
  }
}

/**
 * Fetch all occupations with pagination
 */
async function fetchAllOccupations(): Promise<Occupation[]> {
  const allOccupations: Occupation[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const occupations = await fetchOccupationsFromAPI(page, 100);
    if (occupations.length === 0) {
      hasMore = false;
    } else {
      allOccupations.push(...occupations);
      page++;
    }
  }

  return allOccupations;
}

/**
 * Get occupation name by code from cache or API
 */
export async function getOccupationName(occupationCode: string): Promise<string> {
  try {
    // Try to get from cache first
    const cachedData = await AsyncStorage.getItem(OCCUPATIONS_CACHE_KEY);
    if (cachedData) {
      const cache: Record<string, OccupationCache> = JSON.parse(cachedData);
      const cached = cache[occupationCode];

      if (cached && Date.now() - cached.cached_at < CACHE_EXPIRY_MS) {
        return cached.name;
      }
    }

    // Fetch from API if not in cache or expired
    const occupations = await fetchAllOccupations();
    const occupation = occupations.find((occ) => occ.occupation_key === occupationCode);

    if (occupation) {
      // Update cache
      const occupationName = occupation.english_name || occupation.name || occupationCode;
      await updateOccupationCache(occupationCode, occupationName, occupation.arabic_name);
      return occupationName;
    }

    return occupationCode; // Return code if occupation not found
  } catch (error) {
    console.error('Failed to get occupation name:', error);
    return occupationCode;
  }
}

/**
 * Get multiple occupation names at once
 */
export async function getOccupationNames(occupationCodes: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  try {
    // Fetch all occupations once
    const occupations = await fetchAllOccupations();
    const occupationMap = new Map(occupations.map((occ) => [occ.occupation_key, occ.english_name || occ.name || occ.occupation_key]));

    // Get cached data
    const cachedData = await AsyncStorage.getItem(OCCUPATIONS_CACHE_KEY);
    const cache: Record<string, OccupationCache> = cachedData ? JSON.parse(cachedData) : {};

    // Build result and update cache
    for (const code of occupationCodes) {
      const occupation = occupations.find((occ) => occ.occupation_key === code);
      if (occupation) {
        const occupationName = occupation.english_name || occupation.name || code;
        result[code] = occupationName;
        cache[code] = {
          code,
          name: occupationName,
          arabic_name: occupation.arabic_name,
          cached_at: Date.now(),
        };
      } else {
        result[code] = code;
      }
    }

    // Save updated cache
    await AsyncStorage.setItem(OCCUPATIONS_CACHE_KEY, JSON.stringify(cache));

    return result;
  } catch (error) {
    console.error('Failed to get occupation names:', error);
    // Return codes as fallback
    const fallback: Record<string, string> = {};
    occupationCodes.forEach((code) => {
      fallback[code] = code;
    });
    return fallback;
  }
}

/**
 * Update occupation cache for a specific code
 */
async function updateOccupationCache(code: string, name: string, arabicName: string): Promise<void> {
  try {
    const cachedData = await AsyncStorage.getItem(OCCUPATIONS_CACHE_KEY);
    const cache: Record<string, OccupationCache> = cachedData ? JSON.parse(cachedData) : {};

    cache[code] = {
      code,
      name,
      arabic_name: arabicName,
      cached_at: Date.now(),
    };

    await AsyncStorage.setItem(OCCUPATIONS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to update occupation cache:', error);
  }
}

/**
 * Clear occupation cache
 */
export async function clearOccupationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OCCUPATIONS_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear occupation cache:', error);
  }
}

/**
 * Preload all occupations into cache
 */
export async function preloadOccupations(): Promise<void> {
  try {
    const occupations = await fetchAllOccupations();
    const cache: Record<string, OccupationCache> = {};

    for (const occupation of occupations) {
      const occupationName = occupation.english_name || occupation.name || occupation.occupation_key;
      cache[occupation.occupation_key] = {
        code: occupation.occupation_key,
        name: occupationName,
        arabic_name: occupation.arabic_name,
        cached_at: Date.now(),
      };
    }

    await AsyncStorage.setItem(OCCUPATIONS_CACHE_KEY, JSON.stringify(cache));
    console.log(`Preloaded ${occupations.length} occupations into cache`);
  } catch (error) {
    console.error('Failed to preload occupations:', error);
  }
}
