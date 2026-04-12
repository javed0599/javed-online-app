import AsyncStorage from '@react-native-async-storage/async-storage';
import { PassportEntry } from './types';

export interface QueuedCheck {
  id: string;
  entryId: string;
  passportNumber: string;
  occupationKey: string;
  nationalityId: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  nextRetryTime: number;
}

class OfflineQueueService {
  private static instance: OfflineQueueService;
  private readonly STORAGE_KEY = '@labor_checker_offline_queue';
  private queue: QueuedCheck[] = [];
  private isProcessing = false;
  private processCallbacks: Set<(queue: QueuedCheck[]) => void> = new Set();

  private constructor() {
    this.loadQueue();
  }

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
      this.emitQueueUpdate();
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Add check to queue
   */
  async addToQueue(entry: PassportEntry, maxRetries = 5): Promise<void> {
    const queuedCheck: QueuedCheck = {
      id: `${entry.id}-${Date.now()}`,
      entryId: entry.id,
      passportNumber: entry.passport_number,
      occupationKey: entry.occupation_key,
      nationalityId: entry.nationality_id,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      nextRetryTime: Date.now(),
    };

    this.queue.push(queuedCheck);
    await this.saveQueue();
    console.log(`[OfflineQueue] Added ${entry.passport_number} to queue`);
  }

  /**
   * Get all queued checks
   */
  getQueue(): QueuedCheck[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Remove check from queue
   */
  async removeFromQueue(id: string): Promise<void> {
    this.queue = this.queue.filter(item => item.id !== id);
    await this.saveQueue();
  }

  /**
   * Update retry count and next retry time
   */
  async updateRetry(id: string, retryCount: number, nextRetryTime: number): Promise<void> {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      item.retryCount = retryCount;
      item.nextRetryTime = nextRetryTime;
      await this.saveQueue();
    }
  }

  /**
   * Get items ready for retry
   */
  getReadyForRetry(): QueuedCheck[] {
    const now = Date.now();
    return this.queue.filter(item => item.nextRetryTime <= now && item.retryCount < item.maxRetries);
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.emitQueueUpdate();
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * Subscribe to queue updates
   */
  onQueueUpdate(callback: (queue: QueuedCheck[]) => void): () => void {
    this.processCallbacks.add(callback);
    return () => {
      this.processCallbacks.delete(callback);
    };
  }

  /**
   * Emit queue update to subscribers
   */
  private emitQueueUpdate(): void {
    this.processCallbacks.forEach(callback => callback([...this.queue]));
  }

  /**
   * Check if queue is processing
   */
  isProcessingQueue(): boolean {
    return this.isProcessing;
  }

  /**
   * Set processing state
   */
  setProcessing(state: boolean): void {
    this.isProcessing = state;
  }
}

export const offlineQueue = OfflineQueueService.getInstance();
