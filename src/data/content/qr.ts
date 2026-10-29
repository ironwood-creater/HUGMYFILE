import type { ToolContent } from './types';

export const QR_CONTENT: Record<string, ToolContent> = {
  'qr-code-generator': {
    intro: [
      'A QR code is a small square that phones can scan to open a link, show a message, join a network or save a contact. This generator creates static QR codes: the information is stored inside the code itself, so there is no middleman server, no redirect and nothing that can expire or be switched off later.',
      'Pick what the code should do, fill in the details, and style it with your colors, a gradient, rounded dots or your logo. Download it as a PNG for documents and social posts, or as an SVG that stays razor-sharp on posters and packaging.',
    ],
    steps: [
      'Choose the type of code: link, text, WiFi, WhatsApp, email, call, SMS or contact card.',
      'Type the details. The preview updates as you go.',
      'Open “Colors, style and logo” to match your brand, if you like.',
      'Scan the preview with your phone to check it, then download PNG or SVG.',
    ],
    features: [
      'Eight content types in one place.',
      'Static codes that never expire and don’t track who scans them.',
      'Colors, gradients, rounded or dotted styles and custom corner shapes.',
      'Center logo with automatic high error correction.',
      'PNG up to 2048 pixels, or infinitely scalable SVG.',
      'Contrast warnings when your color choice might be hard to scan.',
    ],
    extra: {
      heading: 'Static vs. dynamic QR codes',
      paragraphs: [
        'Some services make “dynamic” codes that point to their own short link and then redirect. Those can be edited later, but they stop working if the service shuts down or you stop paying. Our codes are static: the content is printed right into the pattern, so they work for as long as the destination exists.',
      ],
    },
    faqs: [
      { q: 'Do these QR codes expire?', a: 'No. They are static codes with your content stored directly in the pattern. There is no server in between, so there is nothing that can expire.' },
      { q: 'Can I change the link after printing?', a: 'Not for a static code: the link is part of the pattern. If you think the address may change, point the code at a page you control and update that page instead.' },
      { q: 'Do you track scans?', a: 'No. Scanning a static code opens your content directly. We never see who scans it, and we never see the content you put in it.' },
      { q: 'PNG or SVG: which should I download?', a: 'PNG is easiest for documents, slides and social media. SVG is a vector file that stays sharp at any size, which is ideal for print.' },
      { q: 'Why won’t my colorful QR code scan?', a: 'Scanners need strong contrast. Keep the dots dark and the background light, and avoid pale gradients. We show a warning when contrast looks risky.' },
    ],
  },
  'wifi-qr-code': {
    intro: [
      'Spelling out a long WiFi password to every guest gets old quickly. A WiFi QR code lets visitors point their camera at it and join your network with one tap: no typing, no typos.',
      'It works with WPA, WPA2 and WPA3 networks, older WEP networks, open networks and hidden networks. Passwords with tricky characters like semicolons, commas, quotes or backslashes are escaped correctly, which many generators get wrong.',
    ],
    steps: [
      'Type your network name (SSID) exactly as it appears on your devices.',
      'Enter the password and choose the security type (WPA/WPA2/WPA3 for most home routers).',
      'Tick “Hidden network” if your network doesn’t broadcast its name.',
      'Test the code with your phone, then download and print it.',
    ],
    features: [
      'Supports WPA/WPA2/WPA3, WEP, open and hidden networks.',
      'Correct escaping of special characters in names and passwords.',
      'Works with the built-in camera on current iPhone and Android phones.',
      'Your password never leaves your device while making the code.',
      'Print-ready PNG or SVG with your colors.',
    ],
    extra: {
      heading: 'Keep your network safe',
      paragraphs: [
        'Anyone who can see the code can join your WiFi, so place it where only your guests can reach it. Many routers let you create a separate guest network; that is the perfect network to share with a QR code.',
      ],
    },
    faqs: [
      { q: 'Which phones can scan a WiFi QR code?', a: 'Current iPhones and most Android phones can join a network straight from the camera app. Older phones may need a QR scanner app.' },
      { q: 'My password has special characters. Will it work?', a: 'Yes. Characters such as ; , : " and \\ have special meaning in the WiFi QR format, and we escape them automatically.' },
      { q: 'Is my WiFi password sent anywhere?', a: 'No. The code is generated in your browser. The password is only stored inside the QR image you download.' },
      { q: 'What should I choose for WPA3?', a: 'Choose “WPA / WPA2 / WPA3”. Phones work out the exact version when they connect.' },
      { q: 'What if I change my WiFi password?', a: 'Just make a new code. Static codes contain the password itself, so an old code stops working when the password changes.' },
    ],
  },
  'whatsapp-qr-code': {
    intro: [
      'Want customers, clients or friends to message you on WhatsApp without saving your number first? A WhatsApp QR code opens a chat with you straight away, and it can even fill in the first message for them.',
      'The code uses WhatsApp’s standard click-to-chat link format (wa.me), so it works with the app on phones and on computers. Put it on a shop window, a menu, a flyer or a business card.',
    ],
    steps: [
      'Enter your WhatsApp number including the country code, for example +44 7700 900123.',
      'Optionally add a message that will be ready to send, like “Hi! I’d like to book a table.”',
      'Style the code if you like, and scan it to test.',
      'Download it as PNG or SVG.',
    ],
    features: [
      'Opens a chat directly using the standard wa.me link.',
      'Optional prefilled message, with emoji and accents encoded correctly.',
      'Accepts numbers written with spaces, dashes, brackets or a leading +.',
      'Brand colors and a logo for a professional look.',
      'Free, static and never expires.',
    ],
    faqs: [
      { q: 'Do people need to save my number first?', a: 'No. Scanning the code opens a chat with your number right away.' },
      { q: 'How do I write my number?', a: 'Use the full international format with the country code, for example +1 555 123 4567. We remove spaces and symbols automatically.' },
      { q: 'Can I change the prefilled message later?', a: 'The message is part of the static code, so make a new code if you want different wording.' },
      { q: 'Is HugMyFile connected to WhatsApp?', a: 'No. We simply create a standard link that WhatsApp understands. WhatsApp is a trademark of its owner, and we are not affiliated with them.' },
    ],
  },
  'email-qr-code': {
    intro: [
      'An email QR code opens a new message in the scanner’s mail app with your address, subject line and message already filled in. It’s a friendly way to collect feedback, take support requests or receive RSVPs.',
      'Because the code uses the standard mailto format, it works with built-in phone mail apps and popular email clients.',
    ],
    steps: [
      'Enter the email address that should receive the messages.',
      'Add a subject and a starting message if you like.',
      'Check the preview by scanning it.',
      'Download and place the code on your poster, receipt or product.',
    ],
    features: [
      'Prefills recipient, subject and message.',
      'Special characters and line breaks encoded correctly.',
      'Clean PNG or scalable SVG output.',
      'Colors, rounded styles and logo support.',
      'Nothing you type is uploaded.',
    ],
    faqs: [
      { q: 'Will the email be sent automatically?', a: 'No. The code only opens a ready-to-send draft. The person scanning decides whether to send it.' },
      { q: 'Can I add several recipients?', a: 'Many mail apps accept several addresses separated by commas, for example a@example.com,b@example.com. Test with your own phone first.' },
      { q: 'Can I use this for feedback forms?', a: 'Yes. A subject like “Feedback for table 4” makes incoming messages easy to sort.' },
      { q: 'Does my address appear in the code?', a: 'Yes, the address is stored inside the code so the mail app can use it. Anyone who scans it can see it.' },
    ],
  },
  'phone-qr-code': {
    intro: [
      'Make it effortless for people to reach you: a phone QR code starts a call to your number, and an SMS QR code opens a text message with your words already typed.',
      'They are handy on delivery notes, flyers, lost-and-found tags and anywhere typing a number would be a hassle.',
    ],
    steps: [
      'Choose “Call” for a phone call or “SMS” for a text message.',
      'Enter the number, ideally with the country code.',
      'For SMS, add the message that should be prefilled.',
      'Scan to test, then download PNG or SVG.',
    ],
    features: [
      'Call codes use the standard tel: format.',
      'SMS codes use the widely supported SMSTO format with an optional message.',
      'Numbers are cleaned up automatically while keeping the + for international calls.',
      'Custom colors, styles and logo.',
      'Static codes that never expire.',
    ],
    faqs: [
      { q: 'Does scanning start the call immediately?', a: 'No. Phones show the number first and the person taps to call, so nobody calls by accident.' },
      { q: 'Should I include the country code?', a: 'Yes, if the code may be scanned from another country. It also never hurts locally.' },
      { q: 'Will the SMS be sent automatically?', a: 'No, it opens a draft in the messaging app. The person decides whether to send it.' },
      { q: 'Can I put both a call and SMS option in one code?', a: 'One code can do one action. If you need several options, a <a href="/vcard-qr-code">vCard contact code</a> lets people save your number, email and more at once.' },
    ],
  },
  'vcard-qr-code': {
    intro: [
      'A vCard QR code holds a digital business card. When someone scans it, their phone offers to save your name, phone numbers, email, website, company and address straight into their contacts.',
      'It is perfect for business cards, name badges, conference booths and email signatures. The code follows the widely supported vCard 3.0 format, with special characters handled properly.',
    ],
    steps: [
      'Fill in the details you want to share. Every field is optional.',
      'Watch the preview update. More details make a denser code.',
      'Style it to match your card and test it with your phone.',
      'Download PNG or SVG and add it to your design.',
    ],
    features: [
      'Name, company, job title, mobile and work phones, email, website and address.',
      'Standard vCard 3.0 that iPhone and Android contacts understand.',
      'Commas, semicolons and line breaks escaped correctly.',
      'Accents and non-Latin names encoded as UTF-8.',
      'Private: your details stay on your device while you design the code.',
    ],
    faqs: [
      { q: 'What happens when someone scans my vCard code?', a: 'Their phone shows a contact card with your details and an option to save it to their contacts.' },
      { q: 'Why does my code look busy?', a: 'Every character you add makes the pattern denser. Leave out fields you don’t need, or print the code a little larger.' },
      { q: 'Can I add a photo to the contact?', a: 'Photos make codes far too large to scan reliably, so we leave them out. You can still add your logo to the middle of the code itself.' },
      { q: 'Can I update the card later?', a: 'Static codes can’t change. Make a new code whenever your details change.' },
    ],
  },
  'qr-code-with-logo': {
    intro: [
      'A QR code with your logo in the middle looks professional and tells people what they are about to open. QR codes have built-in error correction, which means part of the pattern can be covered and the code still works.',
      'When you add a logo, we automatically switch to the strongest error correction level and clear the dots behind the logo, so your code stays easy to scan. Then choose brand colors, rounded dots and matching corners.',
    ],
    steps: [
      'Enter the link or content for your code.',
      'Click “Add a logo” and pick a square-ish image, ideally with a transparent or white background.',
      'Adjust the logo size and pick colors and styles.',
      'Scan the preview to make sure it reads easily, then download PNG or SVG.',
    ],
    features: [
      'Logo placed in the center with a clean margin around it.',
      'Error correction raised to H automatically.',
      'Brand colors, gradients, rounded dots and custom corners.',
      'Contrast warnings to keep it scannable.',
      'High-resolution PNG and SVG downloads, no watermark.',
    ],
    extra: {
      heading: 'Tips for a logo that scans',
      paragraphs: [
        'Keep the logo under about 30% of the code’s width, keep strong contrast between dots and background, and leave the quiet zone (the margin) in place. Always test the final code with a couple of different phones before printing a big batch.',
      ],
    },
    faqs: [
      { q: 'Won’t the logo break the QR code?', a: 'Not when it is sized sensibly. With error correction level H, up to about 30% of the code can be damaged or covered and it still reads correctly.' },
      { q: 'What image works best as a logo?', a: 'A simple, square-ish PNG with a transparent or white background. Very detailed logos shrink into a blur at small sizes.' },
      { q: 'Is my logo uploaded?', a: 'No. Your logo is read by your browser and placed into the code on your device.' },
      { q: 'Can I use a logo with WiFi or contact codes too?', a: 'Yes. Switch the content type at the top: every type can have a logo.' },
    ],
  },
};
