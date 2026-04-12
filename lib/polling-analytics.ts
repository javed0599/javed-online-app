import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PollingStatistic {
  entryId: string;
  passportNumber: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number; // in milliseconds
  lastCheckTime: number | null;
  firstCheckTime: number | null;
  statusChanges: number;
  peakCheckHour: number | null; // 0-23
  checkTimes: number[]; // timestamps of all checks
}

export interface PollingAnalytics {
  [entryId: string]: PollingStatistic;
}

const ANALYTICS_STORAGE_KEY = "polling_analytics";

class PollingAnalyticsService {
  private analytics: PollingAnalytics = {};

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        this.analytics = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  }

  async recordCheck(
    entryId: string,
    passportNumber: string,
    success: boolean,
    responseTime: number
  ) {
    if (!this.analytics[entryId]) {
      this.analytics[entryId] = {
        entryId,
        passportNumber,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        lastCheckTime: null,
        firstCheckTime: null,
        statusChanges: 0,
        peakCheckHour: null,
        checkTimes: [],
      };
    }

    const stat = this.analytics[entryId];
    const now = Date.now();

    stat.totalChecks += 1;
    if (success) {
      stat.successfulChecks += 1;
    } else {
      stat.failedChecks += 1;
    }

    // Calculate average response time
    const totalResponseTime = stat.averageResponseTime * (stat.totalChecks - 1) + responseTime;
    stat.averageResponseTime = totalResponseTime / stat.totalChecks;

    stat.lastCheckTime = now;
    if (!stat.firstCheckTime) {
      stat.firstCheckTime = now;
    }

    stat.checkTimes.push(now);

    // Calculate peak check hour
    const hour = new Date(now).getHours();
    const hourCounts: Record<number, number> = {};
    stat.checkTimes.forEach((time) => {
      const h = new Date(time).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    let maxCount = 0;
    let peakHour = null;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(h);
      }
    });
    stat.peakCheckHour = peakHour;

    // Keep only last 1000 check times to avoid memory issues
    if (stat.checkTimes.length > 1000) {
      stat.checkTimes = stat.checkTimes.slice(-1000);
    }

    await this.save();
  }

  recordStatusChange(entryId: string) {
    if (this.analytics[entryId]) {
      this.analytics[entryId].statusChanges += 1;
    }
  }

  getStatistics(entryId: string): PollingStatistic | null {
    return this.analytics[entryId] || null;
  }

  getAllStatistics(): PollingAnalytics {
    return { ...this.analytics };
  }

  getSuccessRate(entryId: string): number {
    const stat = this.analytics[entryId];
    if (!stat || stat.totalChecks === 0) return 0;
    return (stat.successfulChecks / stat.totalChecks) * 100;
  }

  getAverageResponseTime(entryId: string): number {
    const stat = this.analytics[entryId];
    return stat?.averageResponseTime || 0;
  }

  getChecksByDateRange(entryId: string, startDate: Date, endDate: Date): number {
    const stat = this.analytics[entryId];
    if (!stat) return 0;

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return stat.checkTimes.filter((time) => time >= startTime && time <= endTime).length;
  }

  getChecksByHour(entryId: string, hour: number): number {
    const stat = this.analytics[entryId];
    if (!stat) return 0;

    return stat.checkTimes.filter((time) => {
      const h = new Date(time).getHours();
      return h === hour;
    }).length;
  }

  getHourlyDistribution(entryId: string): Record<number, number> {
    const stat = this.analytics[entryId];
    if (!stat) return {};

    const distribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }

    stat.checkTimes.forEach((time) => {
      const hour = new Date(time).getHours();
      distribution[hour] += 1;
    });

    return distribution;
  }

  clearAnalytics(entryId: string) {
    delete this.analytics[entryId];
    return this.save();
  }

  clearAllAnalytics() {
    this.analytics = {};
    return this.save();
  }

  private async save() {
    try {
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.analytics));
    } catch (error) {
      console.error("Failed to save analytics:", error);
    }
  }
}

export const pollingAnalytics = new PollingAnalyticsService();
