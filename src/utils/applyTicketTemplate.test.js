import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTicketTemplate } from './applyTicketTemplate.js';

test('applyTicketTemplate renders ticket details', async () => {
  const html = await applyTicketTemplate({
    brand: 'MyBrand',
    artist: 'Show',
    date: '2025-08-13',
    time: '20:25',
    venue: 'Venue',
    address: '123 Street',
    section: 'SEC',
    row: 'ROW',
    seat: '10',
    gate: 'G1',
    price: '50',
    currency: '$',
    qrValue: 'QRDATA',
    ticketId: 'ID123',
    terms: 'No refunds',
  });
  assert.ok(html.includes('MyBrand'));
  assert.ok(html.includes('Show'));
  assert.ok(html.includes('G1'));
  assert.ok(html.includes('50'));
  assert.ok(html.includes('No refunds'));
});
