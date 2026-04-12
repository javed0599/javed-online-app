import { PassportEntry, CheckHistory } from './types';

export interface AnalyticsStats {
  totalEntries: number;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  passRate: number;
  averageWaitTime: number;
  mostRecentCheck: number | null;
  oldestEntry: number | null;
  checkFrequency: number;
}

export interface EntryAnalytics {
  entryId: string;
  passportNumber: string;
  totalChecks: number;
  statusChanges: number;
  currentStatus: string;
  firstChecked: number | null;
  lastChecked: number | null;
  daysSincePending: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Calculate overall app statistics
   */
  calculateStats(entries: PassportEntry[]): AnalyticsStats {
    let totalChecks = 0;
    let passedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let totalWaitTime = 0;
    let checkCount = 0;
    let mostRecentCheck: number | null = null;
    let oldestEntry: number | null = null;

    for (const entry of entries) {
      if (entry.latest_result) {
        if (entry.latest_result.exam_result === 'passed') passedCount++;
        else if (entry.latest_result.exam_result === 'failed') failedCount++;
        else if (entry.latest_result.exam_result === 'pending') pendingCount++;
      }

      totalChecks += entry.check_count || 0;

      if (entry.check_history && entry.check_history.length > 0) {
        for (const check of entry.check_history) {
          totalWaitTime += check.timestamp;
          checkCount++;

          if (!mostRecentCheck || check.timestamp > mostRecentCheck) {
            mostRecentCheck = check.timestamp;
          }
        }
      }

      if (!oldestEntry || entry.created_at < oldestEntry) {
        oldestEntry = entry.created_at;
      }
    }

    const totalResults = passedCount + failedCount + pendingCount;
    const passRate = totalResults > 0 ? (passedCount / totalResults) * 100 : 0;
    const averageWaitTime = checkCount > 0 ? totalWaitTime / checkCount : 0;
    const checkFrequency = entries.length > 0 ? totalChecks / entries.length : 0;

    return {
      totalEntries: entries.length,
      totalChecks,
      passedCount,
      failedCount,
      pendingCount,
      passRate: Math.round(passRate * 10) / 10,
      averageWaitTime: Math.round(averageWaitTime),
      mostRecentCheck,
      oldestEntry,
      checkFrequency: Math.round(checkFrequency * 10) / 10,
    };
  }

  /**
   * Calculate analytics for a single entry
   */
  calculateEntryAnalytics(entry: PassportEntry): EntryAnalytics {
    let statusChanges = 0;
    let previousStatus = entry.latest_result?.exam_result || 'unknown';

    if (entry.check_history) {
      for (const check of entry.check_history) {
        if (check.status !== previousStatus) {
          statusChanges++;
          previousStatus = check.status;
        }
      }
    }

    const firstChecked = entry.check_history && entry.check_history.length > 0
      ? entry.check_history[0].timestamp
      : null;

    const lastChecked = entry.last_checked_at || null;

    const daysSincePending = entry.latest_result?.exam_result === 'pending' && lastChecked
      ? Math.floor((Date.now() - lastChecked) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      entryId: entry.id,
      passportNumber: entry.passport_number,
      totalChecks: entry.check_count || 0,
      statusChanges,
      currentStatus: entry.latest_result?.exam_result || 'unknown',
      firstChecked,
      lastChecked,
      daysSincePending,
    };
  }

  /**
   * Get check frequency trend
   */
  getCheckFrequencyTrend(entry: PassportEntry): { date: string; count: number }[] {
    const trend: { [key: string]: number } = {};

    if (entry.check_history) {
      for (const check of entry.check_history) {
        const date = new Date(check.timestamp).toLocaleDateString();
        trend[date] = (trend[date] || 0) + 1;
      }
    }

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get status change timeline
   */
  getStatusTimeline(entry: PassportEntry): { timestamp: number; status: string }[] {
    const timeline: { timestamp: number; status: string }[] = [];
    let previousStatus = 'unknown';

    if (entry.check_history) {
      for (const check of entry.check_history) {
        if (check.status !== previousStatus) {
          timeline.push({
            timestamp: check.timestamp,
            status: check.status,
          });
          previousStatus = check.status;
        }
      }
    }

    return timeline.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Calculate average time between checks
   */
  getAverageCheckInterval(entry: PassportEntry): number {
    if (!entry.check_history || entry.check_history.length < 2) {
      return 0;
    }

    let totalInterval = 0;
    for (let i = 1; i < entry.check_history.length; i++) {
      const interval = entry.check_history[i].timestamp - entry.check_history[i - 1].timestamp;
      totalInterval += interval;
    }

    return Math.round(totalInterval / (entry.check_history.length - 1));
  }

  /**
   * Get entries sorted by wait time (pending longest)
   */
  getEntriesByWaitTime(entries: PassportEntry[]): PassportEntry[] {
    return [...entries].sort((a, b) => {
      const aTime = a.last_checked_at || a.created_at;
      const bTime = b.last_checked_at || b.created_at;
      return bTime - aTime;
    });
  }

  /**
   * Get success rate for a specific entry
   */
  getEntrySuccessRate(entry: PassportEntry): number {
    if (!entry.check_history || entry.check_history.length === 0) {
      return 0;
    }

    const passedChecks = entry.check_history.filter(c => c.status === 'passed').length;
    return Math.round((passedChecks / entry.check_history.length) * 100);
  }
}

export const analyticsService = AnalyticsService.getInstance();
