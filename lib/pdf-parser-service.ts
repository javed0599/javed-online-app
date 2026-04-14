import DocumentPicker from "react-native-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { OCRExtractedData } from "./types";

/**
 * PDF Parser Service
 * Handles PDF file selection and text extraction for OCR processing
 */
export class PDFParserService {
  /**
   * Pick a PDF file from device storage
   */
  static async pickPDFFile(): Promise<{
    uri: string;
    name: string;
    type: string;
  } | null> {
    try {
      const result = await DocumentPicker.pick({
        presentationStyle: "fullScreen",
        type: [DocumentPicker.types.pdf],
      });

      if (result && result.length > 0) {
        const file = result[0];
        return {
          uri: file.uri,
          name: file.name || "document.pdf",
          type: file.type || "application/pdf",
        };
      }
      return null;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log("PDF picker cancelled");
        return null;
      }
      throw error;
    }
  }

  /**
   * Extract text from PDF file
   * Note: Full PDF text extraction requires pdfjs-dist or similar
   * This is a placeholder that reads file metadata and prepares for OCR
   */
  static async extractTextFromPDF(pdfUri: string): Promise<string> {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // For now, return a marker that indicates PDF was processed
      // In production, use pdfjs-dist or similar library to extract actual text
      // This would require additional setup for React Native
      return `PDF_PROCESSED:${base64.substring(0, 100)}`;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  /**
   * Validate PDF file
   */
  static async validatePDFFile(pdfUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        return false;
      }

      // Check file size (max 10MB)
      if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
        throw new Error("PDF file is too large (max 10MB)");
      }

      return true;
    } catch (error) {
      console.error("Error validating PDF:", error);
      return false;
    }
  }

  /**
   * Process PDF and extract exam data
   * Returns structured data that can be used to populate form fields
   */
  static async processPDFForExamData(
    pdfUri: string
  ): Promise<Partial<OCRExtractedData> | null> {
    try {
      // Validate PDF first
      const isValid = await this.validatePDFFile(pdfUri);
      if (!isValid) {
        throw new Error("Invalid PDF file");
      }

      // Extract text from PDF
      const extractedText = await this.extractTextFromPDF(pdfUri);

      // Parse extracted text for exam-related fields
      // This is a basic implementation - in production, use more sophisticated parsing
      const data: Partial<OCRExtractedData> = {
        // These would be populated by actual PDF text extraction
        // For now, return empty to indicate PDF was processed
      };

      return data;
    } catch (error) {
      console.error("Error processing PDF:", error);
      return null;
    }
  }
}
