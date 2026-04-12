import { OCRExtractedData } from "./types";

/**
 * OCR Service for Test Ticket Extraction
 * Extracts structured data from test ticket images
 *
 * Note: This service uses a mock implementation for development.
 * In production, integrate with:
 * - Google Cloud Vision API
 * - AWS Textract
 * - Azure Computer Vision
 * - Tesseract.js (on-device OCR)
 */

export class OCRService {
  /**
   * Extract data from test ticket image
   * Returns structured JSON with extracted fields
   */
  static async extractFromImage(imageUri: string): Promise<OCRExtractedData> {
    try {
      console.log("🔍 [OCR] Starting extraction from image:", imageUri);

      // TODO: Integrate with actual OCR service
      // For now, return mock data structure
      const mockData: OCRExtractedData = {
        name: null,
        passport_no: null,
        nationality: null,
        ticket_no: null,
        occupation: null,
        test_center: null,
        test_date: null,
        test_time: null,
        language: null,
        confidence: 0,
        raw_text: "",
      };

      console.log("⚠️ [OCR] Using mock data - integrate with actual OCR service");
      return mockData;
    } catch (error) {
      console.error("❌ [OCR] Error extracting from image:", error);
      throw error;
    }
  }

  /**
   * Parse raw OCR text into structured format
   */
  static parseOCRText(rawText: string): OCRExtractedData {
    try {
      console.log("📝 [OCR] Parsing raw text...");

      const data: OCRExtractedData = {
        name: this.extractName(rawText),
        passport_no: this.extractPassportNumber(rawText),
        nationality: this.extractNationality(rawText),
        ticket_no: this.extractTicketNumber(rawText),
        occupation: this.extractOccupation(rawText),
        test_center: this.extractTestCenter(rawText),
        test_date: this.extractTestDate(rawText),
        test_time: this.extractTestTime(rawText),
        language: this.extractLanguage(rawText),
        confidence: this.calculateConfidence(rawText),
        raw_text: rawText,
      };

      console.log("✅ [OCR] Text parsed successfully");
      return data;
    } catch (error) {
      console.error("❌ [OCR] Error parsing text:", error);
      throw error;
    }
  }

  /**
   * Extract name from raw text
   */
  private static extractName(text: string): string | null {
    // Pattern: Look for "Name:" or similar labels
    const patterns = [/Name\s*[:=]\s*([^\n]+)/i, /Applicant\s*Name\s*[:=]\s*([^\n]+)/i, /^([A-Z][A-Z\s]+)$/m];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract passport number from raw text
   */
  private static extractPassportNumber(text: string): string | null {
    // Pattern: Passport numbers are typically alphanumeric, 6-10 characters
    const patterns = [
      /Passport\s*(?:No|Number|#)\s*[:=]\s*([A-Z0-9]+)/i,
      /([A-Z]\d{7,9})/,
      /Passport\s*[:=]\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract nationality from raw text
   */
  private static extractNationality(text: string): string | null {
    const patterns = [
      /Nationality\s*[:=]\s*([^\n]+)/i,
      /Country\s*[:=]\s*([^\n]+)/i,
      /National\s*[:=]\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract ticket number from raw text
   */
  private static extractTicketNumber(text: string): string | null {
    const patterns = [
      /Ticket\s*(?:No|Number|#)\s*[:=]\s*([0-9]+)/i,
      /Test\s*Ticket\s*[:=]\s*([0-9]+)/i,
      /Ticket\s*[:=]\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract occupation from raw text
   */
  private static extractOccupation(text: string): string | null {
    const patterns = [
      /Occupation\s*[:=]\s*([^\n]+)/i,
      /Job\s*Title\s*[:=]\s*([^\n]+)/i,
      /Position\s*[:=]\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract test center from raw text
   */
  private static extractTestCenter(text: string): string | null {
    const patterns = [
      /Test\s*Center\s*[:=]\s*([^\n]+(?:\n[^\n]+)*)/i,
      /Training\s*Center\s*[:=]\s*([^\n]+(?:\n[^\n]+)*)/i,
      /Center\s*[:=]\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract test date from raw text
   * Returns in YYYY-MM-DD format
   */
  private static extractTestDate(text: string): string | null {
    const patterns = [
      /Date\s*(?:of\s*)?(?:Test|Exam)\s*[:=]\s*([^\n]+)/i,
      /Test\s*Date\s*[:=]\s*([^\n]+)/i,
      /Exam\s*Date\s*[:=]\s*([^\n]+)/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].trim();
        const normalized = this.normalizeDate(dateStr);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }

  /**
   * Extract test time from raw text
   * Returns in HH:MM AM/PM format
   */
  private static extractTestTime(text: string): string | null {
    const patterns = [
      /Time\s*(?:of\s*)?(?:Test|Exam)\s*[:=]\s*([^\n]+)/i,
      /Test\s*Time\s*[:=]\s*([^\n]+)/i,
      /Exam\s*Time\s*[:=]\s*([^\n]+)/i,
      /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const timeStr = match[1].trim();
        const normalized = this.normalizeTime(timeStr);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }

  /**
   * Extract language from raw text
   */
  private static extractLanguage(text: string): string | null {
    const patterns = [
      /Language\s*[:=]\s*([^\n]+)/i,
      /Medium\s*[:=]\s*([^\n]+)/i,
      /(Bengali|English|Arabic|Bangla)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Normalize date string to YYYY-MM-DD format
   */
  private static normalizeDate(dateStr: string): string | null {
    try {
      // Try parsing various date formats
      const date = new Date(dateStr);

      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Normalize time string to HH:MM AM/PM format
   */
  private static normalizeTime(timeStr: string): string | null {
    try {
      // Extract hours and minutes
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);

      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3]?.toUpperCase() || "AM";

        if (hours >= 0 && hours <= 23 && parseInt(minutes, 10) >= 0 && parseInt(minutes, 10) <= 59) {
          const normalizedHours = String(hours).padStart(2, "0");
          return `${normalizedHours}:${minutes} ${period}`;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate confidence score (0-100)
   * Based on how many fields were successfully extracted
   */
  private static calculateConfidence(text: string): number {
    if (!text || text.length === 0) return 0;

    const requiredFields = [
      /Name\s*[:=]/i,
      /Passport\s*(?:No|Number)/i,
      /Ticket\s*(?:No|Number)/i,
      /Date/i,
      /Time/i,
      /Center/i,
    ];

    const foundFields = requiredFields.filter((pattern) => pattern.test(text)).length;
    return Math.round((foundFields / requiredFields.length) * 100);
  }

  /**
   * Validate extracted data
   */
  static validateExtractedData(data: OCRExtractedData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name) errors.push("Name is missing");
    if (!data.passport_no) errors.push("Passport number is missing");
    if (!data.nationality) errors.push("Nationality is missing");
    if (!data.ticket_no) errors.push("Ticket number is missing");
    if (!data.occupation) errors.push("Occupation is missing");
    if (!data.test_center) errors.push("Test center is missing");
    if (!data.test_date) errors.push("Test date is missing");
    if (!data.test_time) errors.push("Test time is missing");
    if (!data.language) errors.push("Language is missing");

    if (data.confidence < 50) errors.push(`Low confidence score: ${data.confidence}%`);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
