import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 16) / 3;
const PAGE_SIZE = 6;

// --- Placeholder data ---
const STATS = [
  { id: "recordings", icon: "🎥", value: "24", label: "Total Recordings", sublabel: "This month" },
  { id: "time", icon: "🕐", value: "3h 42m", label: "Recording Time", sublabel: "Total time" },
  { id: "streak", icon: "🔥", value: "12", label: "Day Streak", sublabel: "Keep it up!" },
];

type Recording = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  tags: string[];
};

const ALL_RECORDINGS: Recording[] = [
  { id: "1", title: "Morning Reflection", date: "January 15, 2025", time: "8:30 AM", duration: "5:24", tags: ["gratitude", "morning"] },
  { id: "2", title: "Weekend Goals", date: "January 14, 2025", time: "6:15 PM", duration: "8:12", tags: ["planning", "goals"] },
  { id: "3", title: "Quick Thoughts", date: "January 13, 2025", time: "2:20 PM", duration: "3:45", tags: ["ideas"] },
  { id: "4", title: "Work Reflection", date: "January 12, 2025", time: "5:45 PM", duration: "6:58", tags: ["work", "reflection"] },
  { id: "5", title: "Evening Gratitude", date: "January 11, 2025", time: "9:00 PM", duration: "4:33", tags: ["gratitude", "evening"] },
  { id: "6", title: "Personal Growth", date: "January 10, 2025", time: "7:30 AM", duration: "7:21", tags: ["growth", "well-care"] },
  { id: "7", title: "Sunday Reset", date: "January 9, 2025", time: "10:00 AM", duration: "4:10", tags: ["self-care", "weekly"] },
  { id: "8", title: "Creative Session", date: "January 8, 2025", time: "3:45 PM", duration: "9:02", tags: ["creativity"] },
  { id: "9", title: "Late Night Thoughts", date: "January 7, 2025", time: "11:15 PM", duration: "6:30", tags: ["reflection", "night"] },
  { id: "10", title: "Workout Log", date: "January 6, 2025", time: "7:00 AM", duration: "3:55", tags: ["fitness", "health"] },
  { id: "11", title: "Weekly Review", date: "January 5, 2025", time: "6:00 PM", duration: "11:20", tags: ["planning", "weekly"] },
  { id: "12", title: "New Year Energy", date: "January 4, 2025", time: "9:30 AM", duration: "5:48", tags: ["goals", "motivation"] },
];

