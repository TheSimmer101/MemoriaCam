import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase"; // adjust path to your supabase client

const { width } = Dimensions.get("window");
const DAY_SIZE = Math.floor((width - 48) / 7);
const CELL_SIZE = Math.min(DAY_SIZE, 44);

type JournalEntry = {
  id: string;
  title: string;
  created_at: string; // ISO timestamp
  body_text?: string | null;
  video_path?: string | null;
  tags?: { name: string }[];
};

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

/** Formats an ISO timestamp to "YYYY-MM-DD" in local time */
function isoToDateKey(iso: string): string {
  const d = new Date(iso);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Map from "YYYY-MM-DD" -> JournalEntry[]
  const [entriesByDate, setEntriesByDate] = useState<Record<string, JournalEntry[]>>({});
  const [loading, setLoading] = useState(false);

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  // Fetch entries for the current viewed month (± 1 day buffer)
  useEffect(() => {
    let cancelled = false;

    async function fetchEntries() {
      setLoading(true);
      try {
        const startOfMonth = new Date(viewYear, viewMonth, 1).toISOString();
        const endOfMonth = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();

        const { data, error } = await supabase
          .from("journal_entries")
          .select(`
            id,
            title,
            created_at,
            body_text,
            video_path,
            entry_tags (
              tags ( name )
            )
          `)
          .gte("created_at", startOfMonth)
          .lte("created_at", endOfMonth)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (cancelled) return;

        // Normalize nested tags and group by date
        const grouped: Record<string, JournalEntry[]> = {};
        for (const row of data ?? []) {
          const entry: JournalEntry = {
            id: row.id,
            title: row.title,
            created_at: row.created_at,
            body_text: row.body_text,
            video_path: row.video_path,
            tags: (row.entry_tags ?? [])
              .map((et: any) => et.tags)
              .filter(Boolean)
              .flat(),
          };
          const key = isoToDateKey(row.created_at);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(entry);
        }

        setEntriesByDate(grouped);
      } catch (err) {
        console.error("Failed to fetch journal entries:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEntries();
    return () => { cancelled = true; };
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEntries = selectedDate ? (entriesByDate[selectedDate] ?? []) : [];

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

          <View className="flex-row items-center gap-2">
            <Text className={`text-base font-semibold ${textPrimary}`}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            {loading && <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />}
          </View>

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
        <View className="flex-row px-6 mb-1" style={{ justifyContent: "center" }}>
          {DAYS_OF_WEEK.map((d) => (
            <View key={d} style={{ width: CELL_SIZE }} className="items-center">
              <Text className={`text-xs font-medium ${textMuted}`}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="px-6">
          {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
            <View key={rowIdx} className="flex-row" style={{ justifyContent: "center" }}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                if (day === null) {
                  return <View key={colIdx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                }

                const dateKey = toDateKey(viewYear, viewMonth, day);
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const entryCount = entriesByDate[dateKey]?.length ?? 0;
                const hasEntries = entryCount > 0;

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
                    onPress={() => setSelectedDate(isSelected ? null : dateKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`${day} ${MONTHS[viewMonth]} ${viewYear}${hasEntries ? `, ${entryCount} journal entr${entryCount > 1 ? "ies" : "y"}` : ""}`}
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

                      {/* Show 1-3 dots to in each cell to show # of entries. */}
                      {hasEntries && (
                      <View className="flex-row gap-0.5 absolute bottom-1 items-center">
                        {Array.from({ length: Math.min(entryCount, 3) }).map((_, i) => (
                          <View
                            key={i}
                            style={{ width: 4, height: 4, borderRadius: 2 }}
                            className={
                              isSelected
                                ? isDark ? "bg-black" : "bg-white"
                                : isDark ? "bg-white" : "bg-black"
                            }
                          />
                        ))} 
                        {/* If more than 3 entries in a single day, it will show 3 dots followed by a plus sign */}
                        {entryCount > 3 && (
                          <Text
                            style={{ fontSize: 12, lineHeight: 8 }}
                            className={
                              isSelected
                                ? isDark ? "text-black" : "text-white"
                                : isDark ? "text-white" : "text-black"
                            }
                          >
                            +
                          </Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Divider */}
        <View className={`mx-6 mt-4 mb-5 border-b ${cardBorder}`} />

        {/* Selected day entries */}
        <View className="px-6">
          {selectedDate ? (
            <>
              <Text className={`text-sm font-semibold mb-3 ${textPrimary}`}>
                {selectedEntries.length > 0
                  ? `${selectedEntries.length} entr${selectedEntries.length > 1 ? "ies" : "y"} on ${MONTHS[parseInt(selectedDate.split("-")[1]) - 1]} ${parseInt(selectedDate.split("-")[2])}`
                  : `No entries on ${MONTHS[parseInt(selectedDate.split("-")[1]) - 1]} ${parseInt(selectedDate.split("-")[2])}`}
              </Text>

              {selectedEntries.length === 0 ? (
                <View className={`rounded-2xl border px-6 py-8 items-center ${cardBg} ${cardBorder}`}>
                  <Text className="text-3xl mb-3">📭</Text>
                  <Text className={`text-sm ${textMuted} text-center`}>
                    Nothing recorded on this day yet.
                  </Text>
                </View>
              ) : (
                selectedEntries.map((item) => {
                  const entryTime = new Date(item.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <Pressable
                      key={item.id}
                      className={`rounded-2xl border mb-3 p-4 active:opacity-80 ${cardBg} ${cardBorder}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Entry: ${item.title}`}
                    >
                      <View className="flex-row items-center">
                        {/* Thumbnail / icon */}
                        <View
                          className={`rounded-xl items-center justify-center mr-3 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                          style={{ width: 56, height: 56 }}
                        >
                          <Text className="text-lg opacity-40">
                            {item.video_path ? "▶" : "📝"}
                          </Text>
                        </View>

                        {/* Info */}
                        <View className="flex-1">
                          <Text className={`text-sm font-semibold mb-0.5 ${textPrimary}`} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text className={`text-xs mb-2 ${textMuted}`}>{entryTime}</Text>
                          {(item.tags ?? []).length > 0 && (
                            <View className="flex-row flex-wrap gap-1">
                              {item.tags!.map((tag) => (
                                <View key={tag.name} className={`rounded px-1.5 py-0.5 ${tagBg}`}>
                                  <Text className={`text-xs ${textMuted}`}>{tag.name}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </>
          ) : (
            <View className="items-center py-6">
              <Text className={`text-sm ${textMuted}`}>Tap a date to see entries</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}