import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const DAY_SIZE = Math.floor((width - 48) / 7);
const CELL_SIZE = Math.min(DAY_SIZE, 44); // cap size for large screens

// --- Shared placeholder data (replace with real data source later) ---
type Recording = {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string;
  duration: string;
  tags: string[];
};

const ALL_RECORDINGS: Recording[] = [
  { id: "1", title: "Morning Reflection", date: "2025-01-15", time: "8:30 AM", duration: "5:24", tags: ["gratitude", "morning"] },
  { id: "2", title: "Weekend Goals", date: "2025-01-14", time: "6:15 PM", duration: "8:12", tags: ["planning", "goals"] },
  { id: "3", title: "Quick Thoughts", date: "2025-01-13", time: "2:20 PM", duration: "3:45", tags: ["ideas"] },
  { id: "4", title: "Work Reflection", date: "2025-01-12", time: "5:45 PM", duration: "6:58", tags: ["work", "reflection"] },
  { id: "5", title: "Evening Gratitude", date: "2025-01-11", time: "9:00 PM", duration: "4:33", tags: ["gratitude", "evening"] },
  { id: "6", title: "Personal Growth", date: "2025-01-10", time: "7:30 AM", duration: "7:21", tags: ["growth", "well-care"] },
  { id: "7", title: "Sunday Reset", date: "2025-01-09", time: "10:00 AM", duration: "4:10", tags: ["self-care", "weekly"] },
  { id: "8", title: "Creative Session", date: "2025-01-08", time: "3:45 PM", duration: "9:02", tags: ["creativity"] },
  { id: "9", title: "Late Night Thoughts", date: "2025-01-07", time: "11:15 PM", duration: "6:30", tags: ["reflection", "night"] },
  { id: "10", title: "Workout Log", date: "2025-01-06", time: "7:00 AM", duration: "3:55", tags: ["fitness", "health"] },
  { id: "11", title: "Weekly Review", date: "2025-01-05", time: "6:00 PM", duration: "11:20", tags: ["planning", "weekly"] },
  { id: "12", title: "New Year Energy", date: "2025-01-04", time: "9:30 AM", duration: "5:48", tags: ["goals", "motivation"] },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  // Build a set of dates that have recordings for quick lookup
  const recordingDates = new Set(ALL_RECORDINGS.map((r) => r.date));

  // Recordings for selected date
  const selectedRecordings = selectedDate
    ? ALL_RECORDINGS.filter((r) => r.date === selectedDate)
    : [];

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Build grid cells: leading empty + day cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className={`px-6 py-4 border-b ${cardBorder}`}>
          <Text className={`text-base font-bold ${textPrimary}`}>Calendar</Text>
        </View>

        {/* Month navigation */}
        <View className="px-6 py-4 flex-row items-center justify-between">
          <Pressable
            onPress={prevMonth}
            className={`w-9 h-9 rounded-full items-center justify-center active:opacity-60 ${cardBg} border ${cardBorder}`}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Text className={`text-base ${textPrimary}`}>‹</Text>
          </Pressable>

          <Text className={`text-base font-semibold ${textPrimary}`}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>

          <Pressable
            onPress={nextMonth}
            className={`w-9 h-9 rounded-full items-center justify-center active:opacity-60 ${cardBg} border ${cardBorder}`}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Text className={`text-base ${textPrimary}`}>›</Text>
          </Pressable>
        </View>

        {/* Day of week labels */}
        <View className="flex-row px-6 mb-1">
          {DAYS_OF_WEEK.map((d) => (
            <View key={d} style={{ width: CELL_SIZE }} className="items-center">
              <Text className={`text-xs font-medium ${textMuted}`}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="px-6">
          {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
            <View key={rowIdx} className="flex-row">
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                if (day === null) {
                  return <View key={colIdx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                }

                const dateKey = toDateKey(viewYear, viewMonth, day);
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const hasRecording = recordingDates.has(dateKey);

                return (
                  <Pressable
                    key={colIdx}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderWidth: isToday ? 2 : 1,
                      borderColor: isToday
                        ? isDark ? "#ffffff" : "#000000"
                        : isDark ? "#3f3f46" : "#e4e4e7",
                      backgroundColor: isSelected
                        ? isDark ? "#ffffff" : "#000000"
                        : "transparent",
                    }}
                    className="items-center justify-center active:opacity-70"
                    onPress={() =>
                      setSelectedDate(isSelected ? null : dateKey)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${day} ${MONTHS[viewMonth]} ${viewYear}${hasRecording ? ", has recordings" : ""}`}
                  >
                    <Text
                      style={{ fontSize: 12, fontWeight: isToday ? "700" : "400" }}
                      className={
                        isSelected
                          ? isDark ? "text-black" : "text-white"
                          : textPrimary
                      }
                    >
                      {day}
                    </Text>
                    {/* Recording dot */}
                    {hasRecording && (
                      <View
                        className={`w-1 h-1 rounded-full absolute bottom-1 ${
                          isSelected
                            ? isDark ? "bg-black" : "bg-white"
                            : isDark ? "bg-white" : "bg-black"
                        }`}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Divider */}
        <View className={`mx-6 mt-4 mb-5 border-b ${cardBorder}`} />

        {/* Selected day recordings */}
        <View className="px-6">
          {selectedDate ? (
            <>
              <Text className={`text-sm font-semibold mb-3 ${textPrimary}`}>
                {selectedRecordings.length > 0
                  ? `${selectedRecordings.length} recording${selectedRecordings.length > 1 ? "s" : ""} on ${MONTHS[parseInt(selectedDate.split("-")[1]) - 1]} ${parseInt(selectedDate.split("-")[2])}`
                  : `No recordings on ${MONTHS[parseInt(selectedDate.split("-")[1]) - 1]} ${parseInt(selectedDate.split("-")[2])}`}
              </Text>

              {selectedRecordings.length === 0 ? (
                <View className={`rounded-2xl border px-6 py-8 items-center ${cardBg} ${cardBorder}`}>
                  <Text className="text-3xl mb-3">📭</Text>
                  <Text className={`text-sm ${textMuted} text-center`}>
                    Nothing recorded on this day yet.
                  </Text>
                </View>
              ) : (
                selectedRecordings.map((item) => (
                  <Pressable
                    key={item.id}
                    className={`rounded-2xl border mb-3 p-4 active:opacity-80 ${cardBg} ${cardBorder}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Recording: ${item.title}`}
                  >
                    <View className="flex-row items-center">
                      {/* Thumbnail */}
                      <View
                        className={`rounded-xl items-center justify-center mr-3 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                        style={{ width: 56, height: 56 }}
                      >
                        <Text className="text-lg opacity-40">▶</Text>
                        <View className="absolute bottom-1 right-1 bg-black/70 rounded px-1">
                          <Text className="text-white" style={{ fontSize: 9 }}>{item.duration}</Text>
                        </View>
                      </View>

                      {/* Info */}
                      <View className="flex-1">
                        <Text className={`text-sm font-semibold mb-0.5 ${textPrimary}`} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className={`text-xs mb-2 ${textMuted}`}>{item.time}</Text>
                        <View className="flex-row flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <View key={tag} className={`rounded px-1.5 py-0.5 ${tagBg}`}>
                              <Text className={`text-xs ${textMuted}`}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </>
          ) : (
            <View className="items-center py-6">
              <Text className={`text-sm ${textMuted}`}>Tap a date to see recordings</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}