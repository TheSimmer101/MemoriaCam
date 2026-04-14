import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wkqlpfrxviphhyjyxbdl.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: isNative ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !isNative,
  },
});