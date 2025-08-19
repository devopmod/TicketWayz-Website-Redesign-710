import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xfhcjsabfjlzkmuvqhih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaGNqc2FiZmpsemttdXZxaGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjY5ODQsImV4cCI6MjA3MTA0Mjk4NH0.IUtoYPgswP07BzNUr5JRiY73pydQ-wexr8YYSaWvBV0';

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
