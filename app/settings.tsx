import { router } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppColorScheme } from "../context/ThemeContext";

function getUsername(user: any): string {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Guest"
  );
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const darkMode = isDark;
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, []);

  function toggleDarkMode(value: boolean) {
    setColorScheme(value ? "dark" : "light");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      {/* Header */}
      <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text className={`text-sm ${textMuted}`}>← Back</Text>
        </Pressable>
        <Text className={`text-base font-bold tracking-tight ${textPrimary}`}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Account Info */}
        <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Account</Text>
        <View className={`rounded-2xl border mb-6 overflow-hidden ${cardBg} ${cardBorder}`}>
          <View className={`px-4 py-4 border-b ${cardBorder}`}>
            <Text className={`text-xs ${textMuted} mb-0.5`}>Name</Text>
            <Text className={`text-sm font-semibold ${textPrimary}`}>{getUsername(user)}</Text>
          </View>
          <View className="px-4 py-4">
            <Text className={`text-xs ${textMuted} mb-0.5`}>Email</Text>
            <Text className={`text-sm font-semibold ${textPrimary}`}>{user?.email ?? "—"}</Text>
          </View>
        </View>

        {/* Appearance */}
        <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Appearance</Text>
        <View className={`rounded-2xl border mb-6 overflow-hidden ${cardBg} ${cardBorder}`}>
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View>
              <Text className={`text-sm font-semibold ${textPrimary}`}>Dark Mode</Text>
              <Text className={`text-xs ${textMuted}`}>Switch between light and dark theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#d4d4d8", true: "#ffffff" }}
              thumbColor={darkMode ? "#000000" : "#ffffff"}
            />
          </View>
        </View>

        {/* Sign Out */}
        <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Session</Text>
        <View className={`rounded-2xl border mb-6 overflow-hidden ${cardBg} ${cardBorder}`}>
          <Pressable
            onPress={handleSignOut}
            className="px-4 py-4 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
            <Text className={`text-xs ${textMuted}`}>You will be returned to the login screen</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}