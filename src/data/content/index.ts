import type { ToolContent } from './types';
import { IMAGE_CONTENT } from './image';
import { QR_CONTENT } from './qr';

export const CONTENT: Record<string, ToolContent> = {
  ...IMAGE_CONTENT,
  ...QR_CONTENT,
};
