import { expose } from '../workerHost';
import { encodePixels, processImage, type PixelSource, type ProcessRequest } from './engine';
import type { OutputFormat } from './formats';

expose({
  async process(req: ProcessRequest, ctx) {
    const result = await processImage(req, ctx);
    return { result, transfer: [result.buffer] };
  },
  async encodePixels(req: { pixels: PixelSource; format: OutputFormat; quality: number; targetBytes?: number }, ctx) {
    const result = await encodePixels(req.pixels, req.format, req.quality, req.targetBytes, ctx);
    return { result, transfer: [result.buffer] };
  },
});
