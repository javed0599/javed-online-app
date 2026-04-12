import { describe, it, expect } from "vitest";
import { validationService } from "../../lib/validation-service";

describe("Validation Service", () => {
  describe("Passport Number Validation", () => {
    it("should accept valid passport numbers", () => {
      const validNumbers = [
        "A08538625",
        "BA1234567",
        "ABC123456",
        "A2108216",
      ];
      validNumbers.forEach((num) => {
        const result = validationService.validatePassportNumber(num);
        expect(result.isValid).toBe(true);
      });
    });

    it("should reject empty passport numbers", () => {
      const result = validationService.validatePassportNumber("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should reject passport numbers with wrong format", () => {
      const invalidNumbers = [
        "12345678", // all digits
        "ABCDEFGH", // all letters
        "123ABC456", // digits first
        "A", // too short
        "ABCDEFGHIJK", // too long
      ];
      invalidNumbers.forEach((num) => {
        const result = validationService.validatePassportNumber(num);
        expect(result.isValid).toBe(false);
      });
    });

    it("should convert lowercase to uppercase", () => {
      const result = validationService.validatePassportNumber("a08538625");
      expect(result.isValid).toBe(true);
    });
  });

  describe("Occupation Code Validation", () => {
    it("should accept valid occupation codes", () => {
      const validCodes = ["931201", "123456", "1234", "12345"];
      validCodes.forEach((code) => {
        const result = validationService.validateOccupationCode(code);
        expect(result.isValid).toBe(true);
      });
    });

    it("should reject empty occupation codes", () => {
      const result = validationService.validateOccupationCode("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should reject non-numeric codes", () => {
      const invalidCodes = ["ABC123", "12AB34", "123-456"];
      invalidCodes.forEach((code) => {
        const result = validationService.validateOccupationCode(code);
        expect(result.isValid).toBe(false);
      });
    });

    it("should reject codes with wrong length", () => {
      const invalidCodes = ["123", "1234567"];
      invalidCodes.forEach((code) => {
        const result = validationService.validateOccupationCode(code);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe("Nationality Code Validation", () => {
    it("should accept valid nationality codes", () => {
      const validCodes = ["BGD", "IND", "PAK", "US", "UK"];
      validCodes.forEach((code) => {
        const result = validationService.validateNationalityCode(code);
        expect(result.isValid).toBe(true);
      });
    });

    it("should reject empty nationality codes", () => {
      const result = validationService.validateNationalityCode("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should reject non-alphabetic codes", () => {
      const invalidCodes = ["12D", "B2D", "123"];
      invalidCodes.forEach((code) => {
        const result = validationService.validateNationalityCode(code);
        expect(result.isValid).toBe(false);
      });
    });

    it("should convert lowercase to uppercase", () => {
      const result = validationService.validateNationalityCode("bgd");
      expect(result.isValid).toBe(true);
    });
  });

  describe("All Fields Validation", () => {
    it("should validate all fields together successfully", () => {
      const result = validationService.validateAllFields(
        "A08538625",
        "931201",
        "BGD"
      );
      expect(result.isValid).toBe(true);
    });

    it("should fail if passport is invalid", () => {
      const result = validationService.validateAllFields(
        "invalid",
        "931201",
        "BGD"
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail if occupation code is invalid", () => {
      const result = validationService.validateAllFields(
        "A08538625",
        "ABC",
        "BGD"
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail if nationality is invalid", () => {
      const result = validationService.validateAllFields(
        "A08538625",
        "931201",
        "12345"
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Hints", () => {
    it("should return passport hint", () => {
      const hint = validationService.getHint("passport");
      expect(hint).toContain("A");
      expect(hint).toContain("08538625");
    });

    it("should return occupation hint", () => {
      const hint = validationService.getHint("occupation");
      expect(hint).toContain("931201");
    });

    it("should return nationality hint", () => {
      const hint = validationService.getHint("nationality");
      expect(hint).toContain("BGD");
    });
  });
});
