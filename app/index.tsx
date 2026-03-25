import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}
      edges={["bottom"]}
    >
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className={`text-3xl font-bold mb-2 tracking-tight ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          MemoriaCam
        </Text>

        <Text
          className={`text-base mb-10 text-center ${
            isDark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          Your memories, beautifully captured.
        </Text>

        <Pressable
          className={`w-full max-w-xs py-3 rounded-xl items-center active:opacity-70 ${
            isDark ? "bg-white" : "bg-black"
          }`}
          onPress={() => router.push("/modal")}
          accessibilityRole="button"
          accessibilityLabel="Open modal"
        >
          <Text
            className={`text-base font-semibold ${
              isDark ? "text-black" : "text-white"
            }`}
          >
            Open Modal
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}