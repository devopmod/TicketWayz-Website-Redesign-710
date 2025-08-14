import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Extract sanitizeTicket from the JSX file without parsing the entire React component
const loadSanitizeTicket = async () => {
  const code = await fs.readFile(new URL('./TicketTemplate.jsx', import.meta.url), 'utf8');
  const start = code.indexOf('const toStr');
  const end = code.indexOf('const SafeText');
  const snippet = code.slice(start, end);
  return import(`data:text/javascript;base64,${Buffer.from(snippet).toString('base64')}`);
};

test('sanitizeTicket preserves heroImage strings', async () => {
  const { sanitizeTicket } = await loadSanitizeTicket();
  const base64 = 'data:image/png;base64,ABC123';
  const url = 'https://example.com/image.jpg';
  assert.equal(sanitizeTicket({ heroImage: base64 }).heroImage, base64);
  assert.equal(sanitizeTicket({ heroImage: url }).heroImage, url);
});

test('sanitizeTicket preserves qrImage strings', async () => {
  const { sanitizeTicket } = await loadSanitizeTicket();
  const base64 = 'data:image/png;base64,DEF456';
  const url = 'https://example.com/qr.png';
  assert.equal(sanitizeTicket({ qrImage: base64 }).qrImage, base64);
  assert.equal(sanitizeTicket({ qrImage: url }).qrImage, url);
});

test('sanitizeTicket stringifies qrValue', async () => {
  const { sanitizeTicket } = await loadSanitizeTicket();
  assert.equal(sanitizeTicket({ qrValue: 123 }).qrValue, '123');
});

test('sanitizeTicket stringifies ticketId', async () => {
  const { sanitizeTicket } = await loadSanitizeTicket();
  assert.equal(sanitizeTicket({ ticketId: 456 }).ticketId, '456');
});

test('sanitizeTicket extracts seat identifiers', async () => {
  const { sanitizeTicket } = await loadSanitizeTicket();
  assert.equal(sanitizeTicket({ seat: { seat_number: 7 } }).seat, '7');
  assert.equal(sanitizeTicket({ seat: { label: 'VIP' } }).seat, 'VIP');
  assert.equal(
    sanitizeTicket({ seat: { seat: { seat_number: 9 } } }).seat,
    '9',
  );
  assert.equal(
    sanitizeTicket({ seat: { seat: { label: 'A1' } } }).seat,
    'A1',
  );
  assert.equal(sanitizeTicket({ seat: {} }).seat, undefined);
});
