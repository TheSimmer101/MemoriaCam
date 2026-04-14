import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // TODO: replace with your real sign-up call
      await new Promise((res) => setTimeout(res, 1000));
      router.replace("/(tabs)/dashboard");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase = `w-full rounded-xl px-4 py-3 text-base mb-3 border ${
    isDark
      ? "bg-zinc-800 text-white border-zinc-700"
      : "bg-zinc-100 text-black border-zinc-200"
  }`;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-10">
            {/* Header */}
            <View className="mb-10">
              <Text
                className={`text-4xl font-bold tracking-tight mb-1 ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Create account
              </Text>
              <Text
                className={`text-base ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Start capturing your memories
              </Text>
            </View>

            {/* Error message */}
            {error && (
              <View className="bg-red-100 border border-red-300 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}

            {/* First & Last Name */}
            <View className="flex-row gap-3 mb-0">
              <TextInput
                className={`flex-1 rounded-xl px-4 py-3 text-base mb-3 border ${
                  isDark
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "bg-zinc-100 text-black border-zinc-200"
                }`}
                placeholder="First name"
                placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                textContentType="givenName"
                autoComplete="given-name"
                accessibilityLabel="First name"
              />
              <TextInput
                className={`flex-1 rounded-xl px-4 py-3 text-base mb-3 border ${
                  isDark
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "bg-zinc-100 text-black border-zinc-200"
                }`}
                placeholder="Last name"
                placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                textContentType="familyName"
                autoComplete="family-name"
                accessibilityLabel="Last name"
              />
            </View>

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
              textContentType="newPassword"
              autoComplete="new-password"
              accessibilityLabel="Password"
            />

            {/* Confirm Password */}
            <TextInput
              className={inputBase}
              placeholder="Confirm password"
              placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              accessibilityLabel="Confirm password"
            />

            {/* Password hint */}
            <Text className={`text-xs mb-6 -mt-1 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              Must be at least 8 characters.
            </Text>

            {/* Sign up button */}
            <Pressable
              className={`w-full py-3 rounded-xl items-center active:opacity-70 ${
                loading ? "opacity-50" : ""
              } ${isDark ? "bg-white" : "bg-black"}`}
              onPress={handleSignUp}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text
                className={`text-base font-semibold ${
                  isDark ? "text-black" : "text-white"
                }`}
              >
                {loading ? "Creating account…" : "Create Account"}
              </Text>
            </Pressable>

            {/* Sign in link */}
            <View className="flex-row justify-center mt-6">
              <Text
                className={`text-sm ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Already have an account?{" "}
              </Text>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                <Text
                  className={`text-sm font-semibold underline ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}