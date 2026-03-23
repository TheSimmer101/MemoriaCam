import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import SlidingSquare, { SignOutButton, EmailLogin, EmailSignUp } from '@/components/ui/authMenu';
// //  helper for Native OAuth
// WebBrowser.maybeCompleteAuthSession(); 

// export function EmailAuth() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleEmailLogin = async () => {
//     const { data:loginData, error:loginError } = await supabase.auth.signInWithPassword({
//       email: email,
//       password: password,
//     });
//     if (loginError && loginError.message.includes("Invalid login credentials")) {
//       console.log("User not found, attempting to create account...");
      
//       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//         email: email,
//         password: password,
//       });
//       if (signUpError) console.error(signUpError.message);
//       else console.log("User signed in:", signUpData.user);
//     }
//   };
  
//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 10 }}> 
//       <View style={{ 
//         borderWidth: 2, 
//         borderColor: '#333', 
//         padding: 20, 
//         borderRadius: 15, 
//         width: 340,
//         backgroundColor: '#fff' 
//       }}>
//         <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={email} onChangeText={setEmail} placeholder="Email" />
//         <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
//         <Button color = "black" title="Sign in or Sign Up" onPress={handleEmailLogin} />
//       </View>
//     </View>
//   );
// }

// export function LoginButton() {
//   const handleLogin = async () => {
//     if (Platform.OS === 'web') {
//       // Web: simple redirect
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: { redirectTo: window.location.origin },
//       });
//       if (error) console.error("Login error:", error.message);
      

//     } else {
//       const redirectTo = Linking.createURL('/', { scheme: 'memoriacam' });
//       console.log("Redirect URI:", redirectTo);

//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo,
//           skipBrowserRedirect: true, // crucial — don't auto-redirect, we handle it
//         },
//       });

//       if (error) { console.error("OAuth error:", error.message); return; }

//       if (data?.url) {
//         const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

//         if (result.type === 'success' && result.url) {
//           // Supabase returns tokens as hash fragments (#access_token=...) not query params
//           const url = result.url;
//           const params = new URLSearchParams(url.split('#')[1]);
//           const accessToken = params.get('access_token');
//           const refreshToken = params.get('refresh_token');

//           if (accessToken && refreshToken) {
//             await supabase.auth.setSession({
//               access_token: accessToken,
//               refresh_token: refreshToken,
//             });
//           } else {
//             console.error("Missing tokens in redirect URL:", url);
//           }
//         }
//       }
//     }
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Button title="Sign in with Google" onPress={handleLogin} />
//     </View>
//   );
// }
// export function SignOutButton() {
//   const handleSignOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) console.error("Error signing out:", error.message);
//     else console.log("User signed out successfully");
//   };

//   return (
//     <View style={{ paddingVertical: 10 }}>
//       <Button title="Sign Out" onPress={handleSignOut} color="#FF3B30" /> 
//     </View>
//   );
// }

export default function HomeScreen() {
    const [user, setUser] = useState<User | null>(null);
//  const displayEmail = user?.user_metadata?.email || user?.email || "Guest";
  useEffect(() => {
    // 1. Check if a user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      console.log("Auth Event:", event);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView>
        {user ? (
          <ThemedText type="subtitle">
            ✅ Welcome,
          </ThemedText>
        ) : null}
      </ThemedView>
      <View style={styles.container}>
      {/* 3. Logic: If no user, show the box. If user exists, show a welcome message. */}
      {!user ? (
        <View style={styles.authWrapper}>
          <Text style={styles.title}>Welcome to MemoriaCam</Text>
          
          {/* We pass setUser into the 'onSuccessfulLogin' prop */}
          <SlidingSquare onSuccessfulLogin={(userData) => setUser(userData)} />
        </View>
      ) : (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hello, {user.email}!</Text>
          
          {/* Pass setUser back in so the SignOut button can set it to null */}
          <SignOutButton onSuccessfulLogin={() => setUser(null)} />
        </View>
      )}
    </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  authWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 20,
  },
});
