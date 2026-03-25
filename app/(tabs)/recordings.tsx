import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Recording = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  tags: string[];
  note: string;
};

const INITIAL_RECORDINGS: Recording[] = [
  { id: "1", title: "Morning Reflection", date: "January 15, 2025", time: "8:30 AM", duration: "5:24", tags: ["gratitude", "morning"], note: "Felt really grounded today." },
  { id: "2", title: "Weekend Goals", date: "January 14, 2025", time: "6:15 PM", duration: "8:12", tags: ["planning", "goals"], note: "Setting intentions for the week ahead." },
  { id: "3", title: "Quick Thoughts", date: "January 13, 2025", time: "2:20 PM", duration: "3:45", tags: ["ideas"], note: "" },
  { id: "4", title: "Work Reflection", date: "January 12, 2025", time: "5:45 PM", duration: "6:58", tags: ["work", "reflection"], note: "Good progress on the project." },
  { id: "5", title: "Evening Gratitude", date: "January 11, 2025", time: "9:00 PM", duration: "4:33", tags: ["gratitude", "evening"], note: "Three things I'm grateful for today." },
  { id: "6", title: "Personal Growth", date: "January 10, 2025", time: "7:30 AM", duration: "7:21", tags: ["growth", "well-care"], note: "Reflecting on habits I want to build." },
  { id: "7", title: "Sunday Reset", date: "January 9, 2025", time: "10:00 AM", duration: "4:10", tags: ["self-care", "weekly"], note: "" },
  { id: "8", title: "Creative Session", date: "January 8, 2025", time: "3:45 PM", duration: "9:02", tags: ["creativity"], note: "New ideas for side projects." },
];

