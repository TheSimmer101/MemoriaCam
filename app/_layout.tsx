import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Auth screens — no tab bar */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />

          {/* Tab navigator lives here */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* New Recording screen */}
          <Stack.Screen name="new-recording" options={{ headerShown: false }} />

          {/* Modal — sits above tabs */}
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Details" }}
          />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}