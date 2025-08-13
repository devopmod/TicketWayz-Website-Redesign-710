import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTicketTemplate } from './applyTicketTemplate.js';
import { rename } from 'node:fs/promises';

test('applyTicketTemplate inserts ticket details', async () => {
  const html = await applyTicketTemplate({
    brand: 'MyBrand',
    artist: 'Show',
    dateTime: '2025-08-13T20:25:00Z',
    venue: 'Venue',
    address: '123 Street',
    section: 'SEC',
    row: 'ROW',
    seat: '10',
    price: '$50',
  });

  assert.ok(html.includes('Show'));
  assert.ok(html.includes('MyBrand'));
  assert.ok(html.includes('SECTION'));
  assert.ok(html.includes('SEC'));
  assert.ok(html.includes('ROW'));
  assert.ok(html.includes('10'));
});

test('applyTicketTemplate returns fallback HTML when template is missing', async () => {
  const original = new URL('../templates/ticket.html', import.meta.url);
  const backup = new URL('../templates/ticket.html.bak', import.meta.url);
  await rename(original, backup);
  try {
    const html = await applyTicketTemplate();
    assert.ok(html.includes('Ticket template unavailable'));
  } finally {
    await rename(backup, original);
  }
});
