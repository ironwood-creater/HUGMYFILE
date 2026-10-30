import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Options as QrOptions, DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { ImagePlus, Trash2 } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import Notice from '../shared/Notice';
import { Slider } from '../shared/Controls';
import { DownloadButton } from '../shared/Download';
import { markSaved, markUnsaved, newResultId } from '../../lib/unsaved';
import type { QrType } from '../../data/tools';
import {
  QR_CAPACITY,
  emailPayload,
  phonePayload,
  smsPayload,
  toUtf8ByteString,
  urlPayload,
  vcardPayload,
  whatsappPayload,
  wifiPayload,
  type VCard,
  type WifiSecurity,
} from '../../lib/qr/payload';

type Ecl = 'auto' | 'L' | 'M' | 'Q' | 'H';

const TYPES: { value: QrType; label: string }[] = [
  { value: 'url', label: 'Link' },
  { value: 'text', label: 'Text' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Call' },
  { value: 'sms', label: 'SMS' },
  { value: 'vcard', label: 'Contact' },
];

const EMPTY_VCARD: VCard = {
  firstName: '',
  lastName: '',
  org: '',
  title: '',
  mobile: '',
  workPhone: '',
  email: '',
  website: '',
  street: '',
  city: '',
  region: '',
  postcode: '',
  country: '',
  note: '',
};

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1]!, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function Field(props: { id: string; label: string; value: string; onInput: (v: string) => void; type?: string; placeholder?: string; hint?: string; multiline?: boolean }) {
  return (
    <div>
      <label for={props.id} class="field-label">
        {props.label}
      </label>
      {props.multiline ? (
        <textarea id={props.id} class="field min-h-24" value={props.value} placeholder={props.placeholder} onInput={(e) => props.onInput(e.currentTarget.value)} data-testid={props.id} />
      ) : (
        <input
          id={props.id}
          type={props.type ?? 'text'}
          class="field"
          value={props.value}
          placeholder={props.placeholder}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          data-testid={props.id}
          autocomplete="off"
        />
      )}
      {props.hint && <p class="mt-1 text-sm text-muted">{props.hint}</p>}
    </div>
  );
}

