import type { ToolContent } from './types';

export const SIGNATURE_CONTENT: Record<string, ToolContent> = {
  'signature-maker': {
    intro: [
      'A clean digital copy of your signature is handy for documents, email footers, letters and forms. Draw it with your mouse, finger or stylus for a natural look, or type your name and pick one of four handwriting styles.',
      'We trim away the empty space around it and save it with a transparent background, so it sits nicely on any page. Drawn signatures can also be downloaded as SVG, a vector format that stays perfectly smooth at any size.',
    ],
    steps: [
      'Choose Draw, Type or Upload.',
      'Draw your signature in the box (use Undo to remove the last stroke), or type your name and pick a style.',
      'Pick an ink color, and for drawings, a pen thickness.',
      'Press <strong>Create my signature</strong>, then download it as a transparent PNG or SVG.',
    ],
    features: [
      'Smooth, pressure-like lines that follow your hand.',
      'Undo the last stroke or clear and start again.',
      'Four handwriting fonts for typed signatures (Latin letters with accents).',
      'Black, blue, green or any custom ink color, plus adjustable thickness.',
      'Automatic trimming and a transparent background.',
      'SVG download for drawn signatures.',
    ],
    extra: {
      heading: 'Use your signature responsibly',
      paragraphs: [
        'Only create and use your own signature. Using someone else’s signature is illegal. A picture of a signature is a visual signature, not a certified digital signature, so check what your recipient accepts for important documents.',
      ],
    },
    faqs: [
      { q: 'Is my signature saved anywhere?', a: 'No. It is created in your browser and only exists on your device until you download it. We never see it.' },
      { q: 'Why is the background transparent?', a: 'So the signature looks natural on top of any document, without a white box around it.' },
      { q: 'What is the SVG file for?', a: 'SVG is a vector format. It stays razor-sharp at any size, which is great for design tools and print. It is available for drawn signatures.' },
      { q: 'Can I add my signature to a PDF?', a: 'Yes. Use <a href="/sign-pdf">Sign PDF</a> to draw, type or upload your signature and place it on any page.' },
      { q: 'My signature photo has a gray background. What can I do?', a: 'Use the Upload tab and keep “Make the white paper background transparent” switched on. A bright, evenly lit photo of dark ink on white paper works best.' },
    ],
  },
};
