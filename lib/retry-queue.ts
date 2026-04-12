import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiParams } from './types';

export interface RetryItem {
  id: string;
  entryId: string;
  params: ApiParams;
  timestamp: string;
  attempts: number;
  maxAttempts: number;
  nextRetryTime: string;
  error?: string;
}

const RETRY_QUEUE_KEY = 'retry_queue';
const MAX_ATTEMPTS = 5;
const INITIAL_DELAY_MS = 5000; // 5 seconds

/**
 * Add item to retry queue
 */
export async function addToRetryQueue(
  entryId: string,
  params: ApiParams,
  maxAttempts: number = MAX_ATTEMPTS
): Promise<RetryItem> {
  try {
    const queue = await getRetryQueue();
    const id = `${entryId}_${Date.now()}`;
    const item: RetryItem = {
      id,
      entryId,
      params,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts,
      nextRetryTime: new Date().toISOString(),
    };

    queue.push(item);
    await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
    console.log(`🔄 [RetryQueue] Added item ${id} to queue`);
    return item;
  } catch (error) {
    console.error('Failed to add to retry queue:', error);
    throw error;
  }
}

/**
 * Get all items in retry queue
 */
export async function getRetryQueue(): Promise<RetryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get retry queue:', error);
    return [];
  }
}

/**
 * Get items ready for retry (nextRetryTime has passed)
 */
export async function getReadyForRetry(): Promise<RetryItem[]> {
  try {
    const queue = await getRetryQueue();
    const now = new Date();
    return queue.filter((item) => {
      const nextRetry = new Date(item.nextRetryTime);
      return now >= nextRetry && item.attempts < item.maxAttempts;
    });
  } catch (error) {
    console.error('Failed to get ready for retry:', error);
    return [];
  }
}

/**
 * Update retry item after attempt
 */
export async function updateRetryItem(
  itemId: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const queue = await getRetryQueue();
    const item = queue.find((i) => i.id === itemId);

    if (!item) {
      console.warn(`Item ${itemId} not found in queue`);
      return;
    }

    if (success) {
      // Remove from queue
      const updatedQueue = queue.filter((i) => i.id !== itemId);
      await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log(`🔄 [RetryQueue] Item ${itemId} succeeded, removed from queue`);
    } else {
      // Update attempt count and calculate next retry time
      item.attempts += 1;
      item.error = error;

      if (item.attempts < item.maxAttempts) {
        // Exponential backoff: 5s, 10s, 20s, 40s, 80s
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, item.attempts - 1);
        item.nextRetryTime = new Date(Date.now() + delayMs).toISOString();
        console.log(
          `🔄 [RetryQueue] Item ${itemId} failed (attempt ${item.attempts}/${item.maxAttempts}), retry in ${delayMs}ms`
        );
      } else {
        console.log(`🔄 [RetryQueue] Item ${itemId} max attempts reached, giving up`);
      }

      await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('Failed to update retry item:', error);
  }
}

/**
 * Remove item from queue
 */
export async function removeFromRetryQueue(itemId: string): Promise<void> {
  try {
    const queue = await getRetryQueue();
    const updatedQueue = queue.filter((i) => i.id !== itemId);
    await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(updatedQueue));
    console.log(`🔄 [RetryQueue] Removed item ${itemId} from queue`);
  } catch (error) {
    console.error('Failed to remove from retry queue:', error);
  }
}

/**
 * Clear entire retry queue
 */
export async function clearRetryQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RETRY_QUEUE_KEY);
    console.log('🔄 [RetryQueue] Cleared entire queue');
  } catch (error) {
    console.error('Failed to clear retry queue:', error);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  readyForRetry: number;
  totalAttempts: number;
  oldestItem?: RetryItem;
}> {
  try {
    const queue = await getRetryQueue();
    const ready = await getReadyForRetry();
    const totalAttempts = queue.reduce((sum, item) => sum + item.attempts, 0);
    const oldestItem = queue.length > 0 ? queue[0] : undefined;

    return {
      total: queue.length,
      readyForRetry: ready.length,
      totalAttempts,
      oldestItem,
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return { total: 0, readyForRetry: 0, totalAttempts: 0 };
  }
}
