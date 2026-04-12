import { offlineQueue, QueuedCheck } from './offline-queue';
import { fetchLaborResult } from './api';
import { realtimeSync } from './realtime-sync';
import { apiResilience } from './api-resilience';
import { PassportEntry } from './types';

export interface ProcessorConfig {
  intervalMs: number;
  maxConcurrent: number;
  maxRetries: number;
}

class BackgroundTaskProcessor {
  private static instance: BackgroundTaskProcessor;
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private config: ProcessorConfig;
  private processCallbacks: Set<(status: string) => void> = new Set();

  private constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = {
      intervalMs: config.intervalMs || 5 * 60 * 1000, // 5 minutes default
      maxConcurrent: config.maxConcurrent || 3,
      maxRetries: config.maxRetries || 5,
    };
  }

  static getInstance(): BackgroundTaskProcessor {
    if (!BackgroundTaskProcessor.instance) {
      BackgroundTaskProcessor.instance = new BackgroundTaskProcessor();
    }
    return BackgroundTaskProcessor.instance;
  }

  /**
   * Start background task processor
   */
  start(): void {
    if (this.isRunning) {
      console.log('[BackgroundProcessor] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[BackgroundProcessor] Started with interval:', this.config.intervalMs);
    this.emitStatus('started');

    // Process immediately
    this.processQueue();

    // Then set interval
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, this.config.intervalMs);
  }

  /**
   * Stop background task processor
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[BackgroundProcessor] Not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[BackgroundProcessor] Stopped');
    this.emitStatus('stopped');
  }

  /**
   * Check if processor is running
   */
  isProcessing(): boolean {
    return this.isRunning;
  }

  /**
   * Process offline queue
   */
  private async processQueue(): Promise<void> {
    try {
      offlineQueue.setProcessing(true);
      this.emitStatus('processing');

      const readyItems = offlineQueue.getReadyForRetry();
      if (readyItems.length === 0) {
        console.log('[BackgroundProcessor] No items to process');
        offlineQueue.setProcessing(false);
        this.emitStatus('idle');
        return;
      }

      console.log(`[BackgroundProcessor] Processing ${readyItems.length} items`);

      // Process items with concurrency limit
      const chunks = this.chunkArray(readyItems, this.config.maxConcurrent);

      for (const chunk of chunks) {
        await Promise.all(chunk.map(item => this.processItem(item)));
      }

      offlineQueue.setProcessing(false);
      this.emitStatus('idle');
    } catch (error) {
      console.error('[BackgroundProcessor] Error processing queue:', error);
      offlineQueue.setProcessing(false);
      this.emitStatus('error');
    }
  }

  /**
   * Process a single queued item
   */
  private async processItem(item: QueuedCheck): Promise<void> {
    try {
      console.log(`[BackgroundProcessor] Processing ${item.passportNumber}`);

      const result = await apiResilience.execute(
        () =>
          fetchLaborResult({
            passport_number: item.passportNumber,
            occupation_key: item.occupationKey,
            nationality_id: item.nationalityId,
          }),
        (retryCount, delay) => {
          console.log(`[BackgroundProcessor] Retry ${retryCount} after ${delay}ms`);
        }
      );

      // Successfully processed
      await offlineQueue.removeFromQueue(item.id);
      console.log(`[BackgroundProcessor] Successfully processed ${item.passportNumber}`);

      // Emit status change event for real-time sync
      if (result) {
        realtimeSync.emitStatusChange({
          entryId: item.entryId,
          passportNumber: item.passportNumber,
          oldStatus: 'unknown',
          newStatus: result.exam_result,
          result,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      // Update retry count and next retry time
      const nextRetryTime = Date.now() + this.calculateBackoffDelay(item.retryCount);
      await offlineQueue.updateRetry(item.id, item.retryCount + 1, nextRetryTime);

      console.error(
        `[BackgroundProcessor] Failed to process ${item.passportNumber}:`,
        error instanceof Error ? error.message : String(error)
      );

      // If max retries exceeded, remove from queue
      if (item.retryCount >= item.maxRetries) {
        await offlineQueue.removeFromQueue(item.id);
        console.log(`[BackgroundProcessor] Max retries exceeded for ${item.passportNumber}`);
      }
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = 2000; // 2 seconds
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    // Add jitter
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.max(0, delay + jitter);
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Subscribe to processor status
   */
  onStatusChange(callback: (status: string) => void): () => void {
    this.processCallbacks.add(callback);
    return () => {
      this.processCallbacks.delete(callback);
    };
  }

  /**
   * Emit status update
   */
  private emitStatus(status: string): void {
    this.processCallbacks.forEach(callback => callback(status));
  }

  /**
   * Set processor interval
   */
  setInterval(intervalMs: number): void {
    this.config.intervalMs = intervalMs;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Force process queue immediately
   */
  async forceProcess(): Promise<void> {
    await this.processQueue();
  }
}

export const backgroundTaskProcessor = BackgroundTaskProcessor.getInstance();
