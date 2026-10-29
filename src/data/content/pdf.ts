import type { ToolContent } from './types';

export const PDF_CONTENT: Record<string, ToolContent> = {
  'merge-pdf': {
    intro: [
      'Combining several PDFs into one makes them easier to send, print and file: a contract with its appendices, a stack of scanned receipts, or chapters written by different people.',
      'Add your files, put them in the right order by dragging or with the arrow buttons, and download a single PDF. Pages are copied exactly as they are, so text stays sharp and selectable.',
    ],
    steps: [
      'Drop two or more PDF files into the box, or choose them from your device.',
      'Drag the files into the order you want (or use the up and down arrows).',
      'Press <strong>Merge</strong> to combine them.',
      'Download your merged PDF.',
    ],
    features: [
      'Merge as many PDFs as you like, of any size.',
      'Drag-and-drop ordering with keyboard- and touch-friendly arrow buttons.',
      'Page previews and page counts for each file.',
      'Original page quality: nothing is re-rendered or compressed.',
      'Protected or damaged files are detected and clearly flagged.',
    ],
    faqs: [
      { q: 'Is there a limit on how many PDFs I can merge?', a: 'No. Very large merges simply take a bit longer and use more memory on your device.' },
      { q: 'Will merging reduce the quality?', a: 'No. Pages are copied as they are, so text, images and vector graphics stay exactly the same.' },
      { q: 'Do links and form fields survive?', a: 'Page content and most links are kept. Fillable form fields from different files are not combined into one form, so fill in forms before merging.' },
      { q: 'Can I merge password-protected PDFs?', a: 'No. If a PDF is protected, we can’t open it and will tell you. We never try to remove protection.' },
      { q: 'Can I also reorder single pages?', a: 'Yes. After merging, open the result in <a href="/reorder-pdf-pages">Reorder PDF Pages</a> to move individual pages around.' },
    ],
  },
  'split-pdf': {
    intro: [
      'Sometimes you only need part of a PDF: one chapter for a colleague, a single invoice from a monthly statement, or each page as its own file for an online form.',
      'Split by ranges to get one file per range, separate every page into its own PDF, or tap the pages you want and extract them into a new document. Multiple results come back as a single ZIP.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Choose how to split: by ranges (like 1-3, 4-6), every page, or extract selected pages.',
      'Enter your ranges or tap the page thumbnails you need.',
      'Press the button and download your PDF or ZIP.',
    ],
    features: [
      'Three ways to split: ranges, single pages, or a custom selection.',
      'Readable page thumbnails to see what you are picking.',
      'Ranges can run backwards (5-3) or to the end (4-end).',
      'Lossless: pages are copied, not re-rendered.',
      'ZIP download when you create several files.',
    ],
    faqs: [
      { q: 'How do I write page ranges?', a: 'Separate them with commas, for example “1-3, 5, 8-end”. Each range becomes its own PDF.' },
      { q: 'Can I get every page as a separate file?', a: 'Yes, choose “Every page” and you will receive a ZIP with one PDF per page.' },
      { q: 'What is the difference between split and extract?', a: 'Splitting by ranges creates several files. Extracting puts the pages you select together into one new PDF.' },
      { q: 'Does splitting change my original file?', a: 'No. Your original stays untouched on your device; we create new files from it.' },
    ],
  },
  'compress-pdf': {
    intro: [
      'PDFs grow large for many reasons: full-resolution scans, big photos, or files that have been edited many times. This tool offers three levels of compression and explains honestly what each one does.',
      '<strong>Light</strong> keeps everything working (selectable text, links, bookmarks and form fields) and cleans up the file’s internals. <strong>Medium</strong> and <strong>Strong</strong> turn each page into a compressed picture, which can shrink scanned and image-heavy files dramatically, but text can no longer be selected and links and form fields are removed.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Pick a level. Start with Light if you need selectable text.',
      'Press <strong>Compress PDF</strong> and compare the new size.',
      'Download the smaller file, or keep your original if compression didn’t help.',
    ],
    features: [
      'Light mode keeps text, links and forms intact.',
      'Medium and Strong modes for big savings on scans and photo-heavy PDFs.',
      'Honest result: if the file wouldn’t get smaller, we say so and offer your original.',
      'Cancel at any time while pages are being processed.',
      'Your document stays on your device the whole time.',
    ],
    extra: {
      heading: 'Which level should I choose?',
      paragraphs: [
        'Text-based documents such as reports and contracts are usually already compact; Light gives a small cleanup and keeps everything selectable. Scanned documents and PDFs full of photos shrink the most with Medium. Strong is for when you only need to read the document on a screen and the file size limit is tight.',
      ],
    },
    faqs: [
      { q: 'Why did my PDF not get smaller?', a: 'Some PDFs are already well optimized, and turning pages into pictures can even make text documents bigger. When that happens, we tell you and offer your original file instead.' },
      { q: 'Why can’t I select text after Medium or Strong compression?', a: 'Those levels turn each page into an image to save space. That is why we explain the trade-off up front. Use Light if you need selectable text.' },
      { q: 'Will fillable forms still work?', a: 'With Light, yes. Medium and Strong turn pages into images, so form fields and links are removed.' },
      { q: 'Is it safe for confidential documents?', a: 'Yes. Compression happens entirely in your browser; your PDF is never uploaded.' },
      { q: 'Can I compress a protected PDF?', a: 'No. Protected PDFs can’t be opened here, and we never try to remove protection.' },
    ],
  },
  'rotate-pdf': {
    intro: [
      'Scanners and phone cameras love to save pages sideways or upside down. Rotating fixes the page orientation permanently, so it opens the right way for everyone.',
      'Turn individual pages with the arrows under each thumbnail, or rotate the whole document left or right in one click. Rotation is lossless: the page content itself isn’t changed.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Use the arrows under a page to turn it, or “Rotate all” for every page.',
      'Check the previews.',
      'Press <strong>Save rotated PDF</strong> and download it.',
    ],
    features: [
      'Rotate single pages or all pages at once, left or right.',
      'Live thumbnails show the result before you save.',
      'Lossless rotation that keeps text, links and quality.',
      'Works with mixed portrait and landscape documents.',
    ],
    faqs: [
      { q: 'Does rotating reduce quality?', a: 'No. We change the page’s orientation setting; the content itself stays exactly the same.' },
      { q: 'Can I rotate just one page?', a: 'Yes. Each page has its own rotate buttons.' },
      { q: 'Why does my PDF look rotated in one app but not another?', a: 'Some apps ignore the orientation setting of a page. Most modern readers respect it, including browsers and phone viewers.' },
      { q: 'Can I rotate by 90 degrees only?', a: 'PDF page rotation works in steps of 90 degrees, which covers sideways and upside-down pages.' },
    ],
  },
  'reorder-pdf-pages': {
    intro: [
      'Pages in the wrong order? Whether a scanner shuffled them or you need to move an appendix to the front, reordering takes a few drags.',
      'Every page appears as a thumbnail. Drag them into the right order or use the arrow buttons, which also work great on phones. You can reverse the whole document in one click, too.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Drag the page thumbnails into the right order, or use the arrows.',
      'Press <strong>Save new order</strong>.',
      'Download your reordered PDF.',
    ],
    features: [
      'Drag-and-drop page thumbnails.',
      'Arrow buttons for precise, touch-friendly moves.',
      'One-click “Reverse order” for back-to-front scans.',
      'Keeps text, links, bookmarks and forms.',
    ],
    faqs: [
      { q: 'Can I reorder pages on my phone?', a: 'Yes. Use the arrow buttons under each page if dragging is awkward on a small screen.' },
      { q: 'Will links inside the document still work?', a: 'Yes. Pages are reordered inside the same document, so links, bookmarks and form fields keep working.' },
      { q: 'How do I fix a document scanned back to front?', a: 'Press “Reverse order” and save.' },
      { q: 'Can I also delete pages here?', a: 'Use <a href="/delete-pdf-pages">Delete PDF Pages</a> to remove pages, then come back to reorder if needed.' },
    ],
  },
  'delete-pdf-pages': {
    intro: [
      'Blank pages from the scanner, duplicated sheets, or a page with information you don’t want to share: deleting pages gives you a cleaner, smaller PDF.',
      'Tap the pages you want to remove. They are clearly marked, and you can tap again to keep them. Everything else stays exactly as it was.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Tap each page you want to delete.',
      'Press the remove button.',
      'Download the new PDF.',
    ],
    features: [
      'Visual page picker with clear “will be removed” marks.',
      'Undo any choice with a single tap.',
      'Keeps the remaining pages untouched.',
      'Works on documents of any length.',
    ],
    faqs: [
      { q: 'Is deleting a page really permanent?', a: 'In the new file, yes. Your original PDF on your device isn’t changed.' },
      { q: 'Can I delete every page?', a: 'A PDF needs at least one page, so we keep at least one.' },
      { q: 'Does removing pages make the file smaller?', a: 'Usually, yes, especially when the removed pages contain images.' },
      { q: 'Is the content of deleted pages really gone?', a: 'Deleted pages are not included in the new file. For extra certainty with sensitive documents, you can also run the result through <a href="/compress-pdf">Compress PDF</a>, which rebuilds the file.' },
    ],
  },
  'add-page-numbers-to-pdf': {
    intro: [
      'Page numbers make long documents easy to navigate, print and discuss. Add them to any PDF in seconds and choose exactly how they look.',
      'Pick the corner or edge, a style such as “Page 3 of 12”, the text size and color, the first number, and which page to start on, so a cover page can stay clean.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Choose the position and style of the numbers.',
      'Set the first number and the page to start on, if needed.',
      'Press <strong>Add page numbers</strong> and download.',
    ],
    features: [
      'Six positions: top or bottom, left, center or right.',
      'Styles like 1, Page 1, 1 of 10 and Page 1 of 10.',
      'Custom start number and start page (skip covers and contents pages).',
      'Adjustable size, color and distance from the edge.',
      'Correct placement on rotated pages.',
    ],
    faqs: [
      { q: 'Can I skip the cover page?', a: 'Yes. Set “Start on page” to 2 and numbering begins on the second page.' },
      { q: 'Can numbering start at a number other than 1?', a: 'Yes. Set the first number to anything you like, for example to continue from another document.' },
      { q: 'Will the numbers be selectable text?', a: 'Yes, they are real text, so they can be searched and copied.' },
      { q: 'What about pages that are rotated?', a: 'We place numbers relative to how the page is displayed, so they appear upright in the right spot.' },
    ],
  },
  'jpg-to-pdf': {
    intro: [
      'Turn photos, scans and screenshots into one tidy PDF that is easy to send, print or upload. Each image becomes a page, in the order you choose.',
      'JPG and PNG files are placed into the PDF without being re-compressed, so nothing loses quality. Other formats like WebP or iPhone photos are converted automatically, and sideways phone photos are turned upright.',
    ],
    steps: [
      'Drop your images into the box (JPG, PNG, WebP and more).',
      'Drag them into the right order.',
      'Choose page size, orientation and margins.',
      'Press <strong>Create PDF</strong> and download it.',
    ],
    features: [
      'A4, Letter, or pages that match each image exactly.',
      'Automatic, portrait or landscape orientation.',
      'No margins, small or large margins.',
      'Lossless for JPG and PNG; automatic conversion for other formats.',
      'Phone photos are rotated correctly.',
    ],
    faqs: [
      { q: 'Will my photos lose quality?', a: 'JPG and PNG images are embedded as they are, so there is no extra quality loss.' },
      { q: 'Can I mix portrait and landscape photos?', a: 'Yes. With “Auto” orientation, each page turns to match its image.' },
      { q: 'How can I make the PDF smaller?', a: 'Compress large photos first with <a href="/compress-image">Compress Image</a>, or run the finished PDF through <a href="/compress-pdf">Compress PDF</a>.' },
      { q: 'Can I add iPhone HEIC photos?', a: 'If your browser can open HEIC files (Safari can), they are converted automatically. Otherwise convert them first with <a href="/heic-to-jpg">HEIC to JPG</a>.' },
    ],
  },
  'pdf-to-jpg': {
    intro: [
      'Need a page from a PDF as a picture for a presentation, a social post or a chat? This tool saves each page as a JPG image at the resolution you choose.',
      'One page downloads as a single JPG; several pages come back neatly packed in a ZIP file.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Choose the image quality: screen, standard or print resolution.',
      'Convert all pages or pick specific ones.',
      'Press <strong>Convert to JPG</strong> and download.',
    ],
    features: [
      '72, 150 or 300 DPI output.',
      'All pages or a custom selection like 1, 3-5.',
      'ZIP download for multiple pages.',
      'Fonts and vector graphics are rendered crisply.',
      'Cancel any time during conversion.',
    ],
    faqs: [
      { q: 'Which resolution should I choose?', a: '150 DPI is great for screens and documents. Choose 300 DPI for printing, or 72 DPI for the smallest files.' },
      { q: 'JPG or PNG?', a: 'JPG is smaller and ideal for pages with photos. For text and diagrams, <a href="/pdf-to-png">PDF to PNG</a> keeps edges perfectly crisp.' },
      { q: 'Can I convert only one page?', a: 'Yes. Choose “Choose pages” and type the page number.' },
      { q: 'Does it work with scanned PDFs?', a: 'Yes. Every page is rendered as you would see it in a PDF reader.' },
    ],
  },
  'pdf-to-png': {
    intro: [
      'PNG is lossless, which makes it the best choice when a PDF page contains text, line drawings, charts or diagrams that must stay perfectly sharp.',
      'Choose a resolution, convert all pages or just a few, and download PNG images individually or as a ZIP.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Choose screen, standard or print resolution.',
      'Select all pages or specific pages.',
      'Press <strong>Convert to PNG</strong> and download.',
    ],
    features: [
      'Lossless PNG images with crisp text and lines.',
      'Resolution up to 300 DPI.',
      'Page selection and ZIP download.',
      'Rendering happens on your device.',
    ],
    faqs: [
      { q: 'Why are PNG files larger than JPG?', a: 'PNG keeps every pixel exactly. For photo-heavy pages, JPG gives smaller files.' },
      { q: 'Is the background transparent?', a: 'No. Pages are rendered on white, just like a printed page.' },
      { q: 'Can I use the images in slides?', a: 'Absolutely. PNG at 150 DPI is a good fit for presentations.' },
      { q: 'Is my PDF uploaded?', a: 'No. The pages are rendered right in your browser.' },
    ],
  },
  'sign-pdf': {
    intro: [
      'Sign a PDF without printing, scanning or creating an account. Draw your signature with a mouse, finger or stylus, type it in a handwriting style, or upload a picture of it, then place it exactly where it belongs.',
      'Add your printed name and today’s date with one click, drag everything into position, resize with the corner handle, and download the signed document. This adds a visual signature. It is not a certified digital signature.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Create your signature: draw it, type it, or upload an image.',
      'Press <strong>Place signature</strong>, then drag and resize it on the right page. Use the page thumbnails to switch pages.',
      'Optionally add your name and the date.',
      'Press <strong>Save signed PDF</strong> and download it.',
    ],
    features: [
      'Draw, type (four handwriting styles) or upload your signature.',
      'Place it on any page with drag, resize and keyboard nudging.',
      'One-click name and date fields.',
      'Undo, duplicate and delete items.',
      'No watermark and no account.',
    ],
    extra: {
      heading: 'Visual signature vs. certified digital signature',
      paragraphs: [
        'This tool places an image of your signature on the page, which is what most everyday forms and agreements need. It is not a certified digital signature backed by a certificate authority. If your document requires a qualified or certified electronic signature, use a service that provides one. Only create and use your own signature. Using someone else’s signature is illegal.',
      ],
    },
    faqs: [
      { q: 'Is this signature legally binding?', a: 'Many everyday agreements accept a visual signature, but rules differ by country and document type. This tool adds a visual signature, not a certified digital signature. If in doubt, ask the person or organization requesting your signature.' },
      { q: 'Can I sign on my phone?', a: 'Yes. Draw your signature with your finger, then drag it into place on the page.' },
      { q: 'Is my signature stored?', a: 'No. Your signature exists only in this browser tab while you use it. Nothing is uploaded or saved.' },
      { q: 'Can I sign multiple pages?', a: 'Yes. Switch pages with the thumbnails and place your signature (or a duplicate) on each page.' },
      { q: 'Can I sign for someone else?', a: 'No. Only create and use your own signature. Using someone else’s signature is illegal.' },
    ],
  },
  'add-text-to-pdf': {
    intro: [
      'Fill in a form that has no fields, add a note to a document, cover up an old address or highlight a paragraph: all without special software.',
      'Add text boxes in Noto Sans with your choice of size and color, place images, draw boxes and circles, highlight lines, and use whiteout to cover content. Drag everything into position and undo any step. Your original text isn’t edited; new content is added on top.',
    ],
    steps: [
      'Drop your PDF into the box.',
      'Choose a tool: text, image, box, circle, highlight or whiteout.',
      'Drag the item into place and resize it with the corner dot. Edit text and colors in the side panel.',
      'Use the page thumbnails to work on other pages.',
      'Press <strong>Save PDF</strong> and download your edited file.',
    ],
    features: [
      'Text boxes with size, color and bold, including accented letters and Greek or Cyrillic text.',
      'Images, boxes, circles, highlights and whiteout.',
      'Drag, resize, nudge with arrow keys, duplicate and undo.',
      'Multi-page editing with page thumbnails.',
      'Clear notice for scripts we can’t place correctly yet (like Arabic, Urdu or Hindi).',
    ],
    extra: {
      heading: 'Good to know',
      paragraphs: [
        'Whiteout covers content visually by drawing a white box on top. The original content is still inside the file underneath, so don’t rely on whiteout to remove sensitive information. Writing systems that need special shaping, such as Arabic, Urdu and Hindi, are not supported yet; we show a message instead of producing broken text.',
      ],
    },
    faqs: [
      { q: 'Can I edit the existing text in my PDF?', a: 'No. This tool adds new content on top of the page. To “replace” text, cover it with whiteout and type new text over it.' },
      { q: 'Which languages can I type?', a: 'Latin-based languages such as English, Spanish, French, German, Portuguese and Indonesian (with all accents), plus Greek, Cyrillic and Vietnamese. Arabic, Urdu, Hindi and other scripts that need shaping are not supported yet.' },
      { q: 'Does whiteout delete the content underneath?', a: 'No, it only covers it. The hidden content remains inside the file. Never use whiteout to redact confidential information.' },
      { q: 'Can I undo mistakes?', a: 'Yes. Press Undo to step back through your changes.' },
      { q: 'Is the PDF uploaded?', a: 'No. Editing and saving both happen in your browser.' },
    ],
  },
  'fill-pdf-form': {
    intro: [
      'Many official forms come as fillable PDFs, but not every device has a reader that handles them well. Open the form here and we list every fillable field for you: text boxes, checkboxes, radio buttons and dropdowns.',
      'Type your answers, tick the boxes, then download the completed PDF. If you like, flatten the form so the answers become part of the page and can’t be changed.',
    ],
    steps: [
      'Drop your fillable PDF into the box.',
      'Fill in the fields we find. Checkboxes, radio buttons and dropdowns are supported.',
      'Choose whether to flatten the form.',
      'Press <strong>Save filled PDF</strong> and download it.',
    ],
    features: [
      'Detects text fields, checkboxes, radio buttons, dropdowns and lists.',
      'Supports accented Latin letters (English, Spanish, French, German, Portuguese, Indonesian and more).',
      'Optional flattening to lock your answers in.',
      'Read-only fields are respected.',
      'Clear guidance for PDFs without fields or with XFA forms.',
    ],
    faqs: [
      { q: 'What if my PDF has no fillable fields?', a: 'We’ll tell you, and you can type anywhere on the page with <a href="/add-text-to-pdf">Add Text to PDF</a> instead.' },
      { q: 'What is an XFA form?', a: 'XFA is an older, special form format that browsers can’t fill in. If your PDF uses it, try typing on top with Add Text to PDF, or use the software the form was made for.' },
      { q: 'What does “flatten” mean?', a: 'Flattening turns your answers into regular page content. The form can no longer be edited, which is often required when submitting final documents.' },
      { q: 'Can I sign the form too?', a: 'Yes. Save the filled form, then open it in <a href="/sign-pdf">Sign PDF</a> to add your signature.' },
      { q: 'Are my answers stored anywhere?', a: 'No. Your answers stay in your browser and are only written into the PDF you download.' },
    ],
  },
};