function RecordingCard({ item, isDark }: { item: Recording; isDark: boolean }) {
  const cardBg = isDark ? "bg-zinc-800" : "bg-zinc-100";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  return (
    <Pressable
      className="mb-4 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`Recording: ${item.title}`}
    >
      <View
        className={`w-full rounded-xl items-center justify-center mb-2 ${cardBg}`}
        style={{ height: CARD_WIDTH * 0.85 }}
      >
        <View className="absolute top-1.5 right-1.5 bg-black/80 rounded px-1 py-0.5">
          <Text className="text-white text-xs font-medium">{item.duration}</Text>
        </View>
        <Text className="text-2xl opacity-40">▶</Text>
      </View>
      <Text className={`text-xs font-semibold mb-0.5 ${textPrimary}`} numberOfLines={1}>
        {item.title}
      </Text>
      <Text className={`text-xs mb-1.5 ${textMuted}`} numberOfLines={1}>
        {item.date} · {item.time}
      </Text>
      <View className="flex-row flex-wrap gap-1">
        {item.tags.map((tag) => (
          <View key={tag} className={`rounded px-1.5 py-0.5 ${tagBg}`}>
            <Text className={`text-xs ${textMuted}`}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const inputBg = isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200";

  const visibleRecordings = ALL_RECORDINGS.slice(0, page * PAGE_SIZE);
  const hasMore = visibleRecordings.length < ALL_RECORDINGS.length;

  const col1 = visibleRecordings.filter((_, i) => i % 3 === 0);
  const col2 = visibleRecordings.filter((_, i) => i % 3 === 1);
  const col3 = visibleRecordings.filter((_, i) => i % 3 === 2);

  async function handleLoadMore() {
    setLoadingMore(true);
    // Simulates a network delay — replace with your real API call
    await new Promise((res) => setTimeout(res, 800));
    setPage((prev) => prev + 1);
    setLoadingMore(false);
  }

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Text className={`text-base font-bold tracking-tight ${textPrimary}`}>MemoriaCam</Text>
          <Pressable
            className="bg-black rounded-lg px-4 py-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="New Recording"
            onPress={() => router.push("/new-recording")}
          >
            <Text className="text-white text-sm font-semibold">+ New Recording</Text>
          </Pressable>
        </View>

        <View className="px-6 pt-6">
          {/* Welcome */}
          <Text className={`text-2xl font-bold tracking-tight ${textPrimary}`}>
            Welcome back, Sarah
          </Text>
          <Text className={`text-sm mt-0.5 mb-6 ${textMuted}`}>
            Your personal video diary awaits
          </Text>

          {/* Stat Cards */}
          <View className="flex-row gap-3 mb-8">
            {STATS.map((stat) => (
              <View key={stat.id} className={`flex-1 rounded-2xl p-3 border ${cardBg} ${cardBorder}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-lg">{stat.icon}</Text>
                  <Text className={`text-xs ${textMuted}`}>{stat.sublabel}</Text>
                </View>
                <Text className={`text-xl font-bold ${textPrimary}`}>{stat.value}</Text>
                <Text className={`text-xs mt-0.5 ${textMuted}`}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Recent Recordings header + filter */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-base font-semibold ${textPrimary}`}>Recent Recordings</Text>
            <Pressable
              className={`flex-row items-center border rounded-lg px-3 py-1.5 ${cardBorder} ${cardBg}`}
              accessibilityRole="button"
              accessibilityLabel="Filter recordings"
            >
              <Text className={`text-xs ${textMuted}`}>⚙ Filter</Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View className={`flex-row items-center rounded-xl px-3 mb-5 border ${inputBg}`}>
            <Text className={`text-sm mr-2 ${textMuted}`}>🔍</Text>
            <TextInput
              className={`flex-1 py-2.5 text-sm ${isDark ? "text-white" : "text-black"}`}
              placeholder="Search recordings..."
              placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search recordings"
            />
          </View>

          {/* 3-Column Recording Grid or Empty State */}
          {visibleRecordings.length === 0 ? (
            <View className={`rounded-2xl border px-6 py-12 items-center ${cardBg} ${cardBorder}`}>
              <Text className="text-4xl mb-4">🎥</Text>
              <Text className={`text-base font-semibold mb-1 ${textPrimary}`}>
                No recordings yet
              </Text>
              <Text className={`text-sm text-center mb-6 ${textMuted}`}>
                Tap the button above to capture your first memory.
              </Text>
              <Pressable
                className={`px-5 py-2.5 rounded-xl active:opacity-70 ${isDark ? "bg-white" : "bg-black"}`}
                accessibilityRole="button"
                accessibilityLabel="Start recording"
                onPress={() => router.push("/new-recording")}
              >
                <Text className={`text-sm font-semibold ${isDark ? "text-black" : "text-white"}`}>
                  + New Recording
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  {col1.map((item) => <RecordingCard key={item.id} item={item} isDark={isDark} />)}
                </View>
                <View className="flex-1">
                  {col2.map((item) => <RecordingCard key={item.id} item={item} isDark={isDark} />)}
                </View>
                <View className="flex-1">
                  {col3.map((item) => <RecordingCard key={item.id} item={item} isDark={isDark} />)}
                </View>
              </View>
              {hasMore ? (
                <Pressable
                  className={`mt-2 py-3 rounded-xl items-center border active:opacity-70 ${cardBorder} ${cardBg}`}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  accessibilityRole="button"
                  accessibilityLabel="Load more recordings"
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />
                  ) : (
                    <Text className={`text-sm font-medium ${textMuted}`}>Load More Recordings</Text>
                  )}
                </Pressable>
              ) : (
                <View className={`mt-2 py-3 rounded-xl items-center border ${cardBorder} ${cardBg}`}>
                  <Text className={`text-sm ${textMuted}`}>All recordings loaded</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}