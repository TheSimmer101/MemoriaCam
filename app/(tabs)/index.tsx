import { Platform, Text, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import SlidingSquare, { SignOutButton } from '@/components/ui/authMenu';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, flexDirection: 'row', minHeight: '100%' }}>

      {/* Left black panel — web only */}
      {Platform.OS === 'web' && (
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>MemoriaCam</Text>
          <Text style={{ color: '#aaa', fontSize: 16, textAlign: 'center' }}>Record your memories, through video and text.</Text>
        </View>
      )}

      {/* Right panel */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        {user ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>Hello, {user.email}!</Text>
            <SignOutButton onSuccessfulLogin={() => setUser(null)} />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Welcome to MemoriaCam</Text>
            <SlidingSquare onSuccessfulLogin={(userData) => setUser(userData)} />
          </View>
        )}
      </View>

    </View>
  );
}