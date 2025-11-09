import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lyqoguvvbocnpgpkwstm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cW9ndXZ2Ym9jbnBncGt3c3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzA1ODgsImV4cCI6MjA3NzAwNjU4OH0.IWk6SX8Du8hvfxZrDAd-wTkxVVrnDDdGAgRR5NNG2pc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
