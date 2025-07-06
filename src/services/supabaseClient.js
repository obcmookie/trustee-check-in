// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://iykhgxplmzbditybtwyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a2hneHBsbXpiZGl0eWJ0d3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NTI2NDEsImV4cCI6MjA2NzMyODY0MX0.cjfRUWVgt1SbWyHnr_Ak66IlTMj4x92NfrfNmpySXYQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
