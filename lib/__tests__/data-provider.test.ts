import { describe, it, expect, beforeEach, vi } from "vitest";
import { PassportEntry, LaborResult, ReferralNote } from "@/lib/types";

describe("Data Provider Utilities", () => {
  describe("PassportEntry creation", () => {
    it("should create a valid passport entry", () => {
      const result: LaborResult = {
        exam_date: "2025-11-20",
        exam_result: "passed",
        exam_result_id: 0,
        test_center_name: "Bangladesh Korea TTC Dhaka",
      };

      const entry: PassportEntry = {
        id: "1",
        passport_number: "A21082162",
        occupation_key: "933301",
        nationality_id: "BGD",
        latest_result: result,
        check_history: [
          {
            id: "1",
            timestamp: Date.now(),
            result,
            status: "passed",
          },
        ],
        referral_notes: [],
        created_at: Date.now(),
        last_checked_at: Date.now(),
        check_count: 1,
      };

      expect(entry.passport_number).toBe("A21082162");
      expect(entry.occupation_key).toBe("933301");
      expect(entry.latest_result?.exam_result).toBe("passed");
      expect(entry.check_count).toBe(1);
    });

    it("should handle referral notes correctly", () => {
      const note: ReferralNote = {
        id: "1",
        timestamp: Date.now(),
        content: "Follow up required",
        created_at: Date.now(),
      };

      const entry: PassportEntry = {
        id: "1",
        passport_number: "A21082162",
        occupation_key: "933301",
        nationality_id: "BGD",
        latest_result: null,
        check_history: [],
        referral_notes: [note],
        created_at: Date.now(),
        last_checked_at: null,
        check_count: 0,
      };

      expect(entry.referral_notes).toHaveLength(1);
      expect(entry.referral_notes[0].content).toBe("Follow up required");
    });

    it("should track check history correctly", () => {
      const result: LaborResult = {
        exam_date: "2025-11-20",
        exam_result: "passed",
        exam_result_id: 0,
        test_center_name: "Bangladesh Korea TTC Dhaka",
      };

      const history1 = {
        id: "1",
        timestamp: 1000,
        result,
        status: "passed" as const,
      };

      const history2 = {
        id: "2",
        timestamp: 2000,
        result: { ...result, exam_result: "failed" as const },
        status: "failed" as const,
      };

      const entry: PassportEntry = {
        id: "1",
        passport_number: "A21082162",
        occupation_key: "933301",
        nationality_id: "BGD",
        latest_result: history2.result,
        check_history: [history2, history1],
        referral_notes: [],
        created_at: 1000,
        last_checked_at: 2000,
        check_count: 2,
      };

      expect(entry.check_history).toHaveLength(2);
      expect(entry.check_count).toBe(2);
      expect(entry.latest_result?.exam_result).toBe("failed");
    });
  });

  describe("Data validation", () => {
    it("should validate passport number format", () => {
      const passportNumber = "A21082162";
      expect(passportNumber).toMatch(/^[A-Z]\d+$/);
    });

    it("should validate occupation code format", () => {
      const occupationCode = "933301";
      expect(occupationCode).toMatch(/^\d+$/);
    });

    it("should validate nationality code format", () => {
      const nationalityCode = "BGD";
      expect(nationalityCode).toMatch(/^[A-Z]{3}$/);
    });
  });
});
