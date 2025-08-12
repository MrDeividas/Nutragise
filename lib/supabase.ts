import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gtnjrauujrzkesaulius.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bmpyYXV1anJ6a2VzYXVsaXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDU2NTEsImV4cCI6MjA2NzgyMTY1MX0.R8yDGr3ZvcwDHLw_hFbyhu-VtvPt6PqlsHUJm2Ps1-k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 