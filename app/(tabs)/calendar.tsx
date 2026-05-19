import { useColorScheme } from "@/hooks/use-color-scheme";
import { crossPlatformAlert } from "@/utils/crossPlatformAlert";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Recording = {
  id: string;
  title: string;
  created_at: string;
  body_text: string | null;
  video_path: string | null;
  tags: { id: string; name: string }[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const { width } = Dimensions.get("window");
const DAY_SIZE = Math.floor((width - 48) / 7);
const CELL_SIZE = Math.min(DAY_SIZE, 44);

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SUGGESTED_TAGS = [
  "morning", "evening", "gratitude", "reflection", "goals",
  "work", "personal", "health", "ideas", "weekly",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isoToDateKey(iso: string): string {
  const d = new Date(iso);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function getVideoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("Videos")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.log("Signed URL error:", error);
    return null;
  }
  return data.signedUrl;
}

async function generateWebThumbnail(videoUri: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = videoUri;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => { video.currentTime = 1; };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        resolve(null);
      }
    };

    video.onerror = () => resolve(null);
  });
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({
  recording,
  isDark,
  onClose,
  onEdit,
  onDelete,
}: {
  recording: Recording;
  isDark: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBorder = isDark ? "border-zinc-700" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const player = useVideoPlayer(
    { uri: videoUrl || "" },
    (p) => { p.loop = false; }
  );

  useEffect(() => {
    setVideoUrl(null);
  }, [recording.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!recording.video_path) return;
      const url = await getVideoUrl(recording.video_path);
      if (!cancelled) setVideoUrl(url);
    }

    load();
    return () => { cancelled = true; };
  }, [recording.video_path]);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className={`flex-1 ${isDark ? "bg-zinc-950" : "bg-white"}`} edges={["top"]}>
        {/* Header */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Pressable onPress={onClose} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Close">
            <Text className={`text-sm ${textMuted}`}>✕ Close</Text>
          </Pressable>
          <Text className={`text-base font-semibold ${textPrimary}`} numberOfLines={1} style={{ maxWidth: 180 }}>
            {recording.title}
          </Text>
          <View className="flex-row gap-3">
            <Pressable onPress={onEdit} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Edit recording">
              <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => onDelete(recording.id)} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Delete recording">
              <Text className="text-sm font-semibold text-red-500">Delete</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Video player */}
          <View
            className={`w-full rounded-2xl items-center justify-center mb-6 border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
            style={{ height: 200 }}
          >
            {recording.video_path ? (
              videoUrl ? (
                <VideoView
                  player={player}
                  allowsFullscreen
                  allowsPictureInPicture
                  nativeControls
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator />
                </View>
              )
            ) : (
              <Text className={`text-4xl opacity-20`}>📝</Text>
            )}
          </View>

          {/* Title & date */}
          <Text className={`text-xl font-bold mb-1 ${textPrimary}`}>{recording.title}</Text>
          <Text className={`text-sm mb-5 ${textMuted}`}>
            {formatDate(recording.created_at)} · {formatTime(recording.created_at)}
          </Text>

          {/* Tags */}
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

          {/* Note */}
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  recording,
  isDark,
  onSave,
  onClose,
}: {
  recording: Recording;
  isDark: boolean;
  onSave: (updated: Recording) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(recording.title);
  const [note, setNote] = useState(recording.body_text ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(recording.tags.map((t) => t.name));
  const [tagInput, setTagInput] = useState("");

  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBorder = isDark ? "border-zinc-700" : "border-zinc-200";
  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm border ${
    isDark ? "bg-zinc-800 text-white border-zinc-700" : "bg-zinc-100 text-black border-zinc-200"
  }`;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function handleSave() {
    if (!title.trim()) return;
    const updatedTags = selectedTags.map((name) => {
      const existing = recording.tags.find((t) => t.name === name);
      return existing ?? { id: name, name };
    });
    onSave({ ...recording, title: title.trim(), body_text: note, tags: updatedTags });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className={`flex-1 ${isDark ? "bg-zinc-950" : "bg-white"}`} edges={["top"]}>
        {/* Header */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Pressable onPress={onClose} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Cancel">
            <Text className={`text-sm ${textMuted}`}>Cancel</Text>
          </Pressable>
          <Text className={`text-base font-semibold ${textPrimary}`}>Edit Entry</Text>
          <Pressable onPress={handleSave} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Save changes">
            <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {/* Date chip */}
          <View
            className={`w-full rounded-2xl items-center justify-center mb-6 border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
            style={{ height: 72 }}
          >
            <Text className="text-2xl opacity-30 mb-1">{recording.video_path ? "▶" : "📝"}</Text>
            <Text className={`text-xs ${textMuted}`}>{formatDate(recording.created_at)}</Text>
          </View>

          {/* Title */}
          <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Title</Text>
          <TextInput
            className={`${inputStyle} mb-5`}
            placeholder="Entry title"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
            accessibilityLabel="Entry title"
          />

          {/* Tags */}
          <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Tags</Text>
          {selectedTags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {selectedTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`flex-row items-center rounded-full px-3 py-1 ${isDark ? "bg-white" : "bg-black"}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                >
                  <Text className={`text-xs font-medium mr-1 ${isDark ? "text-black" : "text-white"}`}>{tag}</Text>
                  <Text className={`text-xs ${isDark ? "text-black" : "text-white"}`}>✕</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className={`flex-1 rounded-xl px-4 py-3 text-sm border ${isDark ? "bg-zinc-800 text-white border-zinc-700" : "bg-zinc-100 text-black border-zinc-200"}`}
              placeholder="Add a custom tag…"
              placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <Pressable
              onPress={addCustomTag}
              className={`px-4 rounded-xl items-center justify-center active:opacity-70 ${isDark ? "bg-zinc-700" : "bg-zinc-200"}`}
              accessibilityRole="button"
              accessibilityLabel="Add tag"
            >
              <Text className={`text-sm font-semibold ${textPrimary}`}>Add</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {SUGGESTED_TAGS.filter((t) => !selectedTags.includes(t)).map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 border active:opacity-60 ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
                accessibilityRole="button"
                accessibilityLabel={`Add tag ${tag}`}
              >
                <Text className={`text-xs ${textMuted}`}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          {/* Note */}
          <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Note</Text>
          <TextInput
            className={`${inputStyle} mb-8`}
            placeholder="Add a note or description…"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            accessibilityLabel="Entry note"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [entriesByDate, setEntriesByDate] = useState<Record<string, Recording[]>>({});
  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});

  const [viewingEntry, setViewingEntry] = useState<Recording | null>(null);
  const [editingEntry, setEditingEntry] = useState<Recording | null>(null);

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

  // ── Fetch entries for the visible month ──────────────────────────────────────

  async function fetchEntries(year: number, month: number) {
    setLoading(true);
    try {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from("journal_entries")
        .select(`
          id,
          title,
          created_at,
          body_text,
          video_path,
          entry_tags (
            tags ( id, name )
          )
        `)
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const grouped: Record<string, Recording[]> = {};
      for (const row of data ?? []) {
        const entry: Recording = {
          id: row.id,
          title: row.title,
          created_at: row.created_at,
          body_text: row.body_text ?? null,
          video_path: row.video_path ?? null,
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
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEntries(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // ── Generate thumbnails for visible entries ──────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const allEntries = Object.values(entriesByDate).flat();
      const results: Record<string, string | null> = {};

      for (const item of allEntries) {
        if (!item.video_path) continue;
        if (thumbnails[item.id] !== undefined) continue;

        const { data, error } = await supabase.storage
          .from("Videos")
          .createSignedUrl(item.video_path, 60 * 60);

        if (error || !data) continue;

        const thumb =
          Platform.OS === "web"
            ? await generateWebThumbnail(data.signedUrl)
            : await VideoThumbnails.getThumbnailAsync(data.signedUrl, { time: 1000 })
                .then((r) => r.uri)
                .catch(() => null);

        if (!cancelled) results[item.id] = thumb;
      }

      if (!cancelled && Object.keys(results).length > 0) {
        setThumbnails((prev) => ({ ...prev, ...results }));
      }
    }

    if (Object.keys(entriesByDate).length > 0) run();
    return () => { cancelled = true; };
  }, [entriesByDate]);

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    crossPlatformAlert(
      "Delete Entry",
      "Are you sure you want to delete this entry? This cannot be undone.",
      async () => {
        await supabase.from("journal_entries").delete().eq("id", id);
        setViewingEntry(null);
        fetchEntries(viewYear, viewMonth);
      }
    );
  }

  async function handleSaveEdit(updated: Recording) {
    // Upsert tags: delete old entry_tags, insert new ones
    const tagNames = updated.tags.map((t) => t.name);

    // Ensure tags exist in the tags table and get their IDs
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("name", name)
        .single();

      if (existing) {
        tagIds.push(existing.id);
      } else {
        const { data: inserted } = await supabase
          .from("tags")
          .insert({ name })
          .select("id")
          .single();
        if (inserted) tagIds.push(inserted.id);
      }
    }

    await supabase
      .from("journal_entries")
      .update({ title: updated.title, body_text: updated.body_text ?? "" })
      .eq("id", updated.id);

    await supabase.from("entry_tags").delete().eq("entry_id", updated.id);

    if (tagIds.length > 0) {
      await supabase.from("entry_tags").insert(
        tagIds.map((tag_id) => ({ entry_id: updated.id, tag_id }))
      );
    }

    setEditingEntry(null);
    setViewingEntry(updated);
    fetchEntries(viewYear, viewMonth);
  }

  function openEdit(entry: Recording) {
    setViewingEntry(null);
    setEditingEntry(entry);
  }

  // ── Calendar grid logic ──────────────────────────────────────────────────────

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
    <SafeAreaView key={colorScheme} className={`flex-1 ${bg}`} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          className={`px-6 py-4 border-b ${cardBorder} flex-row items-center justify-between`}
        >
          <Text className={`text-base font-bold ${textPrimary}`}>
            Calendar
          </Text>

          <Pressable
            className="bg-black rounded-lg px-4 py-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="New Recording"
            onPress={() => router.push("/new-recording")}
          >
            <Text className="text-white text-sm font-semibold">
              + New Recording
            </Text>
          </Pressable>
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
                    accessibilityLabel={`${day} ${MONTHS[viewMonth]} ${viewYear}${hasEntries ? `, ${entryCount} entr${entryCount > 1 ? "ies" : "y"}` : ""}`}
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
                selectedEntries.map((item) => (
                  <View
                    key={item.id}
                    className={`rounded-2xl border mb-3 p-4 ${cardBg} ${cardBorder}`}
                  >
                    <View className="flex-row items-start justify-between">
                      {/* Tappable left section → opens ViewModal */}
                      <Pressable
                        className="flex-row items-start flex-1 active:opacity-70"
                        onPress={() => setViewingEntry(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`View entry: ${item.title}`}
                      >
                        {/* Thumbnail */}
                        <View style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", marginRight: 12 }}>
                          {thumbnails[item.id] ? (
                            <Image
                              source={{ uri: thumbnails[item.id]! }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : (
                            <View
                              className={`flex-1 items-center justify-center ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                            >
                              <Text className="text-xl opacity-40">
                                {item.video_path ? "▶" : "📝"}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Info */}
                        <View className="flex-1">
                          <Text className={`text-sm font-semibold mb-0.5 ${textPrimary}`} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text className={`text-xs mb-2 ${textMuted}`}>
                            {formatDate(item.created_at)} · {formatTime(item.created_at)}
                          </Text>
                          {item.tags.length > 0 && (
                            <View className="flex-row flex-wrap gap-1">
                              {item.tags.map((tag) => (
                                <View key={tag.id} className={`rounded px-1.5 py-0.5 ${tagBg}`}>
                                  <Text className={`text-xs ${textMuted}`}>{tag.name}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          {item.body_text ? (
                            <Text className={`text-xs mt-2 ${textMuted}`} numberOfLines={1}>
                              {item.body_text}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>

                      {/* Action buttons */}
                      <View className="ml-2 gap-2">
                        <Pressable
                          onPress={() => openEdit(item)}
                          className={`rounded-lg px-3 py-1.5 active:opacity-60 ${isDark ? "bg-zinc-700" : "bg-zinc-200"}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${item.title}`}
                        >
                          <Text className={`text-xs font-medium ${textPrimary}`}>Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(item.id)}
                          className="rounded-lg px-3 py-1.5 bg-red-100 active:opacity-60"
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${item.title}`}
                        >
                          <Text className="text-xs font-medium text-red-600">Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : (
            <View className="items-center py-6">
              <Text className={`text-sm ${textMuted}`}>Tap a date to see entries</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* View Modal */}
      {viewingEntry && (
        <ViewModal
          recording={viewingEntry}
          isDark={isDark}
          onClose={() => setViewingEntry(null)}
          onEdit={() => openEdit(viewingEntry)}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <EditModal
          recording={editingEntry}
          isDark={isDark}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </SafeAreaView>
  );
}