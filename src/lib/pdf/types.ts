// Shared types for PDF tools. Coordinates of overlays are in PDF points in the
// page's *visual* space: origin at the top-left of the page as displayed
// (after the page's own rotation), x to the right, y down.

export interface PageInfo {
  /** Visual width/height in points (rotation applied). */
  width: number;
  height: number;
  rotation: number;
}

export interface DocInfo {
  pages: PageInfo[];
}

interface Box {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type OverlayItem =
  | (Box & { kind: 'text'; text: string; size: number; color: string; bold: boolean; lineHeight: number })
  | (Box & { kind: 'image'; bytes: Uint8Array; format: 'png' | 'jpg' })
  | (Box & { kind: 'rect' | 'ellipse'; fill: string | null; stroke: string | null; strokeWidth: number; opacity: number })
  | (Box & { kind: 'highlight'; color: string })
  | (Box & { kind: 'whiteout' });

export type NumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

export interface PageNumberOptions {
  position: NumberPosition;
  /** Template using {n} and {total}, e.g. "Page {n} of {total}". */
  format: string;
  size: number;
  startAt: number;
  /** First page (1-based) that gets a number. */
  fromPage: number;
  margin: number;
  color: string;
}

export interface ImageToPdfOptions {
  size: 'a4' | 'letter' | 'fit';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: number;
}

export interface ImageInput {
  bytes: Uint8Array;
  kind: 'jpg' | 'png';
}

export type FieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'optionlist' | 'other';

export interface FieldInfo {
  name: string;
  type: FieldType;
  value: string | boolean | string[];
  options: string[];
  multiline: boolean;
  maxLength?: number;
  readOnly: boolean;
  multiSelect: boolean;
}

export interface FormInfo {
  fields: FieldInfo[];
  xfa: boolean;
}

export type FieldValues = Record<string, string | boolean | string[]>;
