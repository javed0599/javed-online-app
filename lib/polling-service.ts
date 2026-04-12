import { LaborResult, ApiParams } from "./types";
import { fetchLaborResult } from "./api";

export interface PollingConfig {
  entryId: string;
  passportNumber: string;
  occupationKey: string;
  nationalityId: string;
  intervalMs: number; // Polling interval in milliseconds
  maxRetries: number; // Max retries on failure
  onSuccess: (result: LaborResult) => void; // Callback on successful fetch
  onError: (error: Error) => void; // Callback on error
  onStatusChange?: (status: "polling" | "idle" | "error") => void; // Status callback
}

interface PollingState {
  isPolling: boolean;
  timeoutId: ReturnType<typeof setTimeout> | null;
  retryCount: number;
  lastFetchTime: number | null;
  lastError: Error | null;
  config?: PollingConfig;
}

const pollingStates = new Map<string, PollingState>();

/**
 * Start polling for labor result updates
 */
export function startPolling(config: PollingConfig): void {
  const { entryId } = config;

  // Stop existing polling for this entry
  stopPolling(entryId);

  const state: PollingState = {
    isPolling: true,
    timeoutId: null,
    retryCount: 0,
    lastFetchTime: null,
    lastError: null,
  };

  state.config = config;
  pollingStates.set(entryId, state);

  // Start the polling loop immediately (no delay for first check)
  pollOnce(config, state);
}

/**
 * Stop polling for a specific entry
 */
export function stopPolling(entryId: string): void {
  const state = pollingStates.get(entryId);
  if (state && state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.isPolling = false;
    state.timeoutId = null;
    pollingStates.delete(entryId);
  }
}

/**
 * Stop all polling
 */
export function stopAllPolling(): void {
  pollingStates.forEach((state) => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }
  });
  pollingStates.clear();
}

/**
 * Get polling status for an entry
 */
export function getPollingStatus(entryId: string): PollingState | undefined {
  return pollingStates.get(entryId);
}

/**
 * Single polling iteration
 */
async function pollOnce(config: PollingConfig, state: PollingState): Promise<void> {
  if (!state.isPolling) return;

  config.onStatusChange?.("polling");
  const fetchStartTime = Date.now();

  try {
    // Fetch data from API
    const params: ApiParams = {
      passport_number: config.passportNumber,
      occupation_key: config.occupationKey,
      nationality_id: config.nationalityId,
      locale: "en",
    };

    const result = await fetchLaborResult(params);

    if (!result) {
      throw new Error("No data returned from API");
    }

    // Reset retry count on success
    state.retryCount = 0;
    state.lastFetchTime = Date.now();
    state.lastError = null;

    // Call success callback
    config.onSuccess(result);

    // Calculate actual delay: ensure we wait the full interval from fetch start
    const fetchDuration = Date.now() - fetchStartTime;
    const nextPollDelay = Math.max(0, config.intervalMs - fetchDuration);

    // Schedule next poll with normal interval
    scheduleNextPoll(config, state, nextPollDelay);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    state.lastError = err;

    // Increment retry count
    state.retryCount += 1;

    if (state.retryCount >= config.maxRetries) {
      // Max retries reached, stop polling and notify error
      config.onStatusChange?.("error");
      config.onError(new Error(`Polling failed after ${config.maxRetries} retries: ${err.message}`));
      state.isPolling = false;
      pollingStates.delete(config.entryId);
    } else {
      // Use shorter retry intervals: 2s, 4s, 8s, 16s (max 30s)
      const backoffMs = Math.min(2000 * Math.pow(2, state.retryCount - 1), 30000);
      console.warn(
        `Polling error for ${config.passportNumber} (retry ${state.retryCount}/${config.maxRetries}). Retrying in ${backoffMs}ms:`,
        err.message
      );

      // Schedule retry with exponential backoff
      scheduleNextPoll(config, state, backoffMs);
    }
  }
}

/**
 * Schedule the next polling iteration
 */
function scheduleNextPoll(config: PollingConfig, state: PollingState, delayMs: number): void {
  if (!state.isPolling) return;

  state.timeoutId = setTimeout(() => {
    pollOnce(config, state);
  }, delayMs) as ReturnType<typeof setTimeout>;
}

/**
 * Get all active polling entries
 */
export function getActivePollingEntries(): string[] {
  return Array.from(pollingStates.keys()).filter((entryId) => {
    const state = pollingStates.get(entryId);
    return state?.isPolling;
  });
}

/**
 * Get polling statistics
 */
export function getPollingStats(entryId: string) {
  const state = pollingStates.get(entryId);
  if (!state) return null;

  return {
    isPolling: state.isPolling,
    retryCount: state.retryCount,
    lastFetchTime: state.lastFetchTime,
    lastError: state.lastError?.message,
    timeSinceLastFetch: state.lastFetchTime ? Date.now() - state.lastFetchTime : null,
  };
}
