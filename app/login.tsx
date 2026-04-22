import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((res) => setTimeout(res, 1000));
      router.replace("/(tabs)/dashboard");
    } catch (e) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase = `w-full rounded-xl px-4 py-3 text-base mb-3 border ${
    isDark
      ? "bg-zinc-800 text-white border-zinc-700 placeholder:text-zinc-500"
      : "bg-zinc-100 text-black border-zinc-200 placeholder:text-zinc-400"
  }`;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-10">
            <Text
              className={`text-4xl font-bold tracking-tight mb-1 ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              MemoriaCam
            </Text>
            <Text
              className={`text-base ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Sign in to continue
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <View className="bg-red-100 border border-red-300 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

          {/* Email */}
          <TextInput
            className={inputBase}
            placeholder="Email"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            accessibilityLabel="Email address"
          />

          {/* Password */}
          <TextInput
            className={inputBase}
            placeholder="Password"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            accessibilityLabel="Password"
          />

          {/* Forgot password */}
          <Pressable
            className="self-end mb-6 active:opacity-50"
            onPress={() => { /* TODO: navigate to forgot password */ }}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text
              className={`text-sm ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Forgot password?
            </Text>
          </Pressable>

          {/* Login button */}
          <Pressable
            className={`w-full py-3 rounded-xl items-center active:opacity-70 ${
              loading ? "opacity-50" : ""
            } ${isDark ? "bg-white" : "bg-black"}`}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text
              className={`text-base font-semibold ${
                isDark ? "text-black" : "text-white"
              }`}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Text>
          </Pressable>

          {/* Dev shortcut */}
          <Pressable
            className="mt-4 py-2"
            onPress={() => router.push("/dashboard")}
          >
            <Text className="underline">Skip to Dashboard (dev)</Text>
          </Pressable>

          {/* Sign up link */}
          <View className="flex-row justify-center mt-6">
            <Text
              className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
            >
              Don't have an account?{" "}
            </Text>
            <Pressable
              onPress={() => router.push("/sign-up")}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
            >
              <Text
                className={`text-sm font-semibold underline ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Sign up
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}