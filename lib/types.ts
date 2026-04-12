/**
 * API Response types for the labor result checker
 */

export interface LaborResult {
  exam_date: string;
  exam_result: "passed" | "failed" | "pending";
  exam_result_id: number;
  test_center_name: string;
  applicant_name?: string;
}

export interface PassportEntry {
  id: string;
  passport_number: string;
  applicant_name?: string;
  occupation_key: string;
  occupation_name?: string;
  nationality_id: string;
  latest_result: LaborResult | null;
  check_history: CheckHistory[];
  referral_notes: ReferralNote[];
  created_at: number;
  last_checked_at: number | null;
  check_count: number;
}

export interface CheckHistory {
  id: string;
  timestamp: number;
  result: LaborResult;
  status: "passed" | "failed" | "pending";
}

export interface ReferralNote {
  id: string;
  timestamp: number;
  content: string;
  created_at: number;
}

export interface ApiParams {
  passport_number: string;
  occupation_key: string;
  nationality_id?: string;
  locale?: string;
}

export interface Occupation {
  id: number;
  name?: string;
  english_name: string;
  arabic_name: string;
  occupation_key: string;
  code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: number;
  passportNumber: string;
  entryId: string;
  previousStatus: "passed" | "failed" | "pending";
  currentStatus: "passed" | "failed" | "pending";
  testCenterName: string;
  examDate: string;
  read: boolean;
}

export interface OccupationCache {
  code: string;
  name: string;
  arabic_name: string;
  cached_at: number;
}

export interface NotificationSettings {
  id: string;
  soundEnabled: boolean;
  soundType: "default" | "chime" | "bell" | "notification" | "silent";
  vibrationEnabled: boolean;
  vibrationPattern: "light" | "medium" | "heavy";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationsEnabled: boolean;
}

export interface EntryNotificationPreferences {
  entryId: string;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  notificationsEnabled: boolean;
  muteUntil?: number;
}

// ============================================================================
// Exam Reminder Types (OCR Test Ticket Feature)
// ============================================================================

export interface ExamReminder {
  id: string;
  // Extracted from test ticket via OCR
  name: string;
  passport_no: string;
  nationality: string;
  ticket_no: string;
  occupation: string;
  test_center: string;
  test_date: string; // Format: YYYY-MM-DD
  test_time: string; // Format: HH:MM AM/PM
  language: string;
  // Metadata
  image_uri?: string; // Local URI of uploaded/captured image
  extraction_confidence?: number; // 0-100, confidence of OCR extraction
  created_at: number;
  updated_at: number;
  // Optional linking to result check
  linked_entry_id?: string; // Link to PassportEntry if user wants to check results
  reminder_set?: boolean;
  reminder_notification_id?: string;
}

export interface OCRExtractedData {
  name: string | null;
  passport_no: string | null;
  nationality: string | null;
  ticket_no: string | null;
  occupation: string | null;
  test_center: string | null;
  test_date: string | null; // YYYY-MM-DD
  test_time: string | null; // HH:MM AM/PM
  language: string | null;
  confidence: number; // 0-100
  raw_text?: string; // Raw OCR text for debugging
}
