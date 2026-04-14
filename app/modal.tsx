import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`flex-1 items-center justify-center px-6 ${
        isDark ? "bg-zinc-900" : "bg-white"
      }`}
    >
      <Text
        className={`text-2xl font-bold mb-3 tracking-tight ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        This is a modal
      </Text>

      <Text
        className={`text-sm text-center mb-10 ${
          isDark ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        You can display content, actions, or details here.
      </Text>

      {/* Dismiss modal and go to home */}
      <Pressable
        className={`w-full max-w-xs py-3 rounded-xl items-center active:opacity-70 ${
          isDark ? "bg-white" : "bg-black"
        }`}
        onPress={() => router.dismiss()}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <Text
          className={`text-base font-semibold ${
            isDark ? "text-black" : "text-white"
          }`}
        >
          Close
        </Text>
      </Pressable>

      {/* Optional: navigate to login (e.g. sign out flow) */}
      <Pressable
        className="mt-4 py-2"
        onPress={() => router.replace("/login" as any)}
        accessibilityRole="button"
        accessibilityLabel="Go to login screen"
      >
        <Text
          className={`text-sm underline ${
            isDark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          Go to login
        </Text>
      </Pressable>
    </View>
  );
}