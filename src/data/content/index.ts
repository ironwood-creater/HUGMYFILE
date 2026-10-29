import type { ToolContent } from './types';
import { IMAGE_CONTENT } from './image';
import { QR_CONTENT } from './qr';
import { PDF_CONTENT } from './pdf';
import { SIGNATURE_CONTENT } from './signature';
import { OCR_CONTENT } from './ocr';

export const CONTENT: Record<string, ToolContent> = {
  ...IMAGE_CONTENT,
  ...QR_CONTENT,
  ...PDF_CONTENT,
  ...SIGNATURE_CONTENT,
  ...OCR_CONTENT,
};
