import { EventEmitter } from 'events';
import { LaborResult } from './types';

export interface StatusChangeEvent {
  entryId: string;
  passportNumber: string;
  oldStatus: string;
  newStatus: string;
  result: LaborResult;
  timestamp: number;
}

class RealtimeSyncService extends EventEmitter {
  private static instance: RealtimeSyncService;
  private lastNotificationTime: Map<string, number> = new Map();
  private notificationThrottleMs = 1000; // Don't notify same entry more than once per second

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): RealtimeSyncService {
    if (!RealtimeSyncService.instance) {
      RealtimeSyncService.instance = new RealtimeSyncService();
    }
    return RealtimeSyncService.instance;
  }

  /**
   * Emit status change event with deduplication
   */
  emitStatusChange(event: StatusChangeEvent): boolean {
    const key = `${event.entryId}-${event.newStatus}`;
    const lastTime = this.lastNotificationTime.get(key) || 0;
    const now = Date.now();

    // Check if we should throttle this notification
    if (now - lastTime < this.notificationThrottleMs) {
      console.log(`[RealtimeSync] Throttled notification for ${key}`);
      return false;
    }

    this.lastNotificationTime.set(key, now);
    this.emit('statusChange', event);
    return true;
  }

  /**
   * Subscribe to status changes for a specific entry
   */
  onStatusChange(entryId: string, callback: (event: StatusChangeEvent) => void): () => void {
    const handler = (event: StatusChangeEvent) => {
      if (event.entryId === entryId) {
        callback(event);
      }
    };

    this.on('statusChange', handler);

    // Return unsubscribe function
    return () => {
      this.off('statusChange', handler);
    };
  }

  /**
   * Subscribe to all status changes
   */
  onAnyStatusChange(callback: (event: StatusChangeEvent) => void): () => void {
    this.on('statusChange', callback);
    return () => {
      this.off('statusChange', callback);
    };
  }

  /**
   * Clear throttle cache for testing
   */
  clearThrottle(): void {
    this.lastNotificationTime.clear();
  }

  /**
   * Set throttle duration
   */
  setThrottleMs(ms: number): void {
    this.notificationThrottleMs = ms;
  }
}

export const realtimeSync = RealtimeSyncService.getInstance();
