import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLaborResult } from './api';
import { sendTelegramNotification } from './telegram-service';

const BACKGROUND_POLLING_TASK = 'background-polling-task';
const POLLING_STATE_KEY = 'polling-state';

export interface PollingEntry {
  passportNumber: string;
  occupationKey: string;
  nationalityId: string;
  entryId: string;
  interval: number; // in seconds
  lastStatus?: string;
  lastCheckTime?: number;
}

export interface PollingState {
  entries: PollingEntry[];
  enabled: boolean;
}

/**
 * Register background polling task
 */
export async function registerBackgroundPollingTask(): Promise<void> {
  try {
    // Define the background task
    TaskManager.defineTask(BACKGROUND_POLLING_TASK, async () => {
      try {
        const state = await getPollingState();
        
        if (!state.enabled || state.entries.length === 0) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const now = Date.now();
        let hasChanges = false;

        for (const entry of state.entries) {
          const lastCheck = entry.lastCheckTime || 0;
          const intervalMs = entry.interval * 1000;

          // Check if it's time to poll this entry
          if (now - lastCheck >= intervalMs) {
            try {
              const result = await fetchLaborResult({
                passport_number: entry.passportNumber,
                occupation_key: entry.occupationKey,
                nationality_id: entry.nationalityId,
              });

              if (!result) {
                continue;
              }

              const currentStatus = result.exam_result;
              const previousStatus = entry.lastStatus;

              // Update last check time
              entry.lastCheckTime = now;

              // Check if status changed
              if (previousStatus && previousStatus !== currentStatus) {
                entry.lastStatus = currentStatus;
                hasChanges = true;

                // Send Telegram notification
                await sendTelegramNotification({
                  passportNumber: entry.passportNumber,
                  previousStatus: previousStatus,
                  newStatus: currentStatus,
                  testCenter: result.test_center_name || 'Unknown',
                  examDate: result.exam_date || 'Unknown',
                  timestamp: new Date().toLocaleString(),
                });
              } else if (!previousStatus) {
                // First check, store status
                entry.lastStatus = currentStatus;
              }
            } catch (error) {
              console.error(`Background polling error for ${entry.passportNumber}:`, error);
            }
          }
        }

        // Save updated state
        if (hasChanges) {
          await savePollingState(state);
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background polling task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_POLLING_TASK, {
      minimumInterval: 60, // Check every minute
      stopOnTerminate: false, // Continue after app termination
      startOnBoot: true, // Start on device boot
    });

    console.log('Background polling task registered');
  } catch (error) {
    console.error('Failed to register background polling task:', error);
  }
}

/**
 * Unregister background polling task
 */
export async function unregisterBackgroundPollingTask(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_POLLING_TASK);
    console.log('Background polling task unregistered');
  } catch (error) {
    console.error('Failed to unregister background polling task:', error);
  }
}

/**
 * Get current polling state
 */
export async function getPollingState(): Promise<PollingState> {
  try {
    const state = await AsyncStorage.getItem(POLLING_STATE_KEY);
    return state ? JSON.parse(state) : { entries: [], enabled: false };
  } catch (error) {
    console.error('Failed to get polling state:', error);
    return { entries: [], enabled: false };
  }
}

/**
 * Save polling state
 */
export async function savePollingState(state: PollingState): Promise<void> {
  try {
    await AsyncStorage.setItem(POLLING_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save polling state:', error);
  }
}

/**
 * Add entry to background polling
 */
export async function addToBackgroundPolling(
  passportNumber: string,
  occupationKey: string,
  nationalityId: string,
  entryId: string,
  interval: number = 60
): Promise<void> {
  const state = await getPollingState();
  
  // Check if entry already exists
  const exists = state.entries.some(e => e.entryId === entryId);
  if (!exists) {
    state.entries.push({
      passportNumber,
      occupationKey,
      nationalityId,
      entryId,
      interval,
      lastCheckTime: Date.now(),
    });
    state.enabled = true;
    await savePollingState(state);
  }
}

/**
 * Remove entry from background polling
 */
export async function removeFromBackgroundPolling(entryId: string): Promise<void> {
  const state = await getPollingState();
  state.entries = state.entries.filter(e => e.entryId !== entryId);
  
  if (state.entries.length === 0) {
    state.enabled = false;
  }
  
  await savePollingState(state);
}

/**
 * Update entry polling interval
 */
export async function updatePollingInterval(entryId: string, interval: number): Promise<void> {
  const state = await getPollingState();
  const entry = state.entries.find(e => e.entryId === entryId);
  
  if (entry) {
    entry.interval = interval;
    await savePollingState(state);
  }
}

/**
 * Enable/disable background polling
 */
export async function setBackgroundPollingEnabled(enabled: boolean): Promise<void> {
  const state = await getPollingState();
  state.enabled = enabled;
  await savePollingState(state);
}

/**
 * Check if background polling is enabled
 */
export async function isBackgroundPollingEnabled(): Promise<boolean> {
  const state = await getPollingState();
  return state.enabled;
}
