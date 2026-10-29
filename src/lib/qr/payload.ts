// Builds the text that goes inside a QR code for each content type.
// Everything here follows the de-facto formats that phone cameras understand.

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

/** Escapes the special characters of the WIFI: format (\ ; , " :) with a backslash. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,":])/g, '\\$1');
}

export function wifiPayload(o: { ssid: string; password: string; security: WifiSecurity; hidden: boolean }): string {
  let out = `WIFI:T:${o.security};S:${escapeWifi(o.ssid)};`;
  if (o.security !== 'nopass') out += `P:${escapeWifi(o.password)};`;
  if (o.hidden) out += 'H:true;';
  return `${out};`;
}

/** Keeps only digits from a phone number, dropping "+", spaces, dashes and a leading international "00". */
export function digitsOnly(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return phone.trim().startsWith('00') ? d.replace(/^00/, '') : d;
}

/** Normalizes a number for tel:/SMS links, keeping a leading "+". */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith('+') || trimmed.startsWith('00');
  const d = digitsOnly(trimmed);
  return plus ? `+${d}` : d;
}

export function whatsappPayload(o: { phone: string; message: string }): string {
  const base = `https://wa.me/${digitsOnly(o.phone)}`;
  return o.message ? `${base}?text=${encodeURIComponent(o.message)}` : base;
}

export function emailPayload(o: { to: string; subject: string; body: string }): string {
  const params: string[] = [];
  if (o.subject) params.push(`subject=${encodeURIComponent(o.subject)}`);
  if (o.body) params.push(`body=${encodeURIComponent(o.body)}`);
  return `mailto:${o.to.trim()}${params.length ? `?${params.join('&')}` : ''}`;
}

export function phonePayload(phone: string): string {
  return `tel:${normalizePhone(phone)}`;
}

export function smsPayload(o: { phone: string; message: string }): string {
  return `SMSTO:${normalizePhone(o.phone)}:${o.message}`;
}

/** Adds https:// when someone types a bare domain like "example.com". */
export function urlPayload(input: string): string {
  const v = input.trim();
  if (!v) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  if (/^[^\s/]+\.[^\s/]{2,}/.test(v)) return `https://${v}`;
  return v;
}

export interface VCard {
  firstName: string;
  lastName: string;
  org: string;
  title: string;
  mobile: string;
  workPhone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  note: string;
}

/** Escapes text values for vCard 3.0 (backslash, comma, semicolon, newlines). */
export function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n');
}

export function vcardPayload(c: VCard): string {
  const e = escapeVCard;
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(c.lastName)};${e(c.firstName)};;;`];
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
  lines.push(`FN:${e(full || c.org || 'Contact')}`);
  if (c.org) lines.push(`ORG:${e(c.org)}`);
  if (c.title) lines.push(`TITLE:${e(c.title)}`);
  if (c.mobile) lines.push(`TEL;TYPE=CELL:${normalizePhone(c.mobile)}`);
  if (c.workPhone) lines.push(`TEL;TYPE=WORK:${normalizePhone(c.workPhone)}`);
  if (c.email) lines.push(`EMAIL:${c.email.trim()}`);
  if (c.website) lines.push(`URL:${urlPayload(c.website)}`);
  if (c.street || c.city || c.region || c.postcode || c.country) {
    lines.push(`ADR;TYPE=WORK:;;${e(c.street)};${e(c.city)};${e(c.region)};${e(c.postcode)};${e(c.country)}`);
  }
  if (c.note) lines.push(`NOTE:${e(c.note)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * The QR library writes one byte per character. Converting to a string of UTF-8
 * bytes first makes accents, emoji and non-Latin text come out correctly.
 */
export function toUtf8ByteString(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let out = '';
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
}

/** Approximate byte-mode capacity of the largest QR code (version 40) per error-correction level. */
export const QR_CAPACITY = { L: 2953, M: 2331, Q: 1663, H: 1273 } as const;
