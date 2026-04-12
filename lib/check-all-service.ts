import { fetchLaborResult } from './api';
import { sendTelegramNotification } from './telegram-service';
import { PassportEntry } from './types';

export interface CheckAllResult {
  totalEntries: number;
  checkedEntries: number;
  statusChanges: number;
  errors: number;
  timestamp: string;
}

/**
 * Check all entries for status updates
 */
export async function checkAllEntries(
  entries: PassportEntry[],
  onProgress?: (current: number, total: number) => void
): Promise<CheckAllResult> {
  const result: CheckAllResult = {
    totalEntries: entries.length,
    checkedEntries: 0,
    statusChanges: 0,
    errors: 0,
    timestamp: new Date().toLocaleString(),
  };

  if (entries.length === 0) {
    return result;
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    try {
      const laborResult = await fetchLaborResult({
        passport_number: entry.passport_number,
        occupation_key: entry.occupation_key,
        nationality_id: entry.nationality_id,
      });

      if (laborResult) {
        result.checkedEntries++;

        // Check if status changed
        const currentStatus = laborResult.exam_result;
        const previousStatus = entry.latest_result?.exam_result;

        if (previousStatus && previousStatus !== currentStatus) {
          result.statusChanges++;

          // Send Telegram notification
          await sendTelegramNotification({
            passportNumber: entry.passport_number,
            previousStatus: previousStatus,
            newStatus: currentStatus,
            testCenter: laborResult.test_center_name || 'Unknown',
            examDate: laborResult.exam_date || 'Unknown',
            timestamp: new Date().toLocaleString(),
          });
        }
      }
    } catch (error) {
      console.error(`Error checking entry ${entry.passport_number}:`, error);
      result.errors++;
    }

    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, entries.length);
    }
  }

  return result;
}

/**
 * Check single entry for status update
 */
export async function checkSingleEntry(entry: PassportEntry): Promise<boolean> {
  try {
    const laborResult = await fetchLaborResult({
      passport_number: entry.passport_number,
      occupation_key: entry.occupation_key,
      nationality_id: entry.nationality_id,
    });

    if (laborResult) {
      const currentStatus = laborResult.exam_result;
      const previousStatus = entry.latest_result?.exam_result;

      // Check if status changed
      if (previousStatus && previousStatus !== currentStatus) {
        // Send Telegram notification
        await sendTelegramNotification({
          passportNumber: entry.passport_number,
          previousStatus: previousStatus,
          newStatus: currentStatus,
          testCenter: laborResult.test_center_name || 'Unknown',
          examDate: laborResult.exam_date || 'Unknown',
          timestamp: new Date().toLocaleString(),
        });

        return true; // Status changed
      }
    }

    return false; // No change or error
  } catch (error) {
    console.error(`Error checking entry ${entry.passport_number}:`, error);
    return false;
  }
}
