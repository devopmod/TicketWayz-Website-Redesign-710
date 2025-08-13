import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTicketTemplate } from './applyTicketTemplate.js';

test('applyTicketTemplate inserts event and seat info', async () => {
  const order = {
    event: { title: 'Show', date: '2025-08-13T20:25:00Z', location: 'Venue' },
    company: { name: 'MyBrand' },
    orderNumber: '123',
    price: '$50'
  };
  const seat = { section: 'SEC', row_number: 'ROW', seat_number: '10', price: '$50' };
  const html = await applyTicketTemplate({ order, seat, settings: {} });
  assert.ok(html.includes('Show'));
  assert.ok(html.includes('MyBrand'));
  assert.ok(html.includes('SECTION'));
  assert.ok(html.includes('SEC'));
  assert.ok(html.includes('ROW'));
  assert.ok(html.includes('10'));
});
