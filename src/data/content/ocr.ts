import type { ToolContent } from './types';

export const OCR_CONTENT: Record<string, ToolContent> = {
  'image-to-text': {
    intro: [
      'Retyping text from a photo is slow and error-prone. Image to Text uses optical character recognition (OCR) to read the words in your pictures and turns them into text you can edit, copy and save.',
      'It works with screenshots, photos of documents, book pages, receipts and whiteboards in English, Spanish, French, German, Portuguese, Indonesian, Arabic, Hindi and Urdu. The recognition engine is the open-source Tesseract, running entirely inside your browser.',
    ],
    steps: [
      'Drop one or more images into the box.',
      'Choose the language (or languages) of the text.',
      'Press <strong>Extract text</strong> and watch the progress for each image.',
      'Check and edit the result, then copy it or download it as a .txt file.',
    ],
    features: [
      'Nine languages, and you can combine several for mixed documents.',
      'Bulk mode: read many images in one go.',
      'Editable results with one-click copy and .txt download.',
      'Phone photos are straightened according to their rotation info first.',
      'Language data is downloaded from our own site only for the languages you pick.',
      'Your images are never uploaded.',
    ],
    extra: {
      heading: 'Tips for better results',
      paragraphs: [
        'Use a sharp, well-lit image with the text running straight across. Crop away busy backgrounds and make sure the text is large enough to read comfortably. Handwriting is much harder for OCR than printed text, so expect mistakes with handwritten notes.',
      ],
    },
    faqs: [
      { q: 'How accurate is the text recognition?', a: 'For clear printed text it is usually very accurate. Blurry photos, unusual fonts, low contrast and handwriting reduce accuracy, so always double-check important details like names and numbers.' },
      { q: 'Which languages are supported?', a: 'English, Spanish, French, German, Portuguese, Indonesian, Arabic, Hindi and Urdu. Select every language that appears in your image.' },
      { q: 'Is this an AI service?', a: 'No. It uses Tesseract, a classic open-source OCR engine, running locally in your browser. No AI model or online service is involved.' },
      { q: 'Why does the first run take longer?', a: 'The first time, your browser downloads the recognition engine and the language data from our site. After that, your browser usually has them cached.' },
      { q: 'Can I extract text from a PDF?', a: 'Yes, use <a href="/pdf-to-text">PDF to Text</a>. It reads typed PDFs instantly and runs OCR on scanned pages.' },
    ],
  },
  'pdf-to-text': {
    intro: [
      'Get the text out of any PDF so you can edit, quote, translate or search it. Typed PDFs already contain their text, so we read it directly: fast and exact. Scanned PDFs are just pictures of pages, so we run OCR on those pages automatically.',
      'You see the result page by page, can correct anything that was misread, and can copy it or download it as a plain .txt file.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Choose the language of the text (needed for scanned pages).',
      'Press <strong>Extract text</strong>. Each page is read in turn, with progress shown.',
      'Edit if needed, then copy or download the .txt file.',
    ],
    features: [
      'Automatic choice between the PDF’s own text layer and OCR, per page.',
      'Option to force OCR on every page.',
      'Nine OCR languages, combinable for mixed documents.',
      'Page-by-page results with labels, plus a combined .txt download.',
      'Cancel at any time and keep the pages already read.',
    ],
    faqs: [
      { q: 'Why is my scanned PDF slower than a typed one?', a: 'Typed PDFs contain real text that can be read instantly. Scanned pages are images, so each one has to be recognized with OCR, which takes a few seconds per page.' },
      { q: 'Will the layout be kept?', a: 'You get plain text with line breaks. Columns, tables and formatting are not recreated.' },
      { q: 'Can I extract text from a password-protected PDF?', a: 'No. Protected PDFs can’t be opened here, and we never try to remove protection.' },
      { q: 'What does “Always use OCR” do?', a: 'It ignores any text stored in the PDF and reads every page from its picture. That can help when a PDF’s embedded text is garbled.' },
      { q: 'Is my PDF uploaded for OCR?', a: 'No. Everything, including the OCR, runs in your browser.' },
    ],
  },
};
