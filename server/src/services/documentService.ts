import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { config } from '../config/index.js';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPEG, PNG, and WebP are accepted.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter,
});

export class DocumentService {
  /**
   * Extracts text content from a stored PDF or text-containing document.
   */
  public static async extractDocumentText(
    filePath: string,
    mimeType: string
  ): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text ? data.text.trim() : '';
      }

      // For scanned images or text files
      if (mimeType.startsWith('image/')) {
        // Return notice that OCR can be assisted via multimodal AI
        return `[Scanned Image Document: ${path.basename(filePath)}]`;
      }

      return '';
    } catch (error) {
      console.warn(`[DocumentService] Error extracting text from ${filePath}:`, (error as Error).message);
      return '';
    }
  }

  /**
   * Safely deletes a document file from disk.
   */
  public static deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`[DocumentService] Failed to delete file ${filePath}:`, err);
    }
  }
}

