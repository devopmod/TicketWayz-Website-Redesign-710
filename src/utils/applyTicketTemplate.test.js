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
  const expected = `<div class="ticket w-[560px] bg-white text-gray-900 font-sans border rounded-lg overflow-hidden shadow-md"><div class="relative h-40 w-full"><div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div><span class="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded" style="background-color:#00ff00">Brand</span></div><div class="p-6 space-y-2"><h1 class="text-2xl font-bold">Show</h1><div class="text-sm text-gray-600">Jan 1 7 PM</div><div class="text-sm">Venue</div><div class="text-sm text-gray-500">123 St</div><div class="mt-6 grid grid-cols-5 gap-4 text-center"><div><div class="text-xs text-gray-500">SECTION</div><div class="text-lg font-semibold">A</div></div><div><div class="text-xs text-gray-500">ROW</div><div class="text-lg font-semibold">1</div></div><div><div class="text-xs text-gray-500">SEAT</div><div class="text-lg font-semibold">1</div></div><div><div class="text-xs text-gray-500">GATE</div><div class="text-lg font-semibold">G1</div></div><div><div class="text-xs text-gray-500">PRICE</div><div class="text-lg font-semibold">50 USD</div></div></div><div class="mt-6 text-[10px] text-gray-500">No refunds</div></div></div>`;
  assert.equal(html, expected);
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
  const expected = `<div class="ticket w-[560px] bg-white text-gray-900 font-sans border rounded-lg overflow-hidden shadow-md"><div class="relative h-40 w-full"><div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div><span class="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded" style="background-color:#000000b3">Brand</span></div><div class="p-6 space-y-2"><h1 class="text-2xl font-bold">Show</h1><div class="text-sm text-gray-600">Jan 1 7 PM</div><div class="text-sm">Venue</div><div class="text-sm text-gray-500">123 St</div><div class="mt-6 grid grid-cols-5 gap-4 text-center"><div><div class="text-xs text-gray-500">PRICE</div><div class="text-lg font-semibold">50 USD</div></div></div><div class="mt-6 text-[10px] text-gray-500">No refunds</div></div></div>`;
  assert.equal(html, expected);
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
  const expected = `<div class="ticket w-[560px] bg-white text-gray-900 font-sans border rounded-lg overflow-hidden shadow-md"><div class="relative h-40 w-full"><div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div><span class="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded" style="background-color:#000000b3">Brand</span></div><div class="p-6 space-y-2"><h1 class="text-2xl font-bold">Show</h1><div class="mt-6 grid grid-cols-4 gap-4 text-center"></div></div></div>`;
  assert.equal(html, expected);
});
