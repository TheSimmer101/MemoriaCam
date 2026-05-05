import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    // Supabase automatically detects the session from the URL
    // _layout.tsx onAuthStateChange will fire and navigate to dashboard
    supabase.auth.getSession();
  }, []);

  return null;
}