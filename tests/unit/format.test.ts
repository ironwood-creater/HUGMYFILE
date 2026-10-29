import { describe, expect, it } from 'vitest';
import { baseName, formatBytes, sizeChange, uniqueNames, withExt } from '../../src/lib/format';

describe('format helpers', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(150 * 1024)).toBe('150 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
  it('describes size changes', () => {
    expect(sizeChange(1000, 400)).toBe('60% smaller');
    expect(sizeChange(1000, 1500)).toBe('50% larger');
  });
  it('builds safe file names', () => {
    expect(baseName('holiday.photo.JPG')).toBe('holiday.photo');
    expect(withExt('scan.png', 'jpg', '-compressed')).toBe('scan-compressed.jpg');
    expect(baseName('a/b:c.png')).toBe('a_b_c');
  });
  it('makes names unique for ZIP files', () => {
    expect(uniqueNames(['a.jpg', 'A.jpg', 'b.jpg', 'a.jpg'])).toEqual(['a.jpg', 'A (2).jpg', 'b.jpg', 'a (3).jpg']);
  });
});
