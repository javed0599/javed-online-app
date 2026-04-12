import { PassportEntry } from "./types";

export interface BatchPollingOperation {
  action: "start" | "stop" | "changeInterval";
  entryIds: string[];
  intervalMs?: number;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: { entryId: string; error: string }[];
}

class BatchPollingControlService {
  private selectedEntries: Set<string> = new Set();

  /**
   * Toggle entry selection
   */
  toggleEntrySelection(entryId: string) {
    if (this.selectedEntries.has(entryId)) {
      this.selectedEntries.delete(entryId);
    } else {
      this.selectedEntries.add(entryId);
    }
  }

  /**
   * Select all entries
   */
  selectAll(entries: PassportEntry[]) {
    this.selectedEntries.clear();
    entries.forEach((entry) => {
      this.selectedEntries.add(entry.id);
    });
  }

  /**
   * Deselect all entries
   */
  deselectAll() {
    this.selectedEntries.clear();
  }

  /**
   * Check if entry is selected
   */
  isSelected(entryId: string): boolean {
    return this.selectedEntries.has(entryId);
  }

  /**
   * Get all selected entry IDs
   */
  getSelectedEntries(): string[] {
    return Array.from(this.selectedEntries);
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selectedEntries.size;
  }

  /**
   * Check if any entries are selected
   */
  hasSelection(): boolean {
    return this.selectedEntries.size > 0;
  }

  /**
   * Validate batch operation
   */
  validateBatchOperation(operation: BatchPollingOperation): { valid: boolean; error?: string } {
    if (!operation.entryIds || operation.entryIds.length === 0) {
      return { valid: false, error: "No entries selected" };
    }

    if (operation.action === "changeInterval") {
      if (!operation.intervalMs || operation.intervalMs <= 0) {
        return { valid: false, error: "Invalid interval" };
      }
    }

    return { valid: true };
  }

  /**
   * Simulate batch operation (returns mock result)
   */
  async executeBatchOperation(
    operation: BatchPollingOperation
  ): Promise<BatchOperationResult> {
    const validation = this.validateBatchOperation(operation);
    if (!validation.valid) {
      return {
        success: 0,
        failed: operation.entryIds.length,
        errors: operation.entryIds.map((id) => ({
          entryId: id,
          error: validation.error || "Unknown error",
        })),
      };
    }

    // Simulate operation execution
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    operation.entryIds.forEach((entryId) => {
      try {
        // Simulate 95% success rate
        if (Math.random() < 0.95) {
          result.success += 1;
        } else {
          result.failed += 1;
          result.errors.push({
            entryId,
            error: "Operation failed",
          });
        }
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          entryId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    return result;
  }

  /**
   * Get batch operation summary
   */
  getBatchOperationSummary(operation: BatchPollingOperation): string {
    const count = operation.entryIds.length;
    switch (operation.action) {
      case "start":
        return `Start polling for ${count} ${count === 1 ? "entry" : "entries"}`;
      case "stop":
        return `Stop polling for ${count} ${count === 1 ? "entry" : "entries"}`;
      case "changeInterval":
        const minutes = (operation.intervalMs || 0) / (60 * 1000);
        return `Change interval to ${minutes} minutes for ${count} ${count === 1 ? "entry" : "entries"}`;
      default:
        return `Execute batch operation on ${count} ${count === 1 ? "entry" : "entries"}`;
    }
  }
}

export const batchPollingControl = new BatchPollingControlService();
