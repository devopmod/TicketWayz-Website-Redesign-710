import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

function createMockSupabase() {
  const db = {
    tickets: [
      { id: 't1', event_id: 1, status: 'free', zone: { category: { id: 1 } }, seat: null, order_item_id: null }
    ],
    event_prices: [
      { event_id: 1, category_id: 1, price: 50, currency: 'EUR' }
    ],
    orders: [],
    order_items: [],
    user_meta: []
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } } })
    },
    from(table) {
      switch (table) {
        case 'tickets':
          return {
            select(fields) {
              return {
                eq(column, value) {
                  if (column === 'id') {
                    const ticket = db.tickets.find(t => t.id === value);
                    return { single: async () => ({ data: ticket, error: null }) };
                  }
                  if (column === 'event_id') {
                    const tickets = db.tickets.filter(t => t.event_id === value);
                    const data = fields === 'status'
                      ? tickets.map(t => ({ status: t.status }))
                      : tickets;
                    return Promise.resolve({ data, error: null });
                  }
                },
                in(column, values) {
                  if (column === 'id') {
                    const tickets = db.tickets.filter(t => values.includes(t.id));
                    if (fields === 'event_id') {
                      const data = tickets.map(t => ({ event_id: t.event_id }));
                      return Promise.resolve({ data, error: null });
                    }
                    return Promise.resolve({ data: tickets, error: null });
                  }
                }
              };
            },
            update(updateValues) {
              return {
                eq(column, value) {
                  if (column === 'id') {
                    const ticket = db.tickets.find(t => t.id === value);
                    Object.assign(ticket, updateValues);
                  }
                  return { then: (resolve) => resolve({ error: null }) };
                },
                in(column, ids) {
                  if (column === 'id') {
                    db.tickets.filter(t => ids.includes(t.id)).forEach(t => Object.assign(t, updateValues));
                  }
                  return { then: (resolve) => resolve({ error: null }) };
                }
              };
            }
          };
        case 'event_prices':
          return {
            select() {
              return {
                eq(col1, val1) {
                  return {
                    eq(col2, val2) {
                      const price = db.event_prices.find(p => p.event_id === val1 && p.category_id === val2);
                      return { single: async () => ({ data: price, error: null }) };
                    }
                  };
                }
              };
            }
          };
        case 'orders':
          return {
            insert(values) {
              const order = { ...values, id: 'o' + (db.orders.length + 1) };
              db.orders.push(order);
              return {
                select() {
                  return { single: async () => ({ data: order, error: null }) };
                }
              };
            },
            update(values) {
              return {
                eq(column, id) {
                  const order = db.orders.find(o => o.id === id);
                  Object.assign(order, values);
                  return {
                    select() {
                      return { single: async () => ({ data: order, error: null }) };
                    },
                    then: (resolve) => resolve({ error: null })
                  };
                }
              };
            }
          };
        case 'order_items':
          return {
            insert(values) {
              const item = { ...values, id: 'oi' + (db.order_items.length + 1) };
              db.order_items.push(item);
              return {
                select() {
                  return { single: async () => ({ data: item, error: null }) };
                }
              };
            },
            select() {
              return {
                eq(column, value) {
                  if (column === 'order_id') {
                    const items = db.order_items.filter(oi => oi.order_id === value)
                      .map(({ id, ticket_id }) => ({ id, ticket_id }));
                    return Promise.resolve({ data: items, error: null });
                  }
                }
              };
            }
          };
        case 'user_meta':
          return {
            upsert(record) {
              db.user_meta.push(record);
              return {
                select() {
                  return { single: async () => ({ data: record, error: null }) };
                }
              };
            }
          };
        default:
          return {};
      }
    }
  };
}

test('purchase → unavailability → refund → availability', async () => {
  const mockSupabase = createMockSupabase();
  global.__mockSupabase = mockSupabase;
  const code = await fs.readFile(new URL('./ticketService.js', import.meta.url), 'utf8');
  const patched = code.replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;');
  const { purchaseTickets, refundOrder, getTicketsStatistics } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);

  const initial = await getTicketsStatistics(1);
  assert.equal(initial.free, 1);

  const orderData = { email: 'test@example.com', firstName: 'A', lastName: 'B', totalPrice: 50 };
  const purchase = await purchaseTickets(['t1'], orderData);
  const afterPurchase = await getTicketsStatistics(1);
  assert.equal(afterPurchase.free, 0);

  const refund = await refundOrder(purchase.order.id);
  assert.equal(refund.stats[0].free, 1);
  const afterRefund = await getTicketsStatistics(1);
  assert.equal(afterRefund.free, 1);

  delete global.__mockSupabase;
});

