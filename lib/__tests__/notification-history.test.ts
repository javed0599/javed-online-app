import { describe, it, expect } from "vitest";
import { NotificationLog } from "@/lib/types";

describe("Notification History", () => {
  describe("NotificationLog structure", () => {
    it("should create a valid notification log", () => {
      const log: NotificationLog = {
        id: "1",
        timestamp: Date.now(),
        passportNumber: "A21082162",
        entryId: "entry-1",
        previousStatus: "pending",
        currentStatus: "passed",
        testCenterName: "Bangladesh Korea TTC Dhaka",
        examDate: "2025-11-20",
        read: false,
      };

      expect(log.id).toBe("1");
      expect(log.passportNumber).toBe("A21082162");
      expect(log.previousStatus).toBe("pending");
      expect(log.currentStatus).toBe("passed");
      expect(log.read).toBe(false);
    });

    it("should track read status", () => {
      const unreadLog: NotificationLog = {
        id: "1",
        timestamp: Date.now(),
        passportNumber: "A21082162",
        entryId: "entry-1",
        previousStatus: "pending",
        currentStatus: "passed",
        testCenterName: "Bangladesh Korea TTC Dhaka",
        examDate: "2025-11-20",
        read: false,
      };

      const readLog: NotificationLog = {
        ...unreadLog,
        read: true,
      };

      expect(unreadLog.read).toBe(false);
      expect(readLog.read).toBe(true);
    });
  });

  describe("Notification filtering", () => {
    const logs: NotificationLog[] = [
      {
        id: "1",
        timestamp: 1000,
        passportNumber: "A21082162",
        entryId: "entry-1",
        previousStatus: "pending",
        currentStatus: "passed",
        testCenterName: "Test Center 1",
        examDate: "2025-11-20",
        read: false,
      },
      {
        id: "2",
        timestamp: 2000,
        passportNumber: "B12345678",
        entryId: "entry-2",
        previousStatus: "pending",
        currentStatus: "failed",
        testCenterName: "Test Center 2",
        examDate: "2025-11-21",
        read: true,
      },
      {
        id: "3",
        timestamp: 3000,
        passportNumber: "C87654321",
        entryId: "entry-3",
        previousStatus: "passed",
        currentStatus: "pending",
        testCenterName: "Test Center 3",
        examDate: "2025-11-22",
        read: false,
      },
    ];

    it("should filter logs by passed status", () => {
      const passed = logs.filter((log) => log.currentStatus === "passed");
      expect(passed).toHaveLength(1);
      expect(passed[0].passportNumber).toBe("A21082162");
    });

    it("should filter logs by failed status", () => {
      const failed = logs.filter((log) => log.currentStatus === "failed");
      expect(failed).toHaveLength(1);
      expect(failed[0].passportNumber).toBe("B12345678");
    });

    it("should filter logs by pending status", () => {
      const pending = logs.filter((log) => log.currentStatus === "pending");
      expect(pending).toHaveLength(1);
      expect(pending[0].passportNumber).toBe("C87654321");
    });

    it("should filter unread logs", () => {
      const unread = logs.filter((log) => !log.read);
      expect(unread).toHaveLength(2);
      expect(unread[0].id).toBe("1");
      expect(unread[1].id).toBe("3");
    });

    it("should filter logs by entry ID", () => {
      const entryLogs = logs.filter((log) => log.entryId === "entry-2");
      expect(entryLogs).toHaveLength(1);
      expect(entryLogs[0].passportNumber).toBe("B12345678");
    });
  });

  describe("Notification statistics", () => {
    const logs: NotificationLog[] = [
      {
        id: "1",
        timestamp: 1000,
        passportNumber: "A21082162",
        entryId: "entry-1",
        previousStatus: "pending",
        currentStatus: "passed",
        testCenterName: "Test Center 1",
        examDate: "2025-11-20",
        read: false,
      },
      {
        id: "2",
        timestamp: 2000,
        passportNumber: "B12345678",
        entryId: "entry-2",
        previousStatus: "pending",
        currentStatus: "failed",
        testCenterName: "Test Center 2",
        examDate: "2025-11-21",
        read: true,
      },
      {
        id: "3",
        timestamp: 3000,
        passportNumber: "C87654321",
        entryId: "entry-3",
        previousStatus: "passed",
        currentStatus: "passed",
        testCenterName: "Test Center 3",
        examDate: "2025-11-22",
        read: false,
      },
    ];

    it("should calculate total notifications", () => {
      expect(logs).toHaveLength(3);
    });

    it("should count unread notifications", () => {
      const unreadCount = logs.filter((log) => !log.read).length;
      expect(unreadCount).toBe(2);
    });

    it("should count passed notifications", () => {
      const passedCount = logs.filter((log) => log.currentStatus === "passed").length;
      expect(passedCount).toBe(2);
    });

    it("should count failed notifications", () => {
      const failedCount = logs.filter((log) => log.currentStatus === "failed").length;
      expect(failedCount).toBe(1);
    });
  });

  describe("Notification search", () => {
    const logs: NotificationLog[] = [
      {
        id: "1",
        timestamp: 1000,
        passportNumber: "A21082162",
        entryId: "entry-1",
        previousStatus: "pending",
        currentStatus: "passed",
        testCenterName: "Bangladesh Korea TTC Dhaka",
        examDate: "2025-11-20",
        read: false,
      },
      {
        id: "2",
        timestamp: 2000,
        passportNumber: "B12345678",
        entryId: "entry-2",
        previousStatus: "pending",
        currentStatus: "failed",
        testCenterName: "Test Center 2",
        examDate: "2025-11-21",
        read: true,
      },
    ];

    it("should search by passport number", () => {
      const results = logs.filter((log) =>
        log.passportNumber.toLowerCase().includes("a210")
      );
      expect(results).toHaveLength(1);
      expect(results[0].passportNumber).toBe("A21082162");
    });

    it("should search by test center name", () => {
      const results = logs.filter((log) =>
        log.testCenterName.toLowerCase().includes("dhaka")
      );
      expect(results).toHaveLength(1);
      expect(results[0].testCenterName).toBe("Bangladesh Korea TTC Dhaka");
    });
  });

  describe("Notification date range", () => {
    const logs: NotificationLog[] = [
      {
        id: "1",
        timestamp: 1000,
        passportNumber: "A21082162",
        entryId: "entry-1",
        previousStatus: "pending",
        currentStatus: "passed",
        testCenterName: "Test Center 1",
        examDate: "2025-11-20",
        read: false,
      },
      {
        id: "2",
        timestamp: 5000,
        passportNumber: "B12345678",
        entryId: "entry-2",
        previousStatus: "pending",
        currentStatus: "failed",
        testCenterName: "Test Center 2",
        examDate: "2025-11-21",
        read: true,
      },
      {
        id: "3",
        timestamp: 10000,
        passportNumber: "C87654321",
        entryId: "entry-3",
        previousStatus: "passed",
        currentStatus: "pending",
        testCenterName: "Test Center 3",
        examDate: "2025-11-22",
        read: false,
      },
    ];

    it("should filter logs by date range", () => {
      const results = logs.filter((log) => log.timestamp >= 2000 && log.timestamp <= 8000);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
    });

    it("should include logs at range boundaries", () => {
      const results = logs.filter((log) => log.timestamp >= 1000 && log.timestamp <= 10000);
      expect(results).toHaveLength(3);
    });
  });
});
