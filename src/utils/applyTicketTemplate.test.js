import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTicketTemplate } from './applyTicketTemplate.js';

test('renders reserved seating ticket with accent color', async () => {
  const html = await applyTicketTemplate({
    brand: 'Brand',
    artist: 'Show',
    date: 'Jan 1',
    time: '7 PM',
    venue: 'Venue',
    address: '123 St',
    seat: {
      section: 'A',
      row_number: '1',
      seat_number: '1',
      gate: 'G1',
      price: '50',
      id: 'ID1',
    },
    currency: 'USD',
    terms: 'No refunds',
    accent: '#00ff00',
    showQr: false,
  });
  assert.ok(html.includes('background-color:#00ff00'));
  assert.ok(html.includes('SECTION'));
  assert.ok(html.includes('PRICE'));
  assert.ok(html.includes('50 USD'));
  assert.ok(html.includes('No refunds'));
});

test('renders general admission ticket without seat info', async () => {
  const html = await applyTicketTemplate({
    brand: 'Brand',
    artist: 'Show',
    date: 'Jan 1',
    time: '7 PM',
    venue: 'Venue',
    address: '123 St',
    price: '50',
    currency: 'USD',
    ticketId: 'IDGA',
    terms: 'No refunds',
    showQr: false,
  });
  assert.ok(html.includes('ADMISSION'));
  assert.ok(html.includes('GA'));
  assert.ok(html.includes('50 USD'));
  assert.ok(html.includes('No refunds'));
});

test('hides price and terms when toggled off', async () => {
  const html = await applyTicketTemplate({
    brand: 'Brand',
    artist: 'Show',
    terms: 'No refunds',
    showPrice: false,
    showTerms: false,
    showQr: false,
  });
  assert.ok(!html.includes('PRICE'));
  assert.ok(!html.includes('No refunds'));
});
