import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PassportEntry, LaborResult, CheckHistory, ReferralNote } from "./types";

interface DataContextType {
  entries: PassportEntry[];
  addEntry: (entry: PassportEntry) => Promise<void>;
  updateEntry: (id: string, entry: Partial<PassportEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCheckHistory: (
    entryId: string,
    result: LaborResult,
    status: "passed" | "failed" | "pending"
  ) => Promise<void>;
  addReferralNote: (entryId: string, content: string) => Promise<void>;
  deleteReferralNote: (entryId: string, noteId: string) => Promise<void>;
  getEntryById: (id: string) => PassportEntry | undefined;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = "labor_checker_entries";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<PassportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load entries from storage on mount
  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setEntries(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEntries(newEntries: PassportEntry[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (error) {
      console.error("Error saving entries:", error);
    }
  }

  async function addEntry(entry: PassportEntry) {
    const newEntries = [...entries, entry];
    await saveEntries(newEntries);
  }

  async function updateEntry(id: string, updates: Partial<PassportEntry>) {
    const newEntries = entries.map((entry) =>
      entry.id === id ? { ...entry, ...updates } : entry
    );
    await saveEntries(newEntries);
  }

  async function deleteEntry(id: string) {
    const newEntries = entries.filter((entry) => entry.id !== id);
    await saveEntries(newEntries);
  }

  async function addCheckHistory(
    entryId: string,
    result: LaborResult,
    status: "passed" | "failed" | "pending"
  ) {
    const newHistory: CheckHistory = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      result,
      status,
    };

    const newEntries = entries.map((entry) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          latest_result: result,
          check_history: [newHistory, ...entry.check_history],
          last_checked_at: Date.now(),
          check_count: entry.check_count + 1,
        };
      }
      return entry;
    });

    await saveEntries(newEntries);
  }

  async function addReferralNote(entryId: string, content: string) {
    const newNote: ReferralNote = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content,
      created_at: Date.now(),
    };

    const newEntries = entries.map((entry) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          referral_notes: [newNote, ...entry.referral_notes],
        };
      }
      return entry;
    });

    await saveEntries(newEntries);
  }

  async function deleteReferralNote(entryId: string, noteId: string) {
    const newEntries = entries.map((entry) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          referral_notes: entry.referral_notes.filter((n) => n.id !== noteId),
        };
      }
      return entry;
    });

    await saveEntries(newEntries);
  }

  function getEntryById(id: string): PassportEntry | undefined {
    return entries.find((entry) => entry.id === id);
  }

  const value: DataContextType = {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    addCheckHistory,
    addReferralNote,
    deleteReferralNote,
    getEntryById,
    isLoading,
  };

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
