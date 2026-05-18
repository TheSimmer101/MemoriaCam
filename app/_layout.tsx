import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ThemeProvider as AppThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedApp />
    </AppThemeProvider>
  );
}

function ThemedApp() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setIsAuthenticated(!!session);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        hasNavigated.current = false;
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;
    if (isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace('/(tabs)/dashboard');
    } else if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="new-recording" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Details" }} />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}