import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTicketTemplate } from './applyTicketTemplate.js';

test('applyTicketTemplate renders ticket template with provided data', async () => {
  const html = await applyTicketTemplate({
    brand: 'MyBrand',
    artist: 'Show',
    seat: 10,
    price: 50,
    qrValue: 'QRDATA',
    ticketId: 'ID123',
    terms: 'No refunds',
  });
  assert.ok(html.includes('ticket w-[560px]'));
  assert.ok(html.includes('MyBrand'));
  assert.ok(html.includes('Show'));
  assert.ok(html.includes('10'));
  assert.ok(html.includes('50'));
  assert.ok(html.includes('No refunds'));
});
