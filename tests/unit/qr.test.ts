import { describe, expect, it } from 'vitest';
import { emailPayload, escapeWifi, phonePayload, smsPayload, toUtf8ByteString, urlPayload, vcardPayload, whatsappPayload, wifiPayload } from '../../src/lib/qr/payload';

describe('QR payloads', () => {
  it('escapes WiFi special characters', () => {
    expect(escapeWifi('a;b,c"d:e\\f')).toBe('a\\;b\\,c\\"d\\:e\\\\f');
    expect(wifiPayload({ ssid: 'Café;Net', password: 'p:w', security: 'WPA', hidden: true })).toBe('WIFI:T:WPA;S:Café\\;Net;P:p\\:w;H:true;;');
    expect(wifiPayload({ ssid: 'Open', password: 'ignored', security: 'nopass', hidden: false })).toBe('WIFI:T:nopass;S:Open;;');
  });
  it('builds WhatsApp links with digits only', () => {
    expect(whatsappPayload({ phone: '+1 (555) 123-4567', message: 'Hi there! Is this available?' })).toBe(
      'https://wa.me/15551234567?text=Hi%20there!%20Is%20this%20available%3F',
    );
    expect(whatsappPayload({ phone: '0044 20 7946 0958', message: '' })).toBe('https://wa.me/442079460958');
  });
  it('builds mailto, tel and SMS payloads', () => {
    expect(emailPayload({ to: 'hello@example.com', subject: 'Quote request', body: 'Hi & thanks' })).toBe(
      'mailto:hello@example.com?subject=Quote%20request&body=Hi%20%26%20thanks',
    );
    expect(phonePayload('+44 20 7946 0958')).toBe('tel:+442079460958');
    expect(smsPayload({ phone: '+44 20 7946 0958', message: 'Running late' })).toBe('SMSTO:+442079460958:Running late');
  });
  it('adds https to bare domains only', () => {
    expect(urlPayload('example.com/path')).toBe('https://example.com/path');
    expect(urlPayload('http://x.org')).toBe('http://x.org');
    expect(urlPayload('just some text')).toBe('just some text');
  });
  it('builds a vCard 3.0 with escaping', () => {
    const v = vcardPayload({
      firstName: 'Ana',
      lastName: 'Pérez',
      org: 'Hugs, Inc.',
      title: '',
      mobile: '+34 600 111 222',
      workPhone: '',
      email: 'ana@example.com',
      website: 'example.com',
      street: '',
      city: 'Madrid',
      region: '',
      postcode: '',
      country: 'Spain',
      note: '',
    });
    expect(v.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Pérez;Ana;;;',
      'FN:Ana Pérez',
      'ORG:Hugs\\, Inc.',
      'TEL;TYPE=CELL:+34600111222',
      'EMAIL:ana@example.com',
      'URL:https://example.com',
      'ADR;TYPE=WORK:;;;Madrid;;;Spain',
      'END:VCARD',
    ]);
  });
  it('escapes vCard special characters', async () => {
    const { escapeVCard } = await import('../../src/lib/qr/payload');
    expect(escapeVCard('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
  });
  it('turns text into UTF-8 bytes for the QR encoder', () => {
    expect(toUtf8ByteString('é')).toBe('\u00c3\u00a9');
    expect(toUtf8ByteString('abc')).toBe('abc');
  });
});
