// Which characters can be written into PDFs. We embed Noto Sans (SIL OFL) in
// these subsets. pdf-lib draws glyphs one after another without "shaping", so
// scripts that need shaping (Arabic, Urdu, Hindi and other Indic scripts, Thai…)
// would come out broken; we refuse them with a friendly message instead.

export const FONT_SUBSETS = ['latin', 'latin-ext', 'greek', 'cyrillic', 'vietnamese'] as const;
export type FontSubset = (typeof FONT_SUBSETS)[number];

// Unicode ranges of the @fontsource/noto-sans subset files we ship.
const RANGES: Record<FontSubset, string> = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  greek: 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  vietnamese: 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
};

const parsed: [FontSubset, [number, number][]][] = FONT_SUBSETS.map((s) => [
  s,
  RANGES[s].split(',').map((part) => {
    const [a, b] = part.replace('U+', '').split('-');
    return [parseInt(a!, 16), parseInt(b ?? a!, 16)] as [number, number];
  }),
]);

/** Scripts that need text shaping or right-to-left layout. */
const COMPLEX = /[֐-ࣿऀ-෿฀-໿ༀ-࿿က-႟ក-៿יִ-﷿ﹰ-﻿]/;

export function subsetFor(codePoint: number): FontSubset | null {
  for (const [subset, ranges] of parsed) {
    for (const [a, b] of ranges) if (codePoint >= a && codePoint <= b) return subset;
  }
  return null;
}

export type TextProblem = null | 'complex-script' | 'unsupported-characters';

/** Checks whether text can be written into a PDF with our fonts. */
export function checkText(text: string): TextProblem {
  if (COMPLEX.test(text)) return 'complex-script';
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp === 10 || cp === 13 || cp === 9) continue;
    if (!subsetFor(cp)) return 'unsupported-characters';
  }
  return null;
}

/** Form fields use one font per field, so only the Latin subset is used there. */
export function checkFormText(text: string): TextProblem {
  const base = checkText(text);
  if (base) return base;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp === 10 || cp === 13 || cp === 9) continue;
    if (subsetFor(cp) !== 'latin') return 'unsupported-characters';
  }
  return null;
}

export const TEXT_PROBLEM_MESSAGE: Record<Exclude<TextProblem, null>, string> = {
  'complex-script':
    'Arabic, Urdu, Hindi and similar scripts are not supported yet. We can’t place them into PDFs correctly, so please use Latin, Greek or Cyrillic letters for now.',
  'unsupported-characters':
    'Some characters (for example emoji, or Chinese, Japanese and Korean text) are not supported yet. Please remove them to continue.',
};

export const FORM_TEXT_PROBLEM_MESSAGE: Record<Exclude<TextProblem, null>, string> = {
  'complex-script': TEXT_PROBLEM_MESSAGE['complex-script'],
  'unsupported-characters':
    'Form fields support Latin letters, including accents used in English, Spanish, French, German, Portuguese and Indonesian. Some characters you typed are not supported yet.',
};

/** Splits text into runs that each use one font subset. */
export function splitRuns(text: string): { subset: FontSubset; text: string }[] {
  const runs: { subset: FontSubset; text: string }[] = [];
  for (const ch of text) {
    const subset = subsetFor(ch.codePointAt(0)!) ?? 'latin';
    const current = runs[runs.length - 1];
    if (current && current.subset === subset) current.text += ch;
    else runs.push({ subset, text: ch });
  }
  return runs;
}
