import { useEntries } from '@/hooks/useEntries';
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { SignOutButton } from "@/components/ui/authMenu";
import { supabase } from '../../lib/supabase';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
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

const DATE_RANGE_OPTIONS = [
  { id: "all", label: "All time" },
  { id: "7", label: "Last 7 days" },
  { id: "14", label: "Last 14 days" },
  { id: "30", label: "Last 30 days" },
];

type Recording = {
  id: string;
  title: string;
  created_at: string;
  body_text: string | null;
  video_path: string | null;
  tags: { id: string; name: string }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDaysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getUsername(user: any): string {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Guest'
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ recording, isDark, onClose }: { recording: Recording; isDark: boolean; onClose: () => void }) {
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBorder = isDark ? "border-zinc-700" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className={`flex-1 ${isDark ? "bg-zinc-950" : "bg-white"}`} edges={["top"]}>
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Pressable onPress={onClose} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Close">
            <Text className={`text-sm ${textMuted}`}>✕ Close</Text>
          </Pressable>
          <Text className={`text-base font-semibold ${textPrimary}`} numberOfLines={1} style={{ maxWidth: 180 }}>
            {recording.title}
          </Text>
          <View style={{ width: 48 }} />
        </View>
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          <View
            className={`w-full rounded-2xl items-center justify-center mb-6 border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
            style={{ height: 220 }}
          >
            <Pressable
              className={`w-14 h-14 rounded-full items-center justify-center ${isDark ? "bg-white" : "bg-black"}`}
              accessibilityRole="button"
              accessibilityLabel="Play recording"
            >
              <Text className={`text-xl ${isDark ? "text-black" : "text-white"}`}>▶</Text>
            </Pressable>
          </View>
          <Text className={`text-xl font-bold mb-1 ${textPrimary}`}>{recording.title}</Text>
          <Text className={`text-sm mb-5 ${textMuted}`}>
            {formatDate(recording.created_at)} · {formatTime(recording.created_at)}
          </Text>
          {recording.tags.length > 0 && (
            <View className="mb-5">
              <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {recording.tags.map((tag) => (
                  <View key={tag.id} className={`rounded-full px-3 py-1 ${tagBg}`}>
                    <Text className={`text-xs ${textMuted}`}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View className={`border-t pt-5 ${cardBorder}`}>
            <Text className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textMuted}`}>Note</Text>
            {recording.body_text ? (
              <Text className={`text-sm leading-6 ${textPrimary}`}>{recording.body_text}</Text>
            ) : (
              <Text className={`text-sm italic ${textMuted}`}>No note added.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Recording Card ───────────────────────────────────────────────────────────
function RecordingCard({ item, isDark, onPress }: { item: Recording; isDark: boolean; onPress: () => void }) {
  const cardBg = isDark ? "bg-zinc-800" : "bg-zinc-100";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  return (
    <Pressable className="mb-4 active:opacity-75" onPress={onPress} accessibilityRole="button" accessibilityLabel={`View recording: ${item.title}`}>
      <View className={`w-full rounded-xl items-center justify-center mb-2 ${cardBg}`} style={{ height: CARD_WIDTH * 0.85 }}>
        <Text className="text-2xl opacity-40">▶</Text>
      </View>
      <Text className={`text-xs font-semibold mb-0.5 ${textPrimary}`} numberOfLines={1}>{item.title}</Text>
      <Text className={`text-xs mb-1.5 ${textMuted}`} numberOfLines={1}>
        {formatDate(item.created_at)} · {formatTime(item.created_at)}
      </Text>
      <View className="flex-row flex-wrap gap-1">
        {item.tags.map((tag) => (
          <View key={tag.id} className={`rounded px-1.5 py-0.5 ${tagBg}`}>
            <Text className={`text-xs ${textMuted}`}>{tag.name}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({
  isDark,
  allTags,
  selectedTags,
  selectedDateRange,
  onToggleTag,
  onSelectDateRange,
  onClear,
}: {
  isDark: boolean;
  allTags: string[];
  selectedTags: string[];
  selectedDateRange: string;
  onToggleTag: (tag: string) => void;
  onSelectDateRange: (id: string) => void;
  onClear: () => void;
}) {
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const cardBorder = isDark ? "border-zinc-700" : "border-zinc-200";
  const chipBase = isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200";
  const chipActive = isDark ? "bg-white border-white" : "bg-black border-black";
  const chipActiveText = isDark ? "text-black" : "text-white";
  const hasFilters = selectedTags.length > 0 || selectedDateRange !== "all";

  return (
    <View
      className={`rounded-2xl border mt-2 mb-3 p-4 ${cardBg} ${cardBorder}`}
      style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
    >
      <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Date Range</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {DATE_RANGE_OPTIONS.map((opt) => {
          const active = selectedDateRange === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelectDateRange(opt.id)}
              className={`rounded-full px-3 py-1.5 border active:opacity-70 ${active ? chipActive : chipBase}`}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text className={`text-xs font-medium ${active ? chipActiveText : textMuted}`}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className={`border-t mb-4 ${cardBorder}`} />

      <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Tags</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {allTags.length === 0 ? (
          <Text className={`text-xs ${textMuted}`}>No tags yet — add some to your recordings!</Text>
        ) : (
          allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => onToggleTag(tag)}
                className={`rounded-full px-3 py-1.5 border active:opacity-70 ${active ? chipActive : chipBase}`}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tag}`}
              >
                <Text className={`text-xs font-medium ${active ? chipActiveText : textMuted}`}>{tag}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      {hasFilters && (
        <Pressable
          onPress={onClear}
          className={`mt-1 py-2 rounded-xl items-center border active:opacity-60 ${cardBorder}`}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
        >
          <Text className={`text-xs font-semibold ${textMuted}`}>Clear all filters</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  // ── Auth — kept from teammate's version ──
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUser(session.user);
      else setUser(null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ── Entries from Supabase ──
  const { entries, loading, refetch } = useEntries();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  // ── UI state ──
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewingRecording, setViewingRecording] = useState<Recording | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const inputBg = isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200";

  // ── Derived stats from real data ──
  const totalRecordings = entries.length;

  const streak = (() => {
    const days = new Set(entries.map((e: Recording) => new Date(e.created_at).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  // Tags derived from real entries — powers the filter dropdown
  const allTags = Array.from(
    new Set(entries.flatMap((e: Recording) => e.tags.map((t) => t.name)))
  ).sort() as string[];

  const STATS = [
    { id: "recordings", icon: "🎥", value: String(totalRecordings), label: "Total Recordings", sublabel: "All time" },
    { id: "time",       icon: "🕐", value: "—",                      label: "Recording Time",  sublabel: "Coming soon" },
    { id: "streak",     icon: "🔥", value: String(streak),           label: "Day Streak",      sublabel: streak > 0 ? "Keep it up!" : "Start today!" },
  ];

  const activeFilterCount = selectedTags.length + (selectedDateRange !== "all" ? 1 : 0);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setPage(1);
  }

  function clearFilters() {
    setSelectedTags([]);
    setSelectedDateRange("all");
    setPage(1);
  }

  const filtered = entries.filter((r: Recording) => {
    const matchesSearch =
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.name.toLowerCase().includes(search.toLowerCase()));

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => r.tags.some((t) => t.name === tag));

    const matchesDate =
      selectedDateRange === "all" ||
      getDaysAgo(r.created_at) <= parseInt(selectedDateRange);

    return matchesSearch && matchesTags && matchesDate;
  });

  const isFiltering = search.length > 0 || activeFilterCount > 0;
  const visibleRecordings = isFiltering ? filtered : filtered.slice(0, page * PAGE_SIZE);
  const hasMore = !isFiltering && filtered.length > page * PAGE_SIZE;

  const col1 = visibleRecordings.filter((_: any, i: number) => i % 3 === 0);
  const col2 = visibleRecordings.filter((_: any, i: number) => i % 3 === 1);
  const col3 = visibleRecordings.filter((_: any, i: number) => i % 3 === 2);

  async function handleLoadMore() {
    setLoadingMore(true);
    await new Promise((res) => setTimeout(res, 400));
    setPage((prev) => prev + 1);
    setLoadingMore(false);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Top bar — SignOutButton kept from teammate */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Text className={`text-base font-bold tracking-tight ${textPrimary}`}>MemoriaCam</Text>
          <View className="flex-row items-center gap-3">
            <SignOutButton onSuccessfulLogin={() => router.replace('/login')} />
            <Pressable
              className="bg-black rounded-lg px-4 py-2 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="New Recording"
              onPress={() => router.push("/new-recording")}
            >
              <Text className="text-white text-sm font-semibold">+ New Recording</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-6 pt-6">
          {/* Greeting — username logic kept from teammate */}
          <Text className={`text-2xl font-bold tracking-tight ${textPrimary}`}>
            Welcome back, {getUsername(user)}
          </Text>
          <Text className={`text-sm mt-0.5 mb-6 ${textMuted}`}>Your personal video diary awaits</Text>

          {/* Stat Cards — real data */}
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

          {/* Header + Filter button */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-base font-semibold ${textPrimary}`}>Recent Recordings</Text>
            <Pressable
              className={`flex-row items-center gap-1.5 border rounded-lg px-3 py-1.5 active:opacity-70 ${
                activeFilterCount > 0
                  ? isDark ? "bg-white border-white" : "bg-black border-black"
                  : `${cardBorder} ${cardBg}`
              }`}
              onPress={() => setShowFilter((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="Toggle filter"
            >
              <Text className={`text-xs font-medium ${activeFilterCount > 0 ? (isDark ? "text-black" : "text-white") : textMuted}`}>
                ⚙ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Text>
            </Pressable>
          </View>

          {/* Filter Dropdown — tags from real data */}
          {showFilter && (
            <FilterDropdown
              isDark={isDark}
              allTags={allTags}
              selectedTags={selectedTags}
              selectedDateRange={selectedDateRange}
              onToggleTag={toggleTag}
              onSelectDateRange={(id) => { setSelectedDateRange(id); setPage(1); }}
              onClear={clearFilters}
            />
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && !showFilter && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {selectedDateRange !== "all" && (
                  <View className={`flex-row items-center rounded-full px-3 py-1 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
                    <Text className={`text-xs mr-1.5 ${textMuted}`}>
                      {DATE_RANGE_OPTIONS.find((o) => o.id === selectedDateRange)?.label}
                    </Text>
                    <Pressable onPress={() => { setSelectedDateRange("all"); setPage(1); }}>
                      <Text className={`text-xs ${textMuted}`}>✕</Text>
                    </Pressable>
                  </View>
                )}
                {selectedTags.map((tag) => (
                  <View key={tag} className={`flex-row items-center rounded-full px-3 py-1 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
                    <Text className={`text-xs mr-1.5 ${textMuted}`}>{tag}</Text>
                    <Pressable onPress={() => toggleTag(tag)}>
                      <Text className={`text-xs ${textMuted}`}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Search bar */}
          <View className={`flex-row items-center rounded-xl px-3 my-3 border ${inputBg}`}>
            <Text className={`text-sm mr-2 ${textMuted}`}>🔍</Text>
            <TextInput
              className={`flex-1 py-2.5 text-sm ${isDark ? "text-white" : "text-black"}`}
              placeholder="Search recordings or tags..."
              placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
              value={search}
              onChangeText={(text) => { setSearch(text); setPage(1); }}
              accessibilityLabel="Search recordings"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel="Clear search">
                <Text className={`text-sm ${textMuted}`}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Result count */}
          {isFiltering && (
            <Text className={`text-xs mb-3 ${textMuted}`}>
              {filtered.length} {filtered.length === 1 ? "recording" : "recordings"} found
            </Text>
          )}

          {/* Grid or Empty State */}
          {visibleRecordings.length === 0 ? (
            <View className={`rounded-2xl border px-6 py-12 items-center ${cardBg} ${cardBorder}`}>
              <Text className="text-4xl mb-4">🎥</Text>
              <Text className={`text-base font-semibold mb-1 ${textPrimary}`}>
                {isFiltering ? "No recordings found" : "No recordings yet"}
              </Text>
              <Text className={`text-sm text-center mb-4 ${textMuted}`}>
                {isFiltering ? "Try adjusting your search or filters." : "Tap + New Recording to get started."}
              </Text>
              {isFiltering && (
                <Pressable
                  onPress={() => { clearFilters(); setSearch(""); }}
                  className={`px-4 py-2 rounded-xl border active:opacity-60 ${cardBorder}`}
                  accessibilityRole="button"
                  accessibilityLabel="Clear filters"
                >
                  <Text className={`text-xs font-semibold ${textMuted}`}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  {col1.map((item: Recording) => <RecordingCard key={item.id} item={item} isDark={isDark} onPress={() => setViewingRecording(item)} />)}
                </View>
                <View className="flex-1">
                  {col2.map((item: Recording) => <RecordingCard key={item.id} item={item} isDark={isDark} onPress={() => setViewingRecording(item)} />)}
                </View>
                <View className="flex-1">
                  {col3.map((item: Recording) => <RecordingCard key={item.id} item={item} isDark={isDark} onPress={() => setViewingRecording(item)} />)}
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
                  {loadingMore
                    ? <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />
                    : <Text className={`text-sm font-medium ${textMuted}`}>Load More Recordings</Text>
                  }
                </Pressable>
              ) : (
                visibleRecordings.length > PAGE_SIZE && (
                  <View className={`mt-2 py-3 rounded-xl items-center border ${cardBorder} ${cardBg}`}>
                    <Text className={`text-sm ${textMuted}`}>All recordings loaded</Text>
                  </View>
                )
              )}
            </>
          )}
        </View>
      </ScrollView>

      {viewingRecording && (
        <ViewModal recording={viewingRecording} isDark={isDark} onClose={() => setViewingRecording(null)} />
      )}
    </SafeAreaView>
  );
}