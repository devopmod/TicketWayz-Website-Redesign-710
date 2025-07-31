import { createClient } from '@supabase/supabase-js'

// Project ID is auto-injected during deployment
const SUPABASE_URL='https://nxbhaykrrvhrqbpzcyxh.supabase.co'
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YmhheWtycnZocnFicHpjeXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjMwNjQsImV4cCI6MjA2ODU5OTA2NH0.PETm29XpfgmnekbmiYnmY-3SlFzchIV9tofDH6bNPLg'

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})