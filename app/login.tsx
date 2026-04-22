import { Platform, Text, View, StyleSheet } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router'; // Add this
import { supabase } from '../lib/supabase'; // Adjusted path for app/ folder
import SlidingSquare, { SignOutButton } from '@/components/ui/authMenu';

export default function LoginScreen() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        router.replace('/(tabs)'); // Go to app if already logged in
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        router.replace('/(tabs)/dashboard'); // Automatically move to tabs on success
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.mainContainer}>
      {/* Left black panel — web only */}
      {Platform.OS === 'web' && (
        <View style={styles.leftPanel}>
          <Text style={styles.title}>MemoriaCam</Text>
          <Text style={styles.subtitle}>Record your memories, through video and text.</Text>
        </View>
      )}

      {/* Right panel */}
      <View style={styles.rightPanel}>
        {user ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>Hello, {user.email}!</Text>
            <SignOutButton onSuccessfulLogin={() => setUser(null)} />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.welcomeText}>Welcome to MemoriaCam</Text>
            <SlidingSquare onSuccessfulLogin={(userData) => {
              setUser(userData);
              if (userData) router.replace('/(tabs)');
            }} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});