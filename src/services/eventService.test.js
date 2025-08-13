import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('fetchEventById returns event with prices', async (t) => {
  const mockSupabase = {
    from(table) {
      if (table === 'events') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: { id: 1, title: 'Concert', venue: {} }, error: null })
                };
              }
            };
          }
        };
      }
      if (table === 'event_prices') {
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({ data: [{ price: 50 }, { price: 30 }], error: null });
              }
            };
          }
        };
      }
      return {};
    }
  };

  global.__mockSupabase = mockSupabase;
  global.__mockTicketService = { createEventTickets: async () => ({}) };
  const code = await fs.readFile(new URL('./eventService.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;')
    .replace("import {createEventTickets} from './ticketService';", 'const {createEventTickets} = global.__mockTicketService;');
  const { fetchEventById } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);

  const result = await fetchEventById(1);
  assert.equal(result.id, 1);
  assert.equal(result.price, 30);
  assert.equal(result.prices.length, 2);
  delete global.__mockSupabase;
  delete global.__mockTicketService;
});
