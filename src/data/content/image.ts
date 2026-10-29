import type { ToolContent } from './types';

export const IMAGE_CONTENT: Record<string, ToolContent> = {
  'compress-image': {
    intro: [
      'Big photos slow down emails, eat up storage and get rejected by upload forms. This compressor makes JPG, PNG, WebP and AVIF images lighter while keeping them looking good, and it does all the work inside your browser.',
      'You stay in control: slide the quality, choose to keep the format or switch to a more efficient one, and compare the size before and after. If your image is already as small as it can sensibly get, we tell you and hand back the original instead of a bigger file.',
    ],
    steps: [
      'Drop a photo into the box, click to choose one, or paste it with Ctrl+V / Cmd+V.',
      'Pick a quality. Around 75% keeps photos crisp while saving a lot of space.',
      'Optionally choose a different format: WebP and AVIF are usually much smaller than JPG.',
      'Press <strong>Compress image</strong>, check the new size, and download your lighter file.',
    ],
    features: [
      'Works with JPG, PNG, WebP and AVIF, and also opens GIF and BMP files.',
      'Smart PNG compression reduces the number of colors (keeping transparency) for much smaller PNG files.',
      'Photos stay upright: camera rotation info is applied before compressing.',
      'Location and camera data (EXIF) are removed from the compressed copy, which is good for privacy.',
      'No file-size cap, no daily limit, no watermark and no account.',
    ],
    extra: {
      heading: 'Which quality should I pick?',
      paragraphs: [
        'For photos you plan to share online, 70–80% is hard to tell apart from the original. Go down to 50–60% when size matters more than fine detail, for example for attachments. Screenshots with text often look best as PNG with 256 colors, or as WebP at 80% or more.',
      ],
    },
    faqs: [
      { q: 'Will compressing my photo reduce its quality?', a: 'Lossy formats like JPG, WebP and AVIF trade a little invisible detail for a much smaller file. At the default 75% most people can’t see a difference. You can always compare and try again with a higher setting.' },
      { q: 'Why did I get my original file back?', a: 'If re-compressing would make the file the same size or bigger (this happens with images that are already well optimized), we keep your original and let you know. Try a lower quality or the WebP or AVIF format for further savings.' },
      { q: 'Is my image uploaded anywhere?', a: 'No. The image is read and compressed by your own browser, using code that runs on your device. Nothing is sent to a server, so it even works for private or sensitive pictures.' },
      { q: 'Can I compress many images at once?', a: 'Yes. Use the <a href="/bulk-image-compressor">bulk image compressor</a> to drop a whole batch, see the savings for each file and download everything as one ZIP.' },
      { q: 'What is the difference between WebP and AVIF?', a: 'Both are modern formats that are usually smaller than JPG at the same visual quality. WebP is supported almost everywhere and encodes quickly. AVIF is often even smaller but takes longer to create and a few older apps can’t open it yet.' },
    ],
  },

  'compress-image-to-20kb': {
    intro: [
      'Exam portals, scholarship sites and government forms often accept only tiny files, and 20 KB is one of the strictest limits around. Getting a photo or signature that small by hand means endless trial and error with quality settings.',
      'This page does the trial and error for you. It tries quality levels one by one, keeps the best version that fits, and only shrinks the pixel size if it really has to. The result is guaranteed to land under your limit, or you get a clear explanation of why it can’t.',
    ],
    steps: [
      'Add one or more photos, scans or signatures.',
      'Leave the limit at 20 KB, or type the exact number your form asks for.',
      'Choose JPG for maximum compatibility, or WebP if the form accepts it.',
      'Press <strong>Compress to 20 KB</strong> and download the result, which shows its final size.',
    ],
    features: [
      'Automatic quality search that always finishes below the limit you set.',
      'Gently reduces the pixel size only when quality alone isn’t enough.',
      'Option to keep the exact pixel dimensions when a form demands a fixed size.',
      'Aims a little below the limit, so it passes whether the form counts 1 KB as 1000 or 1024 bytes.',
      'Handles many files at once, with a ZIP download.',
    ],
    extra: {
      heading: 'Tips for very small files',
      paragraphs: [
        'Crop away empty background before compressing: fewer pixels leave more room for detail where it counts. For signatures, a white background and dark ink compress far better than a photo of paper taken in dim light.',
      ],
    },
    faqs: [
      { q: 'Will my photo still be recognizable at 20 KB?', a: 'Usually yes. A head-and-shoulders photo of about 300–400 pixels wide fits comfortably under 20 KB with good quality. Large landscape photos are reduced more, but faces and text stay clear.' },
      { q: 'My form also requires exact dimensions. What should I do?', a: 'First resize the photo to the required size with our <a href="/resize-image">image resizer</a> or <a href="/passport-photo-maker">passport photo maker</a>, then tick “Keep the exact pixel size” here so only the quality changes.' },
      { q: 'Why does it say the target is impossible?', a: 'If you ask to keep the exact pixel size, a very large image may not fit in 20 KB even at the lowest quality. Allow resizing, or choose a smaller pixel size first.' },
      { q: 'Is 20 KB counted as 20,000 or 20,480 bytes?', a: 'Different websites count differently. We aim for 20,000 bytes or less, which passes either way.' },
      { q: 'Are my documents uploaded?', a: 'No. Everything happens in your browser on your device, which makes it safe for ID photos and signatures.' },
    ],
  },
  'compress-image-to-50kb': {
    intro: [
      'Fifty kilobytes is a common ceiling for profile pictures, job applications and many visa and admission forms. It is small enough for fast uploads but still leaves room for a clear, natural-looking photo.',
      'Drop your image and we will search for the highest quality that fits under 50 KB. If your photo is a large camera original, we also scale it down carefully, because a slightly smaller sharp image looks far better than a full-size blurry one.',
    ],
    steps: [
      'Choose the photo you need to submit (you can add several).',
      'Check the limit: it starts at 50 KB, but you can type any number.',
      'Pick JPG (accepted everywhere) or WebP.',
      'Press <strong>Compress to 50 KB</strong>, then download the file and upload it to your form.',
    ],
    features: [
      'Best-quality result that is always under the size you set.',
      'Clear before and after sizes and the final pixel dimensions.',
      'Transparent PNGs are placed on a white background automatically for JPG output.',
      'Camera orientation is applied, so photos never end up sideways.',
      'Free, unlimited and private: your photo never leaves your device.',
    ],
    faqs: [
      { q: 'What kind of photo fits best in 50 KB?', a: 'Portraits and documents work very well. A typical result is around 500–800 pixels wide with crisp detail. Busy landscapes need a bit more reduction.' },
      { q: 'Can I keep the original width and height?', a: 'Yes. Tick “Keep the exact pixel size” and we will only lower the quality. For very large photos this can look rough, so we recommend resizing first if the form allows it.' },
      { q: 'Does compression remove photo metadata?', a: 'Yes. The compressed copy no longer contains camera details or GPS location, which is a nice bonus for privacy.' },
      { q: 'Can I compress a PDF to 50 KB here?', a: 'This page is for images. For documents, try <a href="/compress-pdf">Compress PDF</a>, or convert a page to an image with <a href="/pdf-to-jpg">PDF to JPG</a> first.' },
    ],
  },
  'compress-image-to-100kb': {
    intro: [
      'A 100 KB limit shows up in email signatures, website builders, school portals and online marketplaces. Most phone photos are several megabytes, so they need a real diet before they fit.',
      'This tool finds the sweet spot automatically: it keeps as much quality as the limit allows and, when needed, trims the pixel size to something sensible for screens. You get a file that fits on the first try.',
    ],
    steps: [
      'Drop in your photos or screenshots.',
      'Keep 100 KB or enter the limit you were given.',
      'Choose the output format.',
      'Click <strong>Compress to 100 KB</strong> and download each file or a ZIP of all of them.',
    ],
    features: [
      'Binary quality search for the best result under 100 KB.',
      'Smart downscaling that stops as soon as the file fits.',
      'Batch processing with a single ZIP download.',
      'Works with JPG, PNG, WebP, AVIF, GIF and BMP input.',
      'No signup, no watermark, no limits on how many files you process.',
    ],
    faqs: [
      { q: 'How big will my photo be in pixels?', a: 'It depends on the content. Simple images may keep their full size; detailed 12-megapixel phone photos usually end up around 1000–1400 pixels wide, which still looks sharp on screens.' },
      { q: 'Is WebP or JPG better for 100 KB?', a: 'WebP usually fits more detail into the same size. Choose JPG if you are not sure the website accepts WebP.' },
      { q: 'Why is my screenshot blurry after compressing?', a: 'Text-heavy screenshots don’t love JPG. Try a larger limit, or use <a href="/compress-image">Compress Image</a> with PNG and 256 colors, which keeps text crisp.' },
      { q: 'Can I use this on my phone?', a: 'Yes. It works in mobile browsers on iPhone and Android, directly from your photo library.' },
    ],
  },
  'compress-image-to-200kb': {
    intro: [
      'Two hundred kilobytes gives you room for genuinely detailed images: product shots, portfolio pieces, property listings and high-quality profile photos. The challenge is getting a 5 MB camera original down that far without visible damage.',
      'We test quality levels from the top down and keep the best version that fits, shrinking the dimensions only if necessary. Most photos keep a resolution that looks great on large screens.',
    ],
    steps: [
      'Add your photos.',
      'Confirm the 200 KB limit or type your own.',
      'Select JPG or WebP.',
      'Press <strong>Compress to 200 KB</strong> and save the results.',
    ],
    features: [
      'High-quality results that fit under 200 KB.',
      'Keeps full resolution whenever possible.',
      'Automatic white background for transparent images saved as JPG.',
      'Upright photos thanks to automatic EXIF rotation.',
      'Private processing on your own device.',
    ],
    faqs: [
      { q: 'Will a 200 KB photo look good on a big screen?', a: 'Usually, yes. 200 KB is enough for a sharp image around 1600–2000 pixels wide for most photos.' },
      { q: 'What if my image is already under 200 KB?', a: 'Then it is returned at the highest quality setting that fits, which may still be smaller than your original.' },
      { q: 'Can I set an exact limit like 180 KB?', a: 'Yes, just type 180 in the size box. Any number from 2 KB upward works.' },
      { q: 'Does this work for PNG files with transparency?', a: 'JPG cannot be transparent, so transparent areas are filled with white. If you need to keep transparency, choose WebP as the output.' },
    ],
  },
  'bulk-image-compressor': {
    intro: [
      'When you have a whole folder to shrink, one-at-a-time tools get old fast. The bulk compressor takes as many images as you like, compresses them in one go, and hands everything back as a tidy ZIP.',
      'Each file gets its own before-and-after size and a preview, so you can spot anything you would like to redo. Settings apply to the whole batch, and you can tweak them and run again in a click.',
    ],
    steps: [
      'Drop a batch of images, or select many at once from your device.',
      'Set the quality and, if you like, a single output format for all files.',
      'Press <strong>Compress all images</strong> and watch the progress for each file.',
      'Download individual files or everything as a ZIP.',
    ],
    features: [
      'No limit on the number of images or their size.',
      'Per-file results with sizes, dimensions and savings.',
      'One-click ZIP of all results, with duplicate names handled for you.',
      'Mix JPG, PNG, WebP and AVIF in the same batch.',
      'Files are processed one after another in the background, so the page stays responsive.',
      'Cancel at any time: finished files stay available.',
    ],
    faqs: [
      { q: 'How many images can I compress at once?', a: 'There is no fixed limit. Very large batches simply take longer, and older phones may need a little patience.' },
      { q: 'Can I convert everything to WebP while compressing?', a: 'Yes. Choose WebP under “Save as” and every image in the batch will be converted and compressed.' },
      { q: 'What happens to files that can’t be made smaller?', a: 'If an image is already highly optimized, we keep the original rather than give you a bigger file, and we say so next to that file.' },
      { q: 'Are the files uploaded for batch processing?', a: 'No. Even large batches are handled entirely in your browser. Nothing is sent anywhere.' },
      { q: 'Can I add more images after starting?', a: 'Yes. Use “Add more” and press the compress button again; already finished files are kept.' },
    ],
  },
  'resize-image': {
    intro: [
      'Whether a website wants exactly 1200 pixels wide, a social platform needs a perfect square, or you just want a photo half the size, resizing should be quick. Type the size, pick a percentage or choose a preset, and you are done.',
      'Resizing uses a high-quality Lanczos filter in linear light, which keeps edges sharp and avoids the muddy look of basic scaling. You can resize a single picture or a whole batch with the same settings.',
    ],
    steps: [
      'Add one or more images.',
      'Choose how to resize: exact pixels, a percentage, or a ready-made preset.',
      'Keep “Keep aspect ratio” on to avoid stretching, or turn it off for an exact width and height.',
      'Press <strong>Resize</strong> and download your images.',
    ],
    features: [
      'Exact pixel sizes, percentage scaling (5% to 400%) and common presets.',
      'Aspect-ratio lock, with each image in a batch keeping its own shape.',
      'Presets can fill and crop or fit inside with white edges.',
      'Sharp, high-quality resampling that also handles transparency correctly.',
      'Keeps the original format; JPG and WebP are saved at high quality.',
    ],
    faqs: [
      { q: 'Will resizing make my photo blurry?', a: 'Making images smaller keeps them sharp. Enlarging can only spread existing detail, so very big enlargements look softer, but our resampling keeps them as clean as possible.' },
      { q: 'How do I resize to exact dimensions without distortion?', a: 'Use the Presets option, which can fill the target shape and crop the overflow, or fit the image inside with white edges.' },
      { q: 'Can I resize many photos to the same width?', a: 'Yes. Enter the width with the aspect-ratio lock on, add all your images, and each one is scaled to that width with its own height.' },
      { q: 'Does resizing reduce the file size too?', a: 'Smaller dimensions usually mean a smaller file. For even smaller files, follow up with <a href="/compress-image">Compress Image</a>.' },
    ],
  },
  'png-to-jpg': {
    intro: [
      'PNG is great for graphics, but photos saved as PNG are often five to ten times bigger than they need to be. Converting them to JPG makes them easy to email, upload and share.',
      'Transparent areas need special care, because JPG can’t store transparency and many converters turn it black. Here it becomes clean white by default, or any color you choose.',
    ],
    steps: [
      'Drop your PNG files (several at once is fine).',
      'Set the JPG quality and, if needed, a background color for transparent parts.',
      'Press <strong>Convert to JPG</strong>.',
      'Download the JPGs one by one or as a ZIP.',
    ],
    features: [
      'Transparent backgrounds become white (or your chosen color), never black.',
      'Adjustable quality from 10% to 100%.',
      'Batch conversion with ZIP download.',
      'High-quality MozJPEG encoder for small, clean files.',
      'Runs in your browser, so screenshots and private images stay private.',
    ],
    faqs: [
      { q: 'Why did my transparent PNG turn black in other converters?', a: 'Transparent pixels often store black as their hidden color. When the transparency is dropped, that black shows up. We blend transparent areas onto white instead.' },
      { q: 'Will converting to JPG lose quality?', a: 'JPG is lossy, but at the default 90% the difference is invisible for photos. Sharp text and line art may look slightly softer, so keep those as PNG if crispness matters.' },
      { q: 'Can I choose a different background color?', a: 'Yes. Use the color picker to fill transparent areas with any color, for example to match a website background.' },
      { q: 'Is there a limit on how many PNGs I can convert?', a: 'No. Add as many as you like.' },
    ],
  },
  'jpg-to-png': {
    intro: [
      'Need a PNG for an app, a design tool or a form that only takes PNG? This converter turns JPG and JPEG photos into PNG files in seconds.',
      'PNG is lossless, so the converted image will not lose any more quality no matter how many times you edit and save it. It can’t bring back detail the JPG already lost, but it stops further loss in its tracks.',
    ],
    steps: [
      'Add your JPG or JPEG files.',
      'Press <strong>Convert to PNG</strong>.',
      'Download each PNG or all of them as a ZIP.',
    ],
    features: [
      'Lossless PNG output that keeps every pixel of the decoded photo.',
      'Correct orientation for phone photos with rotation data.',
      'Batch conversion and ZIP download.',
      'No upload, no account and no watermark.',
    ],
    extra: {
      heading: 'Good to know',
      paragraphs: [
        'PNG files of photos are usually larger than the JPGs they came from, because PNG stores every pixel exactly. If your goal is a smaller file, try <a href="/jpg-to-webp">JPG to WebP</a> or <a href="/compress-image">Compress Image</a> instead.',
      ],
    },
    faqs: [
      { q: 'Why is my PNG bigger than the JPG?', a: 'JPG throws away detail you can’t see to save space; PNG keeps everything. Converting to PNG therefore usually makes photos larger, but protects them from further quality loss.' },
      { q: 'Will the PNG have a transparent background?', a: 'No, a JPG has no transparency to carry over. The PNG will look exactly like the original photo.' },
      { q: 'Can I convert JPEG files too?', a: 'Yes. JPG and JPEG are the same format with different file name endings.' },
      { q: 'Does this work offline?', a: 'Once the page has loaded, the conversion itself runs on your device without sending anything over the internet.' },
    ],
  },
  'png-to-webp': {
    intro: [
      'WebP can store the same image as a PNG in a fraction of the space, and it supports transparency too. That makes it ideal for logos, illustrations and screenshots on websites.',
      'Convert a single file or a whole folder, choose the quality, and download the results. Transparent backgrounds stay transparent.',
    ],
    steps: [
      'Drop your PNG images.',
      'Choose a quality level (85% is a great default).',
      'Press <strong>Convert to WebP</strong>.',
      'Download the WebP files or a ZIP.',
    ],
    features: [
      'Keeps transparency intact.',
      'Typically 50–90% smaller than the original PNG.',
      'Adjustable quality for the right balance of size and detail.',
      'Batch conversion with ZIP download.',
      'Runs locally in your browser.',
    ],
    faqs: [
      { q: 'Do all browsers support WebP?', a: 'Yes, all current major browsers display WebP, including Safari on iPhone and Mac.' },
      { q: 'Will my logo’s transparent background survive?', a: 'Yes. WebP supports full transparency, and we keep it exactly.' },
      { q: 'Which quality should I choose for graphics?', a: 'For logos and text, 90% or higher keeps edges crisp. For photos, 75–85% is usually plenty.' },
      { q: 'Can I convert WebP back to PNG later?', a: 'Yes, with our <a href="/webp-to-png">WebP to PNG</a> converter.' },
    ],
  },
  'jpg-to-webp': {
    intro: [
      'Images are usually the heaviest part of a web page. Converting JPG photos to WebP often cuts their size by a quarter to a third at the same visual quality, so pages load faster and visitors use less data.',
      'Drop in a batch, set the quality once, and download web-ready WebP files.',
    ],
    steps: [
      'Add your JPG photos.',
      'Pick the WebP quality.',
      'Press <strong>Convert to WebP</strong>.',
      'Download the files or the ZIP and upload them to your site.',
    ],
    features: [
      'Smaller files than JPG at similar quality.',
      'Batch conversion with a single ZIP.',
      'Orientation from phone cameras applied automatically.',
      'Camera metadata removed for privacy.',
      'Free with no limits.',
    ],
    faqs: [
      { q: 'How much smaller will my WebP files be?', a: 'It depends on the photo, but savings of 25–35% compared to a similar-quality JPG are typical.' },
      { q: 'Should I keep my JPG originals?', a: 'Yes, keep originals for printing and editing. Use the WebP copies for websites and sharing.' },
      { q: 'Can social networks and email handle WebP?', a: 'Most modern services can, but some older apps and email programs still prefer JPG. Use <a href="/webp-to-jpg">WebP to JPG</a> if you need to convert back.' },
      { q: 'What about AVIF?', a: 'AVIF can be even smaller than WebP. Try <a href="/jpg-to-avif">JPG to AVIF</a> if your audience uses up-to-date browsers.' },
    ],
  },
  'webp-to-jpg': {
    intro: [
      'You saved an image from the web and it turned out to be a .webp file that your photo editor, printer or upload form refuses to open. Converting it to JPG solves that in a moment.',
      'If the WebP has transparent areas, they are filled with white so the JPG looks clean everywhere.',
    ],
    steps: [
      'Drop your WebP images.',
      'Adjust the JPG quality if you like.',
      'Press <strong>Convert to JPG</strong>.',
      'Download the JPG files or a ZIP.',
    ],
    features: [
      'Opens anywhere: JPG is the most widely supported image format.',
      'White (or custom) background for transparent WebP images.',
      'Batch conversion and ZIP download.',
      'Can also read animated WebP files (the first frame is used).',
      'Nothing is uploaded.',
    ],
    faqs: [
      { q: 'Why can’t my app open WebP files?', a: 'Some older programs simply predate WebP. Converting to JPG makes the image compatible with practically everything.' },
      { q: 'Will I lose quality?', a: 'Converting between lossy formats can lose a little detail, but at 90% quality it is not noticeable for normal viewing.' },
      { q: 'What happens with animated WebP?', a: 'JPG can’t animate, so the first frame is converted.' },
      { q: 'Is my image private?', a: 'Yes. The conversion runs entirely in your browser.' },
    ],
  },
  'webp-to-png': {
    intro: [
      'When you need to edit a WebP image in a design tool, put it on a slide, or keep its transparent background, PNG is the safest choice. This converter does it without losing a single pixel.',
      'Drop one image or many, and you get lossless PNG copies with transparency intact.',
    ],
    steps: [
      'Add your WebP files.',
      'Press <strong>Convert to PNG</strong>.',
      'Download each PNG or all as a ZIP.',
    ],
    features: [
      'Lossless PNG output.',
      'Transparent areas stay transparent.',
      'Batch conversion with ZIP download.',
      'Works on phones, tablets and computers.',
    ],
    faqs: [
      { q: 'Why is the PNG larger than the WebP?', a: 'PNG stores every pixel exactly, while WebP uses clever compression. The PNG is bigger, but it opens everywhere and won’t degrade when you edit it.' },
      { q: 'Does it keep transparency?', a: 'Yes, both formats support transparency and it is preserved.' },
      { q: 'Can I convert many files at once?', a: 'Yes, add as many WebP files as you like and download them as a ZIP.' },
      { q: 'Do you store the converted files?', a: 'No. We never see your files. They exist only in your browser tab until you download them.' },
    ],
  },
  'jpg-to-avif': {
    intro: [
      'AVIF is a modern image format based on the AV1 video codec. For photos it often produces files half the size of a JPG with similar quality, which makes it a favorite for fast websites.',
      'Creating AVIF files takes real computing power, and here it all happens on your device. Small and medium photos are quick; very large photos can take a little while, and you can cancel at any time.',
    ],
    steps: [
      'Drop your JPG photos.',
      'Choose a quality: around 60–70% is usually indistinguishable from the original.',
      'Press <strong>Convert to AVIF</strong> and wait for the progress bar to finish.',
      'Download your AVIF files or a ZIP.',
    ],
    features: [
      'Next-generation compression for very small files.',
      'Adjustable quality.',
      'Batch conversion with ZIP download.',
      'Encoding runs in a background worker so the page stays responsive.',
      'Free and private.',
    ],
    faqs: [
      { q: 'Which browsers can show AVIF images?', a: 'Current versions of Chrome, Edge, Firefox and Safari all support AVIF. Some older devices and apps don’t yet, so keep a JPG copy for those.' },
      { q: 'Why does AVIF take longer than JPG?', a: 'AVIF encoders search much harder for ways to save space. That effort happens on your device, so it depends on your processor.' },
      { q: 'AVIF or WebP: which should I use?', a: 'AVIF usually wins on size, WebP on speed and compatibility. Many sites serve AVIF with a WebP or JPG fallback.' },
      { q: 'Can I convert PNG to AVIF?', a: 'Yes, this tool accepts PNG, WebP and other images as well, and keeps transparency in AVIF.' },
    ],
  },
  'heic-to-jpg': {
    intro: [
      'iPhones save photos as HEIC to save space, but many websites, Windows apps and older devices can’t open them. Converting to JPG makes your photos easy to share anywhere.',
      'We don’t bundle a HEIC decoder. Instead, the conversion uses your browser’s own image support. Safari on iPhone, iPad and Mac reads HEIC natively, so it works great there. Other browsers may not support HEIC yet, and we will tell you if that is the case.',
    ],
    steps: [
      'Open this page in Safari on your iPhone, iPad or Mac for the best results.',
      'Choose your HEIC photos from your library or files.',
      'Pick JPG or PNG and press <strong>Convert</strong>.',
      'Download the converted photos one by one or as a ZIP.',
    ],
    features: [
      'Uses the browser’s built-in HEIC support: nothing is uploaded and no extra decoder is downloaded.',
      'JPG with adjustable quality, or lossless PNG.',
      'Batch conversion with ZIP download.',
      'Location data from the photo is not copied to the converted file.',
    ],
    extra: {
      heading: 'If your browser can’t open HEIC',
      paragraphs: [
        'You will see a message if your browser can’t read HEIC files. Open this page in Safari on an iPhone or Mac instead, or set your iPhone to save JPG from now on: Settings → Camera → Formats → Most Compatible.',
      ],
    },
    faqs: [
      { q: 'Why doesn’t HEIC conversion work in my browser?', a: 'HEIC support depends on the browser and device. Safari supports it; many other browsers don’t yet. We only use what your browser can do, so your photos never need to be uploaded.' },
      { q: 'How can I stop my iPhone saving HEIC photos?', a: 'Go to Settings → Camera → Formats and choose “Most Compatible”. New photos will be saved as JPG.' },
      { q: 'Does converting reduce quality?', a: 'At 90% JPG quality the difference is not visible. Choose PNG if you want a lossless copy.' },
      { q: 'Are Live Photos supported?', a: 'The still image of a Live Photo is converted. The short video part is not included.' },
    ],
  },
  'passport-photo-maker': {
    intro: [
      'Getting a photo to the exact size an application asks for can be surprisingly fiddly. This photo maker lets you frame your face with a guide, choose a standard or custom size, and download a photo with the right pixel dimensions and file size.',
      'You can also make a printable sheet with several copies on 4×6 inch photo paper or A4, ready for a print shop or your home printer. The tool is not affiliated with any government, so always double-check the official requirements for your application.',
    ],
    steps: [
      'Take a well-lit photo looking straight at the camera, against a plain light background.',
      'Drop the photo here and choose a size: 2×2 inch, 35×45 mm, 33×48 mm or a custom size.',
      'Drag, zoom and straighten until the top of the head and chin sit on the guide lines. Adjust brightness and contrast if needed.',
      'Set a maximum file size if your form has one, press <strong>Create photo</strong> and download.',
      'Optionally download a printable sheet as JPG or PDF.',
    ],
    features: [
      'Presets for 2×2 inch (600×600 px), 35×45 mm and 33×48 mm, plus custom pixel or millimeter sizes at any DPI.',
      'Face position guide with head and chin lines.',
      'Zoom, drag, 90° rotation and fine straightening.',
      'Brightness and contrast adjustments.',
      'Exact output dimensions with automatic compression under your KB limit.',
      'Printable sheets on 4×6 inch paper or A4 with cut lines, as JPG or PDF.',
    ],
    extra: {
      heading: 'Photo tips',
      paragraphs: [
        'Use soft, even light from the front, keep a neutral expression with your mouth closed, and make sure glasses don’t reflect. We don’t remove or replace backgrounds, so stand in front of a plain white or light gray wall. Requirements differ between countries and applications: always check the official rules.',
      ],
    },
    faqs: [
      { q: 'Will my photo definitely be accepted?', a: 'We can’t guarantee that. The tool makes the size, framing and file size easy to get right, but each authority has its own rules about background, lighting, expression and recency. Always check the official requirements.' },
      { q: 'Which sizes are included?', a: '2×2 inch (51×51 mm, 600×600 pixels), 35×45 mm and 33×48 mm at 300 DPI, plus custom sizes in pixels or millimeters with any DPI.' },
      { q: 'Can I make the file smaller than a certain KB limit?', a: 'Yes. Enter the maximum size and we compress the photo to fit while keeping the exact pixel dimensions.' },
      { q: 'How do I print the sheet at the right size?', a: 'Print the PDF or JPG at 100% or “actual size”. Don’t use “fit to page”, which would change the photo size.' },
      { q: 'Is my photo uploaded?', a: 'No. Your photo is processed entirely in your browser and never leaves your device.' },
    ],
  },
};
