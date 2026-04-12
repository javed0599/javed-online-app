import { fetchLaborResult } from './api';
import { PassportEntry } from './types';
import { realtimeSync } from './realtime-sync';

export interface BatchCheckProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentPassport?: string;
  status: 'idle' | 'checking' | 'completed' | 'error';
}

export interface BatchCheckResult {
  entryId: string;
  passportNumber: string;
  success: boolean;
  result?: any;
  error?: string;
}

class BatchCheckService {
  private static instance: BatchCheckService;
  private progress: BatchCheckProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    status: 'idle',
  };
  private progressCallbacks: Set<(progress: BatchCheckProgress) => void> = new Set();
  private isChecking = false;

  private constructor() {}

  static getInstance(): BatchCheckService {
    if (!BatchCheckService.instance) {
      BatchCheckService.instance = new BatchCheckService();
    }
    return BatchCheckService.instance;
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (progress: BatchCheckProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Emit progress update to all subscribers
   */
  private emitProgress(): void {
    this.progressCallbacks.forEach(callback => callback(this.progress));
  }

  /**
   * Get current progress
   */
  getProgress(): BatchCheckProgress {
    return { ...this.progress };
  }

  /**
   * Check multiple entries in batch
   */
  async checkBatch(entries: PassportEntry[]): Promise<BatchCheckResult[]> {
    if (this.isChecking) {
      console.warn('[BatchCheck] Already checking, ignoring new batch request');
      return [];
    }

    this.isChecking = true;
    this.progress = {
      total: entries.length,
      completed: 0,
      failed: 0,
      percentage: 0,
      status: 'checking',
    };
    this.emitProgress();

    const results: BatchCheckResult[] = [];

    for (const entry of entries) {
      try {
        this.progress.currentPassport = entry.passport_number;
        this.emitProgress();

        const result = await fetchLaborResult({
          passport_number: entry.passport_number,
          occupation_key: entry.occupation_key,
          nationality_id: entry.nationality_id,
        });

        results.push({
          entryId: entry.id,
          passportNumber: entry.passport_number,
          success: true,
          result,
        });

        // Emit status change event for real-time sync
        if (result && entry.latest_result?.exam_result !== result.exam_result) {
          realtimeSync.emitStatusChange({
            entryId: entry.id,
            passportNumber: entry.passport_number,
            oldStatus: entry.latest_result?.exam_result || 'unknown',
            newStatus: result.exam_result,
            result,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        results.push({
          entryId: entry.id,
          passportNumber: entry.passport_number,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.progress.failed++;
      }

      this.progress.completed++;
      this.progress.percentage = Math.round((this.progress.completed / this.progress.total) * 100);
      this.emitProgress();
    }

    this.progress.status = 'completed';
    this.emitProgress();
    this.isChecking = false;

    return results;
  }

  /**
   * Cancel ongoing batch check
   */
  cancel(): void {
    this.isChecking = false;
    this.progress.status = 'idle';
    this.emitProgress();
  }
}

export const batchCheckService = BatchCheckService.getInstance();