export default function QrTool({ type: initialType, logo: logoFocus = false }: { type: QrType; logo?: boolean }) {
  const [type, setType] = useState<QrType>(initialType);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState({ ssid: '', password: '', security: 'WPA' as WifiSecurity, hidden: false });
  const [wa, setWa] = useState({ phone: '', message: '' });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState({ phone: '', message: '' });
  const [vcard, setVcard] = useState<VCard>(EMPTY_VCARD);

  const [dotType, setDotType] = useState<DotType>(logoFocus ? 'rounded' : 'square');
  const [dotColor, setDotColor] = useState(logoFocus ? '#13615b' : '#1e1a18');
  const [gradient, setGradient] = useState(false);
  const [dotColor2, setDotColor2] = useState('#c2412d');
  const [cornerSquare, setCornerSquare] = useState<CornerSquareType>(logoFocus ? 'extra-rounded' : 'square');
  const [cornerDot, setCornerDot] = useState<CornerDotType>(logoFocus ? 'dot' : 'square');
  const [cornerColor, setCornerColor] = useState(logoFocus ? '#c2412d' : '#1e1a18');
  const [bg, setBg] = useState('#ffffff');
  const [size, setSize] = useState(1024);
  const [marginPct, setMarginPct] = useState(6);
  const [ecl, setEcl] = useState<Ecl>('auto');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(30);
  const preview = useRef<HTMLDivElement>(null);
  const qr = useRef<import('qr-code-styling').default | null>(null);
  const unsavedId = useRef(newResultId('qr'));

  const data = useMemo(() => {
    switch (type) {
      case 'url':
        return urlPayload(url);
      case 'text':
        return text;
      case 'wifi':
        return wifi.ssid ? wifiPayload(wifi) : '';
      case 'whatsapp':
        return wa.phone.replace(/\D/g, '') ? whatsappPayload(wa) : '';
      case 'email':
        return email.to.trim() ? emailPayload(email) : '';
      case 'phone':
        return phone.replace(/\D/g, '') ? phonePayload(phone) : '';
      case 'sms':
        return sms.phone.replace(/\D/g, '') ? smsPayload(sms) : '';
      case 'vcard':
        return Object.values(vcard).some((v) => v.trim()) ? vcardPayload(vcard) : '';
    }
  }, [type, url, text, wifi, wa, email, phone, sms, vcard]);

  const level = ecl === 'auto' ? (logo ? 'H' : 'M') : ecl;
  const bytes = useMemo(() => new TextEncoder().encode(data).length, [data]);
  const tooLong = bytes > QR_CAPACITY[level];
  const ratio = Math.min(contrast(dotColor, bg), gradient ? contrast(dotColor2, bg) : 99, contrast(cornerColor, bg));
  const inverted = luminance(dotColor) > luminance(bg);

  const options = (px: number, kind: 'svg' | 'canvas'): QrOptions => ({
    type: kind,
    width: px,
    height: px,
    margin: Math.round((px * marginPct) / 100),
    data: toUtf8ByteString(data),
    image: logo ?? undefined,
    qrOptions: { errorCorrectionLevel: level, mode: 'Byte' },
    // The logo is already a data URL, so it is embedded as-is (no extra request).
    imageOptions: { hideBackgroundDots: true, imageSize: logoSize / 100, margin: Math.round(px / 120), saveAsBlob: false },
    dotsOptions: {
      type: dotType,
      color: dotColor,
      gradient: gradient
        ? { type: 'linear', rotation: Math.PI / 4, colorStops: [{ offset: 0, color: dotColor }, { offset: 1, color: dotColor2 }] }
        : undefined,
    },
    cornersSquareOptions: { type: cornerSquare, color: cornerColor },
    cornersDotOptions: { type: cornerDot, color: cornerColor },
    backgroundOptions: { color: bg },
  });

  // Live preview (SVG, so it stays crisp on any screen).
  useEffect(() => {
    if (!data || tooLong) {
      if (preview.current) preview.current.innerHTML = '';
      qr.current = null;
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling');
      if (cancelled || !preview.current) return;
      const opts = options(280, 'svg');
      if (!qr.current) {
        preview.current.innerHTML = '';
        qr.current = new QRCodeStyling(opts);
        qr.current.append(preview.current);
      } else {
        qr.current.update(opts);
      }
      const svg = preview.current.querySelector('svg');
      svg?.setAttribute('role', 'img');
      svg?.setAttribute('aria-label', 'QR code preview');
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  });

  // Armed before paint, so the warning is active as soon as the code shows.
  useLayoutEffect(() => {
    if (data) markUnsaved(unsavedId.current);
    else markSaved(unsavedId.current);
  }, [data]);
  useEffect(() => () => markSaved(unsavedId.current), []);

  const exportBlob = async (ext: 'png' | 'svg'): Promise<Blob> => {
    const { default: QRCodeStyling } = await import('qr-code-styling');
    const instance = new QRCodeStyling(options(size, ext === 'png' ? 'canvas' : 'svg'));
    const raw = await instance.getRawData(ext);
    if (!raw) throw new Error('QR export failed');
    return raw instanceof Blob ? raw : new Blob([raw as BlobPart], { type: ext === 'png' ? 'image/png' : 'image/svg+xml' });
  };

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setLogo(await readAsDataUrl(file));
  };

  const fileBase = `qr-${type}`;

  return (
    <div class="card grid gap-6 p-4 md:grid-cols-[1fr_320px] md:p-6">
      <div class="space-y-6">
        <fieldset>
          <legend class="field-label">What should the code open?</legend>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="QR code type">
            {TYPES.map((t) => (
              <label
                key={t.value}
                class={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sea-500 ${type === t.value ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface hover:border-coral-300'}`}
              >
                <input type="radio" class="sr-only" name="qr-type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} data-testid={`qr-type-${t.value}`} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div class="space-y-4" data-testid="qr-fields">
          {type === 'url' && <Field id="qr-url" label="Website address" value={url} onInput={setUrl} type="url" placeholder="https://example.com" />}
          {type === 'text' && <Field id="qr-text" label="Text" value={text} onInput={setText} multiline placeholder="Any message, up to a couple of thousand characters" />}
          {type === 'wifi' && (
            <>
              <Field id="wifi-ssid" label="Network name (SSID)" value={wifi.ssid} onInput={(v) => setWifi({ ...wifi, ssid: v })} />
              {wifi.security !== 'nopass' && <Field id="wifi-password" label="Password" value={wifi.password} onInput={(v) => setWifi({ ...wifi, password: v })} />}
              <div class="flex flex-wrap items-end gap-4">
                <div>
                  <label for="wifi-security" class="field-label">Security</label>
                  <select id="wifi-security" class="field" value={wifi.security} onChange={(e) => setWifi({ ...wifi, security: e.currentTarget.value as WifiSecurity })} data-testid="wifi-security">
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP (old)</option>
                    <option value="nopass">No password</option>
                  </select>
                </div>
                <label class="flex items-center gap-2 pb-3">
                  <input type="checkbox" class="size-5" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: e.currentTarget.checked })} data-testid="wifi-hidden" />
                  <span class="font-bold">Hidden network</span>
                </label>
              </div>
              <p class="text-sm text-muted">Special characters such as ; , : " and \ are escaped automatically, so tricky passwords work.</p>
            </>
          )}
          {type === 'whatsapp' && (
            <>
              <Field id="wa-phone" label="Phone number with country code" value={wa.phone} onInput={(v) => setWa({ ...wa, phone: v })} type="tel" placeholder="+1 555 123 4567" hint="Include the country code. Spaces, dashes and + are fine." />
              <Field id="wa-message" label="Prefilled message (optional)" value={wa.message} onInput={(v) => setWa({ ...wa, message: v })} multiline />
            </>
          )}
          {type === 'email' && (
            <>
              <Field id="email-to" label="Email address" value={email.to} onInput={(v) => setEmail({ ...email, to: v })} type="email" placeholder="hello@example.com" />
              <Field id="email-subject" label="Subject (optional)" value={email.subject} onInput={(v) => setEmail({ ...email, subject: v })} />
              <Field id="email-body" label="Message (optional)" value={email.body} onInput={(v) => setEmail({ ...email, body: v })} multiline />
            </>
          )}
          {type === 'phone' && <Field id="phone-number" label="Phone number" value={phone} onInput={setPhone} type="tel" placeholder="+44 20 7946 0958" />}
          {type === 'sms' && (
            <>
              <Field id="sms-phone" label="Phone number" value={sms.phone} onInput={(v) => setSms({ ...sms, phone: v })} type="tel" />
              <Field id="sms-message" label="Message (optional)" value={sms.message} onInput={(v) => setSms({ ...sms, message: v })} multiline />
            </>
          )}
          {type === 'vcard' && (
            <div class="grid gap-4 sm:grid-cols-2">
              <Field id="vc-first" label="First name" value={vcard.firstName} onInput={(v) => setVcard({ ...vcard, firstName: v })} />
              <Field id="vc-last" label="Last name" value={vcard.lastName} onInput={(v) => setVcard({ ...vcard, lastName: v })} />
              <Field id="vc-org" label="Company" value={vcard.org} onInput={(v) => setVcard({ ...vcard, org: v })} />
              <Field id="vc-title" label="Job title" value={vcard.title} onInput={(v) => setVcard({ ...vcard, title: v })} />
              <Field id="vc-mobile" label="Mobile" value={vcard.mobile} onInput={(v) => setVcard({ ...vcard, mobile: v })} type="tel" />
              <Field id="vc-work" label="Work phone" value={vcard.workPhone} onInput={(v) => setVcard({ ...vcard, workPhone: v })} type="tel" />
              <Field id="vc-email" label="Email" value={vcard.email} onInput={(v) => setVcard({ ...vcard, email: v })} type="email" />
              <Field id="vc-website" label="Website" value={vcard.website} onInput={(v) => setVcard({ ...vcard, website: v })} />
              <Field id="vc-street" label="Street" value={vcard.street} onInput={(v) => setVcard({ ...vcard, street: v })} />
              <Field id="vc-city" label="City" value={vcard.city} onInput={(v) => setVcard({ ...vcard, city: v })} />
              <Field id="vc-region" label="State / region" value={vcard.region} onInput={(v) => setVcard({ ...vcard, region: v })} />
              <Field id="vc-postcode" label="Postcode" value={vcard.postcode} onInput={(v) => setVcard({ ...vcard, postcode: v })} />
              <Field id="vc-country" label="Country" value={vcard.country} onInput={(v) => setVcard({ ...vcard, country: v })} />
              <Field id="vc-note" label="Note" value={vcard.note} onInput={(v) => setVcard({ ...vcard, note: v })} />
            </div>
          )}
        </div>

        <details class="rounded-2xl border border-line p-4" open={logoFocus}>
          <summary class="font-extrabold">Colors, style and logo</summary>
          <div class="mt-4 space-y-5">
            <div class="flex flex-wrap gap-5">
              <label class="block">
                <span class="field-label">Dots</span>
                <input type="color" class="h-11 w-16 cursor-pointer rounded-lg border-2 border-line" value={dotColor} onInput={(e) => setDotColor(e.currentTarget.value)} data-testid="dot-color" />
              </label>
              <label class="flex items-center gap-2 self-end pb-3">
                <input type="checkbox" class="size-5" checked={gradient} onChange={(e) => setGradient(e.currentTarget.checked)} />
                <span class="font-bold">Gradient</span>
              </label>
              {gradient && (
                <label class="block">
                  <span class="field-label">Gradient end</span>
                  <input type="color" class="h-11 w-16 cursor-pointer rounded-lg border-2 border-line" value={dotColor2} onInput={(e) => setDotColor2(e.currentTarget.value)} />
                </label>
              )}
              <label class="block">
                <span class="field-label">Corners</span>
                <input type="color" class="h-11 w-16 cursor-pointer rounded-lg border-2 border-line" value={cornerColor} onInput={(e) => setCornerColor(e.currentTarget.value)} />
              </label>
              <label class="block">
                <span class="field-label">Background</span>
                <input type="color" class="h-11 w-16 cursor-pointer rounded-lg border-2 border-line" value={bg} onInput={(e) => setBg(e.currentTarget.value)} data-testid="bg-color" />
              </label>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <label class="block">
                <span class="field-label">Dot style</span>
                <select class="field" value={dotType} onChange={(e) => setDotType(e.currentTarget.value as DotType)}>
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="extra-rounded">Extra rounded</option>
                  <option value="dots">Dots</option>
                  <option value="classy">Classy</option>
                  <option value="classy-rounded">Classy rounded</option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Corner frame</span>
                <select class="field" value={cornerSquare} onChange={(e) => setCornerSquare(e.currentTarget.value as CornerSquareType)}>
                  <option value="square">Square</option>
                  <option value="extra-rounded">Rounded</option>
                  <option value="dot">Circle</option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Corner center</span>
                <select class="field" value={cornerDot} onChange={(e) => setCornerDot(e.currentTarget.value as CornerDotType)}>
                  <option value="square">Square</option>
                  <option value="dot">Circle</option>
                </select>
              </label>
            </div>
            <div class="rounded-xl bg-surface-2 p-4">
              <p class="field-label">Logo in the middle</p>
              {logo ? (
                <div class="flex flex-wrap items-center gap-4">
                  <img src={logo} alt="Your logo" class="size-14 rounded-lg border border-line bg-white object-contain" />
                  <div class="min-w-[12rem] flex-1">
                    <Slider id="logo-size" label="Logo size" value={logoSize} min={15} max={40} onInput={setLogoSize} format={(v) => `${v}%`} />
                  </div>
                  <button type="button" class="btn btn-ghost btn-sm" onClick={() => setLogo(null)}>
                    <Icon icon={Trash2 as IconNode} size={16} /> Remove logo
                  </button>
                </div>
              ) : (
                <label class="btn btn-secondary btn-sm cursor-pointer">
                  <Icon icon={ImagePlus as IconNode} size={16} /> Add a logo
                  <input type="file" accept="image/*" class="sr-only" data-testid="logo-input" onChange={(e) => onLogo(e.currentTarget.files?.[0])} />
                </label>
              )}
              <p class="mt-2 text-sm text-muted">With a logo we switch to the highest error correction (H) automatically so the code still scans.</p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <Slider id="qr-size" label="Download size" value={size} min={256} max={2048} step={64} onInput={setSize} format={(v) => `${v} px`} />
              <Slider id="qr-margin" label="Quiet zone (margin)" value={marginPct} min={0} max={15} onInput={setMarginPct} format={(v) => `${v}%`} />
            </div>
            <div>
              <label for="ecl" class="field-label">Error correction</label>
              <select id="ecl" class="field max-w-xs" value={ecl} onChange={(e) => setEcl(e.currentTarget.value as Ecl)}>
                <option value="auto">Automatic ({logo ? 'H with logo' : 'M'})</option>
                <option value="L">L – smallest code</option>
                <option value="M">M – balanced</option>
                <option value="Q">Q – sturdier</option>
                <option value="H">H – most robust</option>
              </select>
            </div>
          </div>
        </details>
      </div>

      <aside class="space-y-4 md:sticky md:top-20 md:self-start" aria-label="QR code result">
        <div class="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-line bg-white p-2" data-testid="qr-preview">
          <div ref={preview} class={data && !tooLong ? '' : 'hidden'} />
          {!data && <p class="px-6 text-center text-sm text-ink-600">Fill in the details and your QR code appears here.</p>}
          {tooLong && <p class="px-6 text-center text-sm font-bold text-coral-700">That is too much information for one QR code. Please shorten it.</p>}
        </div>
        <p class="chip mx-auto w-fit bg-accent-soft text-accent">Static code · Never expires · No tracking</p>
        {data && !tooLong && (ratio < 3 || inverted) && (
          <Notice kind="warn" testId="contrast-warning">
            {inverted
              ? 'Light dots on a dark background can’t be read by some scanners. Dark dots on a light background are safest.'
              : 'Low contrast: some phones may struggle to scan this. Try darker dots or a lighter background.'}
          </Notice>
        )}
        <div class="grid gap-2">
          <DownloadButton blob={() => exportBlob('png')} filename={`${fileBase}.png`} label="Download PNG" testId="download-png" onSaved={() => markSaved(unsavedId.current)} disabled={!data || tooLong} />
          <DownloadButton blob={() => exportBlob('svg')} filename={`${fileBase}.svg`} label="Download SVG" variant="secondary" testId="download-svg" onSaved={() => markSaved(unsavedId.current)} disabled={!data || tooLong} />
        </div>
        {data && (
          <details class="text-sm">
            <summary class="font-bold text-link">What’s inside the code</summary>
            <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-surface-2 p-3 text-xs" data-testid="qr-payload">{data}</pre>
          </details>
        )}
        <p class="text-xs text-muted">Test your code with a phone before printing it.</p>
      </aside>
    </div>
  );
}
