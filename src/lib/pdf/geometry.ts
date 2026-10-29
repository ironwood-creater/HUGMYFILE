// Converts between the visual page space (what you see on screen, top-left
// origin) and PDF user space (bottom-left origin, before /Rotate is applied).

export interface PageBox {
  /** Crop box in PDF user space. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Page /Rotate, clockwise, normalized to 0/90/180/270. */
  rotation: number;
}

export function normalizeRotation(angle: number): number {
  const r = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  return r;
}

export function visualSize(box: PageBox): { width: number; height: number } {
  return box.rotation % 180 === 0 ? { width: box.width, height: box.height } : { width: box.height, height: box.width };
}

/** Maps a visual point (top-left origin, y down) to PDF user space. */
export function toPdf(box: PageBox, vx: number, vy: number): { x: number; y: number } {
  const { x, y, width: w, height: h } = box;
  switch (box.rotation) {
    case 90:
      return { x: x + vy, y: y + vx };
    case 180:
      return { x: x + w - vx, y: y + vy };
    case 270:
      return { x: x + w - vy, y: y + h - vx };
    default:
      return { x: x + vx, y: y + h - vy };
  }
}
