import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import { fetchLaborResult } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PassportEntry, LaborResult } from "./types";
import { addNotificationLog } from "./notification-history";

const BACKGROUND_CHECK_TASK = "labor-result-background-check";
const BACKGROUND_ENTRIES_KEY = "labor_checker_background_entries";
const LAST_CHECK_TIMES_KEY = "labor_checker_last_check_times";

/**
 * Configure notification handler
 */
export async function configureNotifications() {
  await Notifications.setNotificationHandler({
    handleNotification: async () => {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any;
    },
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Register background task for checking labor results
 */
export async function registerBackgroundTask() {
  try {
    // Define the background task
    TaskManager.defineTask(BACKGROUND_CHECK_TASK, async () => {
      try {
        const entriesJson = await AsyncStorage.getItem(BACKGROUND_ENTRIES_KEY);
        if (!entriesJson) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const entries: Array<PassportEntry & { checkInterval?: number; notificationsEnabled?: boolean }> = JSON.parse(
          entriesJson
        );
        const lastCheckTimes = await getLastCheckTimes();
        const now = Date.now();
        let hasChanges = false;

        for (const entry of entries) {
          // Skip if background check is disabled
          if (!entry.notificationsEnabled) continue;

          const lastCheck = lastCheckTimes[entry.id] || 0;
          const interval = (entry.checkInterval || 30) * 60 * 1000; // default 30 minutes

          // Check if enough time has passed
          if (now - lastCheck < interval) continue;

          try {
            const result = await fetchLaborResult({
              passport_number: entry.passport_number,
              occupation_key: entry.occupation_key,
              nationality_id: entry.nationality_id,
            });

            if (result) {
              const previousStatus = entry.latest_result?.exam_result;
              const currentStatus = result.exam_result;

              // Send notification if status changed
              if (previousStatus && previousStatus !== currentStatus) {
                await sendStatusChangeNotification(entry, previousStatus, currentStatus);
                // Log the notification
                await addNotificationLog(
                  entry.passport_number,
                  entry.id,
                  previousStatus as "passed" | "failed" | "pending",
                  currentStatus as "passed" | "failed" | "pending",
                  result.test_center_name,
                  result.exam_date
                );
                hasChanges = true;
              }

              // Update last check time
              lastCheckTimes[entry.id] = now;
            }
          } catch (error) {
            console.error(`Error checking status for ${entry.passport_number}:`, error);
          }
        }

        // Save updated last check times
        await AsyncStorage.setItem(LAST_CHECK_TIMES_KEY, JSON.stringify(lastCheckTimes));

        return hasChanges
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.error("Background task error:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_CHECK_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("Background task registered successfully");
  } catch (error) {
    console.error("Failed to register background task:", error);
  }
}

/**
 * Unregister background task
 */
export async function unregisterBackgroundTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_CHECK_TASK);
    console.log("Background task unregistered");
  } catch (error) {
    console.error("Failed to unregister background task:", error);
  }
}

/**
 * Send notification when status changes
 */
async function sendStatusChangeNotification(
  entry: PassportEntry,
  previousStatus: string,
  currentStatus: string
) {
  const statusLabel = currentStatus === "passed" ? "Passed" : currentStatus === "failed" ? "Failed" : "Pending";
  const previousLabel =
    previousStatus === "passed" ? "Passed" : previousStatus === "failed" ? "Failed" : "Pending";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Labor Result Updated",
      body: `${entry.passport_number}: Status changed from ${previousLabel} to ${statusLabel}`,
      data: {
        entryId: entry.id,
        passportNumber: entry.passport_number,
        newStatus: currentStatus,
      },
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get last check times for all entries
 */
async function getLastCheckTimes(): Promise<Record<string, number>> {
  try {
    const data = await AsyncStorage.getItem(LAST_CHECK_TIMES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Update background entries list
 */
export async function updateBackgroundEntries(entries: PassportEntry[]) {
  try {
    await AsyncStorage.setItem(BACKGROUND_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Failed to update background entries:", error);
  }
}

/**
 * Get check interval for an entry
 */
export async function getCheckInterval(entryId: string): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(`check_interval_${entryId}`);
    return data ? parseInt(data, 10) : 30; // default 30 minutes
  } catch {
    return 30;
  }
}

/**
 * Set check interval for an entry
 */
export async function setCheckInterval(entryId: string, minutes: number) {
  try {
    await AsyncStorage.setItem(`check_interval_${entryId}`, minutes.toString());
  } catch (error) {
    console.error("Failed to set check interval:", error);
  }
}

/**
 * Check if notifications are enabled for an entry
 */
export async function isNotificationsEnabled(entryId: string): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(`notifications_enabled_${entryId}`);
    return data ? JSON.parse(data) : false;
  } catch {
    return false;
  }
}

/**
 * Set notifications enabled for an entry
 */
export async function setNotificationsEnabled(entryId: string, enabled: boolean) {
  try {
    await AsyncStorage.setItem(`notifications_enabled_${entryId}`, JSON.stringify(enabled));
  } catch (error) {
    console.error("Failed to set notifications enabled:", error);
  }
}
