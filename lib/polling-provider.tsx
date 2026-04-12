import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { LaborResult } from "./types";
import { startPolling, stopPolling, stopAllPolling, getPollingStatus } from "./polling-service";
import { sendTelegramNotification } from "./telegram-service";
import { sendStatusNotification } from "./notification-service";

export interface PollingEntry {
  entryId: string;
  passportNumber: string;
  occupationKey: string;
  nationalityId: string;
  intervalMs: number;
  isPolling: boolean;
  lastResult: LaborResult | null;
  lastError: Error | null;
  status: "polling" | "idle" | "error";
}

interface PollingContextType {
  entries: Map<string, PollingEntry>;
  startPollingEntry: (
    entryId: string,
    passportNumber: string,
    occupationKey: string,
    nationalityId: string,
    intervalMs: number
  ) => void;
  stopPollingEntry: (entryId: string) => void;
  stopAllPollingEntries: () => void;
  getPollingEntry: (entryId: string) => PollingEntry | undefined;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export function PollingProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Map<string, PollingEntry>>(new Map());

  const startPollingEntry = useCallback(
    (
      entryId: string,
      passportNumber: string,
      occupationKey: string,
      nationalityId: string,
      intervalMs: number
    ) => {
      const entry: PollingEntry = {
        entryId,
        passportNumber,
        occupationKey,
        nationalityId,
        intervalMs,
        isPolling: true,
        lastResult: null,
        lastError: null,
        status: "polling",
      };

      setEntries((prev) => new Map(prev).set(entryId, entry));

      // Start polling with callbacks
      startPolling({
        entryId,
        passportNumber,
        occupationKey,
        nationalityId,
        intervalMs,
        maxRetries: 5,
        onSuccess: (result) => {
          setEntries((prev) => {
            const updated = new Map(prev);
            const current = updated.get(entryId);
            
            // Send Telegram and phone notifications on status change
            if (current && current.lastResult) {
              const prevStatus = current.lastResult.exam_result;
              const newStatus = result.exam_result;
              if (prevStatus !== newStatus) {
                const timestamp = new Date().toLocaleString();
                
                // Send Telegram notification
                sendTelegramNotification({
                  passportNumber,
                  previousStatus: prevStatus,
                  newStatus,
                  testCenter: result.test_center_name || 'Unknown',
                  examDate: result.exam_date || 'Unknown',
                  timestamp,
                }).catch(err => console.error('Telegram error:', err));

                // Send phone notification
                sendStatusNotification({
                  passportNumber,
                  previousStatus: prevStatus,
                  newStatus,
                  testCenter: result.test_center_name,
                  examDate: result.exam_date,
                  timestamp,
                }).catch(err => console.error('Phone notification error:', err));
              }
            }
            
            if (current) {
              updated.set(entryId, {
                ...current,
                lastResult: result,
                lastError: null,
                status: "polling",
              });
            }
            return updated;
          });
        },
        onError: (error) => {
          setEntries((prev) => {
            const updated = new Map(prev);
            const current = updated.get(entryId);
            if (current) {
              updated.set(entryId, {
                ...current,
                lastError: error,
                status: "error",
                isPolling: false,
              });
            }
            return updated;
          });
        },
        onStatusChange: (status) => {
          setEntries((prev) => {
            const updated = new Map(prev);
            const current = updated.get(entryId);
            if (current) {
              updated.set(entryId, {
                ...current,
                status,
              });
            }
            return updated;
          });
        },
      });
    },
    []
  );

  const stopPollingEntry = useCallback((entryId: string) => {
    stopPolling(entryId);
    setEntries((prev) => {
      const updated = new Map(prev);
      const current = updated.get(entryId);
      if (current) {
        updated.set(entryId, {
          ...current,
          isPolling: false,
          status: "idle",
        });
      }
      return updated;
    });
  }, []);

  const stopAllPollingEntries = useCallback(() => {
    stopAllPolling();
    setEntries(new Map());
  }, []);

  const getPollingEntry = useCallback(
    (entryId: string): PollingEntry | undefined => {
      return entries.get(entryId);
    },
    [entries]
  );

  useEffect(() => {
    return () => {
      stopAllPolling();
    };
  }, []);

  const value: PollingContextType = {
    entries,
    startPollingEntry,
    stopPollingEntry,
    stopAllPollingEntries,
    getPollingEntry,
  };

  return (
    <PollingContext.Provider value={value}>{children}</PollingContext.Provider>
  );
}

export function usePolling(): PollingContextType {
  const context = useContext(PollingContext);
  if (!context) {
    throw new Error("usePolling must be used within PollingProvider");
  }
  return context;
}