const SUGGESTED_TAGS = ["morning", "evening", "gratitude", "reflection", "goals", "work", "personal", "health", "ideas", "weekly"];

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({
  recording,
  isDark,
  onClose,
  onEdit,
}: {
  recording: Recording;
  isDark: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBorder = isDark ? "border-zinc-700" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";

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
          <Pressable onPress={onEdit} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Edit recording">
            <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Edit</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Video player placeholder */}
          <View
            className={`w-full rounded-2xl items-center justify-center mb-6 border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
            style={{ height: 200 }}
          >
            <Pressable
              className={`w-14 h-14 rounded-full items-center justify-center ${isDark ? "bg-white" : "bg-black"}`}
              accessibilityRole="button"
              accessibilityLabel="Play recording"
            >
              <Text className={`text-xl ${isDark ? "text-black" : "text-white"}`}>▶</Text>
            </Pressable>
            <Text className={`text-xs mt-3 ${textMuted}`}>{recording.duration}</Text>
          </View>

          {/* Title & date */}
          <Text className={`text-xl font-bold mb-1 ${textPrimary}`}>{recording.title}</Text>
          <Text className={`text-sm mb-5 ${textMuted}`}>{recording.date} · {recording.time}</Text>

          {/* Tags */}
          {recording.tags.length > 0 && (
            <View className="mb-5">
              <Text className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textMuted}`}>Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {recording.tags.map((tag) => (
                  <View key={tag} className={`rounded-full px-3 py-1 ${tagBg}`}>
                    <Text className={`text-xs ${textMuted}`}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Note */}
          <View className={`border-t pt-5 ${cardBorder}`}>
            <Text className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textMuted}`}>Note</Text>
            {recording.note ? (
              <Text className={`text-sm leading-6 ${textPrimary}`}>{recording.note}</Text>
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
  const [note, setNote] = useState(recording.note);
  const [selectedTags, setSelectedTags] = useState<string[]>(recording.tags);
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
    onSave({ ...recording, title: title.trim(), note, tags: selectedTags });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className={`flex-1 ${isDark ? "bg-zinc-950" : "bg-white"}`} edges={["top"]}>
        {/* Header */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Pressable onPress={onClose} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Cancel">
            <Text className={`text-sm ${textMuted}`}>Cancel</Text>
          </Pressable>
          <Text className={`text-base font-semibold ${textPrimary}`}>Edit Recording</Text>
          <Pressable onPress={handleSave} className="active:opacity-50" accessibilityRole="button" accessibilityLabel="Save changes">
            <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Video preview */}
          <View
            className={`w-full rounded-2xl items-center justify-center mb-6 border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
            style={{ height: 140 }}
          >
            <Text className="text-3xl opacity-30 mb-1">▶</Text>
            <Text className={`text-xs ${textMuted}`}>{recording.duration} · {recording.date}</Text>
          </View>

          {/* Title */}
          <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Title</Text>
          <TextInput
            className={`${inputStyle} mb-5`}
            placeholder="Recording title"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
            accessibilityLabel="Recording title"
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
            accessibilityLabel="Recording note"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RecordingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [recordings, setRecordings] = useState<Recording[]>(INITIAL_RECORDINGS);
  const [search, setSearch] = useState("");
  const [viewingRecording, setViewingRecording] = useState<Recording | null>(null);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";
  const inputBg = isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200";

  const filtered = recordings.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  function handleDelete(id: string) {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setRecordings((prev) => prev.filter((r) => r.id !== id));
            setViewingRecording(null);
          },
        },
      ]
    );
  }

  function handleSaveEdit(updated: Recording) {
    setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecording(null);
    // Refresh the view modal with updated data if it was open
    setViewingRecording(updated);
  }

  function openEdit(recording: Recording) {
    setViewingRecording(null);
    setEditingRecording(recording);
  }

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      {/* Header */}
      <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
        <Text className={`text-base font-bold ${textPrimary}`}>My Recordings</Text>
        <Pressable
          className="bg-black rounded-lg px-4 py-2 active:opacity-70"
          onPress={() => router.push("/new-recording" as any)}
          accessibilityRole="button"
          accessibilityLabel="New Recording"
        >
          <Text className="text-white text-sm font-semibold">+ New Recording</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-6 pt-4 pb-2">
        <View className={`flex-row items-center rounded-xl px-3 border ${inputBg}`}>
          <Text className={`text-sm mr-2 ${textMuted}`}>🔍</Text>
          <TextInput
            className={`flex-1 py-2.5 text-sm ${isDark ? "text-white" : "text-black"}`}
            placeholder="Search recordings or tags…"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search recordings"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel="Clear search">
              <Text className={`text-sm ${textMuted}`}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Count */}
      <View className="px-6 py-2">
        <Text className={`text-xs ${textMuted}`}>
          {filtered.length} {filtered.length === 1 ? "recording" : "recordings"}
          {search ? ` for "${search}"` : ""}
        </Text>
      </View>

      {/* List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View className={`rounded-2xl border px-6 py-12 items-center mt-4 ${cardBg} ${cardBorder}`}>
            <Text className="text-4xl mb-4">🔍</Text>
            <Text className={`text-base font-semibold mb-1 ${textPrimary}`}>No recordings found</Text>
            <Text className={`text-sm text-center ${textMuted}`}>
              {search ? "Try a different search term." : "You haven't made any recordings yet."}
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View
              key={item.id}
              className={`rounded-2xl border mb-3 p-4 ${cardBg} ${cardBorder}`}
            >
              <View className="flex-row items-start justify-between">
                {/* Tappable area: thumbnail + info → opens view modal */}
                <Pressable
                  className="flex-row items-start flex-1 active:opacity-70"
                  onPress={() => setViewingRecording(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View recording: ${item.title}`}
                >
                  {/* Thumbnail */}
                  <View
                    className={`rounded-xl items-center justify-center mr-3 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                    style={{ width: 64, height: 64 }}
                  >
                    <Text className="text-xl opacity-40">▶</Text>
                    <View className="absolute bottom-1 right-1 bg-black/70 rounded px-1">
                      <Text className="text-white text-xs">{item.duration}</Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className={`text-sm font-semibold mb-0.5 ${textPrimary}`} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className={`text-xs mb-2 ${textMuted}`}>
                      {item.date} · {item.time}
                    </Text>
                    {item.tags.length > 0 && (
                      <View className="flex-row flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <View key={tag} className={`rounded px-1.5 py-0.5 ${tagBg}`}>
                            <Text className={`text-xs ${textMuted}`}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {item.note ? (
                      <Text className={`text-xs mt-2 ${textMuted}`} numberOfLines={1}>
                        {item.note}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>

                {/* Actions — independent, no touch conflict */}
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
      </ScrollView>

      {/* View Modal */}
      {viewingRecording && (
        <ViewModal
          recording={viewingRecording}
          isDark={isDark}
          onClose={() => setViewingRecording(null)}
          onEdit={() => openEdit(viewingRecording)}
        />
      )}

      {/* Edit Modal */}
      {editingRecording && (
        <EditModal
          recording={editingRecording}
          isDark={isDark}
          onSave={handleSaveEdit}
          onClose={() => setEditingRecording(null)}
        />
      )}
    </SafeAreaView>
  );
}