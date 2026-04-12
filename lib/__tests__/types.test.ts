import { describe, it, expect } from "vitest";
import {
  LaborResult,
  PassportEntry,
  CheckHistory,
  ReferralNote,
  ApiParams,
} from "@/lib/types";

describe("Type Definitions", () => {
  describe("LaborResult", () => {
    it("should have all required fields", () => {
      const result: LaborResult = {
        exam_date: "2025-11-20",
        exam_result: "passed",
        exam_result_id: 0,
        test_center_name: "Bangladesh Korea TTC Dhaka",
      };

      expect(result).toHaveProperty("exam_date");
      expect(result).toHaveProperty("exam_result");
      expect(result).toHaveProperty("exam_result_id");
      expect(result).toHaveProperty("test_center_name");
    });

    it("should accept both passed and failed exam results", () => {
      const passedResult: LaborResult = {
        exam_date: "2025-11-20",
        exam_result: "passed",
        exam_result_id: 0,
        test_center_name: "Test Center",
      };

      const failedResult: LaborResult = {
        exam_date: "2025-11-20",
        exam_result: "failed",
        exam_result_id: 1,
        test_center_name: "Test Center",
      };

      expect(passedResult.exam_result).toBe("passed");
      expect(failedResult.exam_result).toBe("failed");
    });
  });

  describe("PassportEntry", () => {
    it("should have all required fields", () => {
      const entry: PassportEntry = {
        id: "1",
        passport_number: "A21082162",
        occupation_key: "933301",
        nationality_id: "BGD",
        latest_result: null,
        check_history: [],
        referral_notes: [],
        created_at: Date.now(),
        last_checked_at: null,
        check_count: 0,
      };

      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("passport_number");
      expect(entry).toHaveProperty("occupation_key");
      expect(entry).toHaveProperty("nationality_id");
      expect(entry).toHaveProperty("latest_result");
      expect(entry).toHaveProperty("check_history");
      expect(entry).toHaveProperty("referral_notes");
      expect(entry).toHaveProperty("created_at");
      expect(entry).toHaveProperty("last_checked_at");
      expect(entry).toHaveProperty("check_count");
    });
  });

  describe("CheckHistory", () => {
    it("should track check history with timestamp", () => {
      const result: LaborResult = {
        exam_date: "2025-11-20",
        exam_result: "passed",
        exam_result_id: 0,
        test_center_name: "Test Center",
      };

      const history: CheckHistory = {
        id: "1",
        timestamp: Date.now(),
        result,
        status: "passed",
      };

      expect(history.timestamp).toBeGreaterThan(0);
      expect(history.status).toBe("passed");
    });
  });

  describe("ReferralNote", () => {
    it("should store referral notes with timestamps", () => {
      const note: ReferralNote = {
        id: "1",
        timestamp: Date.now(),
        content: "Follow up required",
        created_at: Date.now(),
      };

      expect(note.content).toBe("Follow up required");
      expect(note.timestamp).toBeGreaterThan(0);
      expect(note.created_at).toBeGreaterThan(0);
    });
  });

  describe("ApiParams", () => {
    it("should accept API parameters", () => {
      const params: ApiParams = {
        passport_number: "A21082162",
        occupation_key: "933301",
        nationality_id: "BGD",
        locale: "en",
      };

      expect(params.passport_number).toBe("A21082162");
      expect(params.occupation_key).toBe("933301");
      expect(params.nationality_id).toBe("BGD");
      expect(params.locale).toBe("en");
    });

    it("should have optional nationality_id and locale", () => {
      const params: ApiParams = {
        passport_number: "A21082162",
        occupation_key: "933301",
      };

      expect(params.passport_number).toBeDefined();
      expect(params.occupation_key).toBeDefined();
    });
  });
});
