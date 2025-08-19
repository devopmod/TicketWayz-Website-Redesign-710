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
                  neq() {
                    return {
                      single: async () => ({ data: { id: 1, title: 'Concert', venue: {} }, error: null })
                    };
                  }
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

test('deleteEventCascade reports missing RPC function', async (t) => {
  const mockSupabase = {
    rpc() {
      return Promise.resolve({ data: null, error: { code: 'PGRST100', message: 'Function delete_event_cascade not found' } });
    }
  };

  global.__mockSupabase = mockSupabase;
  global.__mockTicketService = { createEventTickets: async () => ({}) };
  const code = await fs.readFile(new URL('./eventService.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;')
    .replace("import {createEventTickets} from './ticketService';", 'const {createEventTickets} = global.__mockTicketService;');
  const { deleteEventCascade } = await import(
    `data:text/javascript;base64,${Buffer.from(patched).toString('base64')}?missingRpc`
  );

  await assert.rejects(() => deleteEventCascade('1', true), /Функция delete_event_cascade отсутствует/);

  delete global.__mockSupabase;
  delete global.__mockTicketService;
});

test('fetchEvents resolves image URLs', async (t) => {
  const events = [
    { id: 1, title: 'Event 1', image: 'path/to/image1.jpg', venue: {} },
    { id: 2, title: 'Event 2', image: 'http://example.com/img.jpg', venue: {} }
  ];
  const priceMap = {
    1: [{ price: 50 }, { price: 30 }],
    2: [{ price: 40 }]
  };

  const mockSupabase = {
    from(table) {
      if (table === 'events') {
        return {
          select() {
            return {
              order() {
                return Promise.resolve({ data: events, error: null });
              },
              neq() {
                return {
                  order() {
                    return Promise.resolve({ data: events, error: null });
                  }
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
              eq(_, id) {
                return {
                  order() {
                    return Promise.resolve({ data: priceMap[id], error: null });
                  }
                };
              }
            };
          }
        };
      }
      return {};
    },
    storage: {
      from() {
        return {
          getPublicUrl(path) {
            return { data: { publicUrl: `https://storage/${path}` } };
          }
        };
      }
    }
  };

  global.__mockSupabase = mockSupabase;
  global.__mockTicketService = { createEventTickets: async () => ({}) };
  const code = await fs.readFile(new URL('./eventService.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;')
    .replace("import {createEventTickets} from './ticketService';", 'const {createEventTickets} = global.__mockTicketService;');
  const { fetchEvents } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}?fetchEvents`);

  const result = await fetchEvents();
  assert.equal(result.length, 2);
  assert.equal(result[0].image, 'https://storage/path/to/image1.jpg');
  assert.equal(result[1].image, 'http://example.com/img.jpg');
  assert.equal(result[0].price, 30);
  assert.equal(result[1].price, 40);
  delete global.__mockSupabase;
  delete global.__mockTicketService;
});

test('deleteEventCascade allows force deletion with sold tickets', async (t) => {
  let ticketsQueryCount = 0;
  let rpcCalled = 0;
  const mockSupabase = {
    from(table) {
      if (table === 'tickets') {
        ticketsQueryCount++;
        return {
          select() {
            return {
              eq() {
                return {
                  not() {
                    return Promise.resolve({ count: 1, error: null });
                  }
                };
              }
            };
          }
        };
      }
      return {};
    },
    rpc(name) {
      if (name === 'delete_event_cascade') {
        rpcCalled++;
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({});
    }
  };

  global.__mockSupabase = mockSupabase;
  global.__mockTicketService = { createEventTickets: async () => ({}) };
  const code = await fs.readFile(new URL('./eventService.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;')
    .replace("import {createEventTickets} from './ticketService';", 'const {createEventTickets} = global.__mockTicketService;');
  const { deleteEventCascade } = await import(
    `data:text/javascript;base64,${Buffer.from(patched).toString('base64')}?forceDelete`
  );

  await assert.rejects(() => deleteEventCascade('1'), /Невозможно удалить проданные билеты/);
  const result = await deleteEventCascade('1', true);
  assert.equal(ticketsQueryCount, 1); // Second call skips check
  assert.equal(rpcCalled, 1);
  assert.equal(result, null);

  delete global.__mockSupabase;
  delete global.__mockTicketService;
});

test('deleteEventPartial calls RPC without checking sold tickets', async (t) => {
  let rpcCalled = 0;
  let fromCalled = 0;
  let rpcArgs = null;
  const mockSupabase = {
    from() {
      fromCalled++;
      return {};
    },
    rpc(name, args) {
      rpcCalled++;
      rpcArgs = { name, args };
      return Promise.resolve({ data: true, error: null });
    }
  };

  global.__mockSupabase = mockSupabase;
  global.__mockTicketService = { createEventTickets: async () => ({}) };
  const code = await fs.readFile(new URL('./eventService.js', import.meta.url), 'utf8');
  const patched = code
    .replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;')
    .replace("import {createEventTickets} from './ticketService';", 'const {createEventTickets} = global.__mockTicketService;');
  const { deleteEventPartial } = await import(
    `data:text/javascript;base64,${Buffer.from(patched).toString('base64')}?partialRpc`
  );

  const result = await deleteEventPartial(1);
  assert.equal(fromCalled, 0);
  assert.equal(rpcCalled, 1);
  assert.equal(rpcArgs.name, 'delete_event_partial');
  assert.deepEqual(rpcArgs.args, { p_event_id: 1 });
  assert.equal(result, true);

  delete global.__mockSupabase;
  delete global.__mockTicketService;
});
