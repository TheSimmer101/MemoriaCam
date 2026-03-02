import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://wkqlpfrxviphhyjyxbdl.supabase.co'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY

console.log("Checking Key:", supabaseKey);
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // keep the user logged in
    detectSessionInUrl: true, 
  },
});