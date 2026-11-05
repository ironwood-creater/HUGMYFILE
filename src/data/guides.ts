// How-to guides. Each one answers a real everyday question and links to the tools that do the job.
// Strings may contain simple inline HTML (links, <strong>, <em>), like the tool content.

export type GuideBlock = { p: string } | { steps: string[] } | { list: string[] } | { tip: string };

export interface Guide {
  slug: string;
  /** The H1 and card title. */
  title: string;
  /** <title>, under 60 characters. */
  metaTitle: string;
  /** Meta description, 50–160 characters. */
  description: string;
  /** One line for guide cards. */
  summary: string;
  icon: string;
  published: string;
  updated: string;
  /** Tools this guide uses, most important first. */
  tools: string[];
  /** The short answer at the top, for people in a hurry. */
  quickAnswer: string;
  sections: { heading: string; blocks: GuideBlock[] }[];
  faqs: { q: string; a: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'reduce-pdf-size-on-iphone',
    title: 'How to reduce a PDF’s size on iPhone',
    metaTitle: 'How to Reduce a PDF’s Size on iPhone | HugMyFile',
    description: 'Make a PDF smaller on your iPhone in Safari, with no app and no upload. Step-by-step instructions, which level to pick and where the file is saved.',
    summary: 'Shrink a PDF in Safari in about a minute, with no app to install and nothing uploaded.',
    icon: 'Smartphone',
    published: '2026-11-05',
    updated: '2026-11-05',
    tools: ['compress-pdf', 'delete-pdf-pages', 'split-pdf'],
    quickAnswer:
      'Open <a href="/compress-pdf">Compress PDF</a> in Safari, tap <strong>Choose file</strong> and pick your PDF, choose a level, tap <strong>Compress PDF</strong> and then <strong>Download PDF</strong>. Safari saves the smaller file to the <strong>Downloads</strong> folder in the Files app. The PDF never leaves your iPhone.',
    sections: [
      {
        heading: 'Before you start',
        blocks: [
          { p: 'All you need is Safari (or any other browser) and the PDF saved on your iPhone. Nothing to install, and no account.' },
          { p: 'If the PDF is an email attachment or arrived in a chat app, save it first: open it, tap the <strong>Share</strong> button and choose <strong>Save to Files</strong>. It will then show up in the file picker.' },
        ],
      },
      {
        heading: 'Step by step',
        blocks: [
          {
            steps: [
              'Open Safari and go to the <a href="/compress-pdf">Compress PDF</a> page.',
              'Tap <strong>Choose file</strong>. Your iPhone opens a file picker (if a small menu appears first, choose the option to browse files). Find your PDF under <em>Recents</em>, <em>iCloud Drive</em>, <em>On My iPhone</em> or <em>Downloads</em>, and tap it.',
              'Pick a compression level. <strong>Light</strong> keeps the text selectable and links and form fields working. <strong>Medium</strong> and <strong>Strong</strong> save far more space on scans and photo-heavy files, but turn each page into a picture.',
              'Tap <strong>Compress PDF</strong> and wait a moment. Big scans can take a little longer on older iPhones, because all the work happens on the phone itself.',
              'Check the new size and tap <strong>Download PDF</strong>. If Safari asks whether to download the file, tap <strong>Download</strong>.',
              'To find the file, tap the downloads icon in Safari’s address bar, or open the <strong>Files</strong> app and go to <strong>Downloads</strong>. From there you can attach it to an email or share it.',
            ],
          },
        ],
      },
      {
        heading: 'Which level should I pick?',
        blocks: [
          {
            list: [
              '<strong>Light</strong>: for contracts, reports and other text documents that must stay searchable, or forms you still need to fill in. Savings are usually modest, because text PDFs are already compact.',
              '<strong>Medium</strong>: for scanned documents and PDFs full of photos. This is usually the best balance between size and readability.',
              '<strong>Strong</strong>: when the size limit is very tight and the document only needs to be read on a screen, not printed.',
            ],
          },
          { tip: 'If a level wouldn’t make your file smaller, the tool says so and offers your original instead of handing you a bigger file.' },
        ],
      },
      {
        heading: 'If the file is still too big',
        blocks: [
          {
            list: [
              'Try <strong>Medium</strong> or <strong>Strong</strong> if you started with Light. Scanned pages shrink the most.',
              'Remove pages nobody needs, such as blank pages or covers, with <a href="/delete-pdf-pages">Delete PDF Pages</a>, then compress again.',
              'Send the document in parts: <a href="/split-pdf">Split PDF</a> cuts it into smaller files by page range.',
              'If you made the PDF from photos, shrink the photos first with <a href="/compress-image">Compress Image</a> and rebuild the PDF with <a href="/jpg-to-pdf">JPG to PDF</a>.',
            ],
          },
        ],
      },
      {
        heading: 'Does it work on iPad, Android and computers?',
        blocks: [
          { p: 'Yes. The steps are the same in any modern browser. On Android, Chrome saves the file to your <strong>Downloads</strong> folder. On a computer you can also drag the PDF straight onto the page.' },
        ],
      },
    ],
    faqs: [
      { q: 'Do I need to install an app?', a: 'No. Compress PDF runs in Safari like any web page. There is nothing to install and no account to create.' },
      { q: 'Is my PDF uploaded anywhere?', a: 'No. The compression happens inside Safari on your iPhone. Your PDF is never sent to us or anyone else.' },
      { q: 'Why didn’t my PDF get smaller?', a: 'Some PDFs are already well optimized, and turning pages into pictures can even make text documents bigger. When that happens, the tool tells you and offers your original file.' },
      { q: 'Will I still be able to select and search the text?', a: 'With Light, yes. Medium and Strong turn each page into a picture, so text can no longer be selected, and links and form fields are removed.' },
    ],
  },
  {
    slug: 'take-passport-photo-at-home',
    title: 'How to take a passport photo at home',
    metaTitle: 'How to Take a Passport Photo at Home | HugMyFile',
    description: 'Take a passport or visa photo at home with your phone: light, background and pose, then crop it to 2×2 inch or 35×45 mm and print a sheet.',
    summary: 'Light, background, pose and the exact size, plus a printable sheet for any print shop.',
    icon: 'Camera',
    published: '2026-11-05',
    updated: '2026-11-05',
    tools: ['passport-photo-maker', 'compress-image-to-50kb', 'resize-image'],
    quickAnswer:
      'Stand in front of a plain, light wall facing a window, and ask someone to take the photo from about 1.5 meters (5 feet) away at eye level. Then open the <a href="/passport-photo-maker">Passport Photo Maker</a>, choose your size, line up the top of your head and your chin with the guide lines, and download the photo or a printable sheet. Check your country’s official rules first.',
    sections: [
      {
        heading: 'Check the official rules first',
        blocks: [
          { p: 'Every country and application sets its own rules: the photo size, how large your head must be, the background color, whether glasses are allowed and how recent the photo must be. Look up the requirements on the official government website for your passport or visa before you start.' },
          { p: 'Some online applications only accept a digital photo code from an approved photo booth or studio, so check for that too. The most common sizes are:' },
          {
            list: [
              '<strong>2×2 inch</strong> (51×51 mm, 600×600 pixels for online forms), used for US passports and visas.',
              '<strong>35×45 mm</strong>, the printed size used in the UK, for Schengen visas and in many other countries.',
              '<strong>33×48 mm</strong>, used for example for Chinese visas.',
            ],
          },
          { p: 'The Passport Photo Maker has these three sizes built in, plus custom sizes in pixels or millimeters.' },
        ],
      },
      {
        heading: 'Set up the light and background',
        blocks: [
          {
            list: [
              'Face a window during the day, so soft light falls evenly on your face. Avoid direct sun and ceiling lights, which cast shadows under the eyes and nose.',
              'Stand in front of a plain white or light gray wall. The tool doesn’t remove or replace backgrounds, so the wall you use is the background you get.',
              'Stand about half a meter (two feet) away from the wall, so your shadow doesn’t fall on it.',
            ],
          },
        ],
      },
      {
        heading: 'Take the photo',
        blocks: [
          {
            list: [
              'Ask someone else to take it. Selfies taken at arm’s length make the nose look bigger and the head tilt.',
              'Use the back camera at eye level, about 1.5 meters (5 feet) away. Zoom in a little rather than stepping closer, which keeps your face in natural proportion.',
              'Look straight at the camera with a neutral expression, mouth closed and eyes open. Keep your shoulders level and your hair away from your face.',
              'Take off glasses if your rules require it (many countries now do), and hats unless they are allowed for religious or medical reasons.',
              'Turn off beauty filters and portrait mode, which change your appearance or blur the background.',
              'Take several shots and keep the sharpest one.',
            ],
          },
        ],
      },
      {
        heading: 'Crop it to the exact size',
        blocks: [
          {
            steps: [
              'Open the <a href="/passport-photo-maker">Passport Photo Maker</a> and choose your photo.',
              'Under <strong>Photo size</strong>, pick the size your application asks for.',
              'Drag the photo and use <strong>Zoom</strong> until the top of your head sits on the upper dashed line and your chin on the lower one. Use <strong>Straighten</strong> if your head is tilted.',
              'If the photo looks dark, nudge <strong>Brightness</strong> and <strong>Contrast</strong> a little. Don’t overdo it: the photo must still look like you.',
              'If an online form gives a maximum file size, type it into <strong>Maximum file size</strong>.',
              'Press <strong>Create photo</strong>, then <strong>Download photo</strong>. You get a JPG with the exact pixel size.',
            ],
          },
        ],
      },
      {
        heading: 'Print it',
        blocks: [
          {
            steps: [
              'Under <strong>Printable sheet</strong>, choose <strong>4×6 inch photo paper</strong> or <strong>A4</strong>.',
              'Download the <strong>Sheet as JPG</strong> for a print shop or photo kiosk, or the <strong>Sheet as PDF</strong> for your own printer.',
              'Print at <strong>100%</strong> or <strong>actual size</strong>. “Fit to page” would change the photo size.',
              'Cut along the lines.',
            ],
          },
          { tip: 'A standard 4×6 inch print at a photo shop or pharmacy is usually much cheaper than a passport photo service, and the sheet holds several copies.' },
        ],
      },
    ],
    faqs: [
      { q: 'Will my photo definitely be accepted?', a: 'We can’t guarantee that. The tool makes the size, framing and file size easy to get right, but each authority has its own rules about background, lighting, expression and recency. Always check the official requirements.' },
      { q: 'Can I use a selfie?', a: 'It’s better not to. A phone held at arm’s length distorts the face slightly and makes it hard to keep your head straight. Ask someone to take the photo from a few steps away.' },
      { q: 'My wall isn’t white. What can I do?', a: 'Hang a plain white sheet or a large piece of white card flat behind you. The tool doesn’t change backgrounds, so a plain, evenly lit background matters.' },
      { q: 'Is my photo uploaded?', a: 'No. The photo is cropped and saved entirely in your browser, on your own device.' },
    ],
  },
  {
    slug: 'sign-pdf-without-printing',
    title: 'How to sign a PDF without printing it',
    metaTitle: 'How to Sign a PDF Without Printing It | HugMyFile',
    description: 'Sign a PDF on your phone or computer without printing or scanning: draw, type or upload your signature, place it, add the date and download it.',
    summary: 'Draw, type or upload your signature, put it on the line and download the signed PDF.',
    icon: 'PenLine',
    published: '2026-11-05',
    updated: '2026-11-05',
    tools: ['sign-pdf', 'signature-maker', 'fill-pdf-form'],
    quickAnswer:
      'Open <a href="/sign-pdf">Sign PDF</a>, choose your document, then draw or type your signature and press <strong>Place signature on the page</strong>. Drag it onto the signature line, add the date if needed, and press <strong>Save signed PDF</strong>. No printer, scanner or account, and the document stays on your device.',
    sections: [
      {
        heading: 'Step by step',
        blocks: [
          {
            steps: [
              'Open <a href="/sign-pdf">Sign PDF</a> and choose your PDF. On a computer you can also drag it onto the page.',
              'Create your signature. <strong>Draw</strong> it with your finger, mouse or stylus (pick the ink color and pen thickness), <strong>Type</strong> your name and choose one of four handwriting styles, or <strong>Upload</strong> a photo of your signature on white paper.',
              'Go to the page that needs your signature with the page arrows or thumbnails, then press <strong>Place signature on the page</strong>.',
              'Drag the signature onto the line. Resize it with the dot in its corner; on a computer, the arrow keys nudge it into place.',
              'Need more? <strong>Add name</strong> and <strong>Add date</strong> put your printed name and today’s date on the page, ready to drag into position. To sign another page, go to it and press <strong>Add signature</strong>.',
              'Press <strong>Save signed PDF</strong>, then <strong>Download PDF</strong>.',
            ],
          },
        ],
      },
      {
        heading: 'Make your signature look natural',
        blocks: [
          {
            list: [
              'Draw it slowly and fairly large, then shrink it on the page. Small, quick strokes look shaky.',
              'Black or dark blue ink looks most like a real pen.',
              'On a phone, turn it sideways for more room to draw.',
              'To use your real signature, sign a sheet of white paper with a dark pen, photograph it flat in good light, and choose <strong>Upload</strong>. The paper background becomes transparent.',
            ],
          },
        ],
      },
      {
        heading: 'Is this kind of signature valid?',
        blocks: [
          { p: 'Sign PDF adds a <strong>visual signature</strong>: an image of your signature on the page. Many everyday documents accept this, such as rental forms, school permission slips, delivery notes and simple agreements.' },
          { p: 'It is not a certified digital signature backed by a certificate authority. Some legal, financial or government documents require a qualified or certified electronic signature. If you’re unsure, ask the person or organization that sent you the document.' },
          { tip: 'Only create and use your own signature. Using someone else’s signature is illegal.' },
        ],
      },
      {
        heading: 'Save time next time',
        blocks: [
          { p: 'Make a clean, transparent picture of your signature once with the <a href="/signature-maker">Signature Maker</a> and keep it on your device. Next time, choose <strong>Upload</strong> and pick that file. HugMyFile itself never stores your signature.' },
          { p: 'If your PDF has fields to type into, fill them first with <a href="/fill-pdf-form">Fill PDF Form</a>, then sign the finished file. For PDFs without fields, <a href="/add-text-to-pdf">Add Text to PDF</a> lets you write anywhere on the page.' },
        ],
      },
    ],
    faqs: [
      { q: 'Can I sign a PDF on my phone?', a: 'Yes. Draw your signature with your finger, then drag it into place on the page. It works in Safari and Chrome.' },
      { q: 'Can I sign several pages?', a: 'Yes. Go to each page with the arrows or thumbnails and add your signature there. Duplicate copies an item on the same page.' },
      { q: 'Is my document or signature uploaded?', a: 'No. Everything happens in your browser. Your PDF and your signature never leave your device and aren’t saved anywhere.' },
      { q: 'Does the signed PDF have a watermark?', a: 'No. You download your document with your signature and nothing else added.' },
    ],
  },
  {
    slug: 'compress-photo-for-online-form',
    title: 'How to compress a photo to 20 KB (or any size) for an online form',
    metaTitle: 'How to Compress a Photo to 20 KB for a Form | HugMyFile',
    description: 'Many forms only accept photos under 20, 50 or 100 KB. Get under the limit without ruining the picture, including exact pixel sizes and signatures.',
    summary: 'Get a photo or signature under a strict KB limit without guesswork, even at an exact pixel size.',
    icon: 'Feather',
    published: '2026-11-05',
    updated: '2026-11-05',
    tools: ['compress-image-to-20kb', 'compress-image-to-50kb', 'passport-photo-maker', 'resize-image'],
    quickAnswer:
      'Open the matching tool, for example <a href="/compress-image-to-20kb">Compress to 20 KB</a>, add your photo, type the exact limit your form gives, choose JPG and press <strong>Compress to 20 KB</strong>. If the form also asks for exact pixel dimensions, use the <a href="/passport-photo-maker">Passport Photo Maker</a>’s custom pixel size, which crops, resizes and compresses in one go.',
    sections: [
      {
        heading: 'Read the form’s rules first',
        blocks: [
          {
            list: [
              '<strong>Maximum file size</strong>, such as “under 20 KB” or “50 KB max”.',
              '<strong>Minimum file size</strong>: some forms say “between 10 and 20 KB”. Aim just under the maximum.',
              '<strong>Pixel dimensions</strong>, such as 200×230 pixels for a photo or 140×60 for a signature.',
              '<strong>File type</strong>: almost always JPG (also written JPEG).',
            ],
          },
        ],
      },
      {
        heading: 'If only the file size matters',
        blocks: [
          {
            steps: [
              'Open <a href="/compress-image-to-20kb">Compress to 20 KB</a>, <a href="/compress-image-to-50kb">50 KB</a>, <a href="/compress-image-to-100kb">100 KB</a> or <a href="/compress-image-to-200kb">200 KB</a>.',
              'Add one or more photos, scans or signatures.',
              'Type the exact limit your form gives if it is different, for example 30.',
              'Choose <strong>JPG</strong> unless the form says otherwise.',
              'Press the compress button and download. Each file shows its final size.',
            ],
          },
          { p: 'The tool tries quality levels one by one and keeps the best version that fits. It only shrinks the pixel size when quality alone isn’t enough.' },
        ],
      },
      {
        heading: 'If the form also needs exact pixel dimensions',
        blocks: [
          {
            steps: [
              'Open the <a href="/passport-photo-maker">Passport Photo Maker</a> and choose your photo or signature.',
              'Under <strong>Photo size</strong>, choose <strong>Custom size in pixels</strong> and enter the width and height from the form.',
              'Drag and zoom until it’s framed well.',
              'Enter the limit under <strong>Maximum file size</strong>, press <strong>Create photo</strong> and download.',
            ],
          },
          { p: 'Already have a photo at the right pixel size? Then use a compress tool and tick <strong>Keep the exact pixel size</strong>, so only the quality changes.' },
        ],
      },
      {
        heading: 'Tips for very small files',
        blocks: [
          {
            list: [
              'Crop away empty background first. Fewer pixels leave more room for detail where it counts.',
              'For signatures, use dark ink on white paper, photographed in good light. A clean white background compresses far better.',
              'Always start from the original photo, not one you have already compressed. Every round of compression loses a little quality.',
              'A head-and-shoulders photo about 300–400 pixels wide fits comfortably under 20 KB and still looks clear.',
            ],
          },
          { tip: 'Is 20 KB counted as 20,000 or 20,480 bytes? Websites differ, so the tool aims for 20,000 bytes or less, which passes either way.' },
        ],
      },
    ],
    faqs: [
      { q: 'Will my photo still look good at 20 KB?', a: 'Usually yes. Faces and text stay clear at that size. Large landscape photos are reduced more, but a head-and-shoulders photo looks fine.' },
      { q: 'Why does it say the target is impossible?', a: 'If you ask to keep the exact pixel size, a very large image may not fit even at the lowest quality. Allow resizing, or choose a smaller pixel size first.' },
      { q: 'Can I do several photos at once?', a: 'Yes. Add as many as you like and download them one by one or together as a ZIP file.' },
      { q: 'Is my photo uploaded?', a: 'No. Everything happens in your browser, which makes it safe for ID photos and signatures.' },
    ],
  },
  {
    slug: 'copy-text-from-image',
    title: 'How to copy text from a photo or screenshot',
    metaTitle: 'How to Copy Text from a Photo or Screenshot | HugMyFile',
    description: 'Turn a photo, screenshot or scanned page into text you can copy and edit. Free text recognition in nine languages that runs on your own device.',
    summary: 'Turn photos, screenshots and scans into editable text in nine languages, right on your device.',
    icon: 'ScanText',
    published: '2026-11-05',
    updated: '2026-11-05',
    tools: ['image-to-text', 'pdf-to-text'],
    quickAnswer:
      'Open <a href="/image-to-text">Image to Text</a>, add your photo or screenshot, tick the language of the text, press <strong>Extract text</strong>, then <strong>Copy</strong> the result or <strong>Download .txt</strong>. For scanned PDFs, use <a href="/pdf-to-text">PDF to Text</a>.',
    sections: [
      {
        heading: 'Step by step',
        blocks: [
          {
            steps: [
              'Open <a href="/image-to-text">Image to Text</a> and add one or more images: photos, screenshots or scanned pages.',
              'Tick the language of the text. If the image mixes languages, tick each one.',
              'Press <strong>Extract text</strong>. The first time you use a language, your browser downloads its recognition data from HugMyFile (about 1–2 MB). Your image itself stays on your device.',
              'Read through the result and fix anything that came out wrong.',
              'Press <strong>Copy</strong> to paste the text elsewhere, or <strong>Download .txt</strong> to save it as a file.',
            ],
          },
          { p: 'It reads English, Spanish, French, German, Portuguese, Indonesian, Arabic, Hindi and Urdu.' },
        ],
      },
      {
        heading: 'Get the best results',
        blocks: [
          {
            list: [
              'Screenshots work best, because the letters are perfectly sharp.',
              'For photos of paper, hold the phone straight above the page in even light, without shadows or glare, and make sure the text is in focus.',
              'Crop away everything that isn’t text before you start.',
              'Small print needs a sharper, closer photo.',
              'Printed text works far better than handwriting, which is often only partly recognized.',
            ],
          },
          { tip: 'Text recognition is never perfect. Always double-check names, numbers and amounts before you use the text.' },
        ],
      },
      {
        heading: 'Text from a PDF',
        blocks: [
          { p: '<a href="/pdf-to-text">PDF to Text</a> reads the text layer of a typed PDF directly, which is fast and exact. For scanned pages without a text layer, it recognizes the text the same way Image to Text does.' },
        ],
      },
    ],
    faqs: [
      { q: 'Can it read handwriting?', a: 'Only partly. The recognition engine is built for printed text. Neat handwriting sometimes works, but expect mistakes.' },
      { q: 'Is my image uploaded?', a: 'No. Text recognition runs in your browser on your own device. Only the language data is downloaded, from HugMyFile itself.' },
      { q: 'Can I do several images at once?', a: 'Yes. Add several images and you get the text of each one, which you can copy or download together.' },
      { q: 'Does it keep tables and columns?', a: 'You get plain text. Line breaks are kept roughly, but tables and columns come out as lines of text.' },
    ],
  },
  {
    slug: 'combine-pdf-files-on-phone',
    title: 'How to combine PDF files on your phone',
    metaTitle: 'How to Combine PDF Files on Your Phone | HugMyFile',
    description: 'Merge several PDFs into one on iPhone or Android, put them in the right order and download a single file. No app, no upload and no watermark.',
    summary: 'Put several PDFs into one file on iPhone or Android, in the order you want.',
    icon: 'Combine',
    published: '2026-11-05',
    updated: '2026-11-05',
    tools: ['merge-pdf', 'jpg-to-pdf', 'reorder-pdf-pages', 'delete-pdf-pages'],
    quickAnswer:
      'Open <a href="/merge-pdf">Merge PDF</a> in your phone’s browser, tap <strong>Choose files</strong> and pick your PDFs, put them in order with the up and down arrows, tap <strong>Merge</strong> and then <strong>Download PDF</strong>.',
    sections: [
      {
        heading: 'Get the files onto your phone',
        blocks: [
          { p: 'PDFs that arrived by email or in a chat app need to be saved first. On iPhone, open the file, tap <strong>Share</strong> and choose <strong>Save to Files</strong>. On Android, tap the download or save option, and the file goes to your <strong>Downloads</strong> folder.' },
        ],
      },
      {
        heading: 'Step by step',
        blocks: [
          {
            steps: [
              'Open <a href="/merge-pdf">Merge PDF</a> in Safari or Chrome.',
              'Tap <strong>Choose files</strong> and pick your PDFs. If your phone only lets you pick one at a time, tap <strong>Add more</strong> for each next file.',
              'Put the files in order with the up and down arrows. The first file goes first; the × removes a file.',
              'Tap <strong>Merge</strong>. The button shows how many PDFs will be combined.',
              'Tap <strong>Download PDF</strong>. On iPhone it goes to <strong>Downloads</strong> in the Files app; on Android, to your Downloads folder.',
            ],
          },
          { p: 'Pages are copied exactly as they are, so text stays sharp and selectable.' },
        ],
      },
      {
        heading: 'Adding photos or screenshots',
        blocks: [
          { p: 'Photos can’t be merged directly, but <a href="/jpg-to-pdf">JPG to PDF</a> turns one or more photos or screenshots into PDF pages. Make that PDF first, then merge it with your other files.' },
        ],
      },
      {
        heading: 'Tidy up after merging',
        blocks: [
          {
            list: [
              'Change the order of individual pages with <a href="/reorder-pdf-pages">Reorder PDF Pages</a>.',
              'Remove pages you don’t need with <a href="/delete-pdf-pages">Delete PDF Pages</a>.',
              'Too big to email? Shrink it with <a href="/compress-pdf">Compress PDF</a>.',
            ],
          },
        ],
      },
    ],
    faqs: [
      { q: 'How many PDFs can I combine?', a: 'There’s no limit. Very large files can take longer on older phones, because the work happens on the phone itself.' },
      { q: 'Why can’t I add a protected PDF?', a: 'Password-protected PDFs can’t be opened here, and we never try to remove protection. Remove the file from the list to continue with the others.' },
      { q: 'Are my files uploaded?', a: 'No. The PDFs are combined in your browser and never leave your phone.' },
      { q: 'Does the merged PDF have a watermark?', a: 'No. You get your pages and nothing else.' },
    ],
  },
];

export const getGuide = (slug: string): Guide => {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) throw new Error(`Unknown guide: ${slug}`);
  return guide;
};

/** Guides that use a tool, for the tool page. */
export const guidesForTool = (toolSlug: string): Guide[] => GUIDES.filter((g) => g.tools.includes(toolSlug));

/** Minutes to read, at about 200 words a minute. */
export function readingMinutes(guide: Guide): number {
  const text = [guide.quickAnswer, ...guide.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap((b) => ('p' in b ? [b.p] : 'tip' in b ? [b.tip] : 'steps' in b ? b.steps : b.list))]), ...guide.faqs.flatMap((f) => [f.q, f.a])].join(' ');
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

export const formatGuideDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
