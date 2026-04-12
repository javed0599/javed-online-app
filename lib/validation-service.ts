/**
 * Validation service for passport and occupation data
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validationService = {
  /**
   * Validate passport number format
   * Bangladesh passport numbers are typically 8-9 alphanumeric characters
   * Format: Letter(s) followed by digits (e.g., A08538625, BA1234567)
   */
  validatePassportNumber(passportNumber: string): ValidationResult {
    if (!passportNumber || !passportNumber.trim()) {
      return { isValid: false, error: "Passport number is required" };
    }

    const trimmed = passportNumber.trim().toUpperCase();

    // Check length (typically 8-9 characters)
    if (trimmed.length < 7 || trimmed.length > 10) {
      return {
        isValid: false,
        error: "Passport number should be 7-10 characters",
      };
    }

    // Check format: starts with letter(s), followed by digits
    if (!/^[A-Z]{1,3}[0-9]{5,9}$/.test(trimmed)) {
      return {
        isValid: false,
        error: "Invalid format. Use letters followed by numbers (e.g., A08538625)",
      };
    }

    return { isValid: true };
  },

  /**
   * Validate occupation code format
   * Occupation codes are typically 4-6 digit numbers
   */
  validateOccupationCode(occupationCode: string): ValidationResult {
    if (!occupationCode || !occupationCode.trim()) {
      return { isValid: false, error: "Occupation code is required" };
    }

    const trimmed = occupationCode.trim();

    // Check if it's numeric
    if (!/^\d+$/.test(trimmed)) {
      return {
        isValid: false,
        error: "Occupation code should contain only numbers",
      };
    }

    // Check length (typically 4-6 digits)
    if (trimmed.length < 4 || trimmed.length > 6) {
      return {
        isValid: false,
        error: "Occupation code should be 4-6 digits",
      };
    }

    return { isValid: true };
  },

  /**
   * Validate nationality code format
   * Typically 2-3 letter country codes (e.g., BGD, IND, PAK)
   */
  validateNationalityCode(nationalityCode: string): ValidationResult {
    if (!nationalityCode || !nationalityCode.trim()) {
      return { isValid: false, error: "Nationality code is required" };
    }

    const trimmed = nationalityCode.trim().toUpperCase();

    // Check if it's alphabetic
    if (!/^[A-Z]{2,3}$/.test(trimmed)) {
      return {
        isValid: false,
        error: "Nationality code should be 2-3 letters (e.g., BGD)",
      };
    }

    return { isValid: true };
  },

  /**
   * Validate all fields together
   */
  validateAllFields(
    passportNumber: string,
    occupationCode: string,
    nationalityCode: string
  ): ValidationResult {
    // Validate passport number
    const passportValidation = this.validatePassportNumber(passportNumber);
    if (!passportValidation.isValid) {
      return passportValidation;
    }

    // Validate occupation code
    const occupationValidation = this.validateOccupationCode(occupationCode);
    if (!occupationValidation.isValid) {
      return occupationValidation;
    }

    // Validate nationality code
    const nationalityValidation = this.validateNationalityCode(
      nationalityCode
    );
    if (!nationalityValidation.isValid) {
      return nationalityValidation;
    }

    return { isValid: true };
  },

  /**
   * Get helpful hint for a field
   */
  getHint(field: "passport" | "occupation" | "nationality"): string {
    switch (field) {
      case "passport":
        return "e.g., A08538625 or BA1234567";
      case "occupation":
        return "e.g., 931201 (4-6 digits)";
      case "nationality":
        return "e.g., BGD (country code)";
      default:
        return "";
    }
  },
};
