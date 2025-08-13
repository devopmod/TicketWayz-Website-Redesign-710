import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('createEventTickets calls RPC and returns data', async (t) => {
  const rpcCalls = [];
  const mockSupabase = {
    rpc: async (fn, params) => {
      rpcCalls.push({ fn, params });
      return { data: { success: true }, error: null };
    }
  };

  global.__mockSupabase = mockSupabase;
  const code = await fs.readFile(new URL('./ticketService.js', import.meta.url), 'utf8');
  const patched = code.replace("import supabase from '../lib/supabase';", 'const supabase = global.__mockSupabase;');
  const { createEventTickets } = await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);

  const result = await createEventTickets(42);
  assert.deepEqual(result, { success: true });
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].fn, 'create_event_tickets');
  assert.deepEqual(rpcCalls[0].params, { p_event_id: 42 });
  delete global.__mockSupabase;
});
