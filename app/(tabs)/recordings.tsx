
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { crossPlatformAlert } from '@/utils/crossPlatformAlert';
import { useEntries } from '@/hooks/useEntries';
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as VideoThumbnails from 'expo-video-thumbnails';
import {Image} from "expo-image"
import { supabase } from "@/lib/supabase";

type Recording = {
  id: string;
  title: string;
  created_at: string;
  body_text: string | null;
  video_path: string | null;
  tags: { id: string; name: string }[];
};

const SUGGESTED_TAGS = ["morning", "evening", "gratitude", "reflection", "goals", "work", "personal", "health", "ideas", "weekly"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
            {/* Duration will be added once video upload is wired up */}
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
  const [note, setNote] = useState(recording.body_text ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(recording.tags.map(t => t.name));
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
    // Pass back with tags as objects so Recording type is satisfied
    const updatedTags = selectedTags.map(name => {
      const existing = recording.tags.find(t => t.name === name);
      return existing ?? { id: name, name }; // use temp id for new tags
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
            <Text className={`text-xs ${textMuted}`}>{formatDate(recording.created_at)}</Text>
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
export async function getVideoUrl(path: string) {
  const { data, error } = await supabase
    .storage
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

    video.onloadeddata = () => {
      video.currentTime = 1;
    };

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

async function generateThumbnail(videoUri: string) {
  if (Platform.OS === "web") {
    return generateWebThumbnail(videoUri);
  }

  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000,
    });

    return uri;
  } catch (e) {
    console.log("Thumbnail error:", e);
    return null;
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RecordingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
 
  const { entries: recordings, loading, deleteEntry, updateEntry, refetch } = useEntries();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const results: Record<string, string | null> = {};

      for (const item of recordings) {
        if (!item.video_path) continue;
        if (thumbnails[item.id]) continue;

        let videoUrl = item.video_path;

        if (videoUrl) {
          const { data, error } = await supabase.storage
            .from("Videos")
            .createSignedUrl(videoUrl, 60 * 60);

          if (!error) {
            videoUrl = data.signedUrl;
          } else {
            console.log("Signed URL error:", error);
            continue;
          }
        }

        const thumb =
          Platform.OS === "web"
            ? await generateWebThumbnail(videoUrl)
            : await VideoThumbnails.getThumbnailAsync(videoUrl, {
                time: 1000,
              }).then(r => r.uri).catch(() => null);

        if (!cancelled) {
          results[item.id] = thumb;
        }
      }

      if (!cancelled) {
        setThumbnails(prev => ({ ...prev, ...results }));
      }
    }

    if (recordings.length > 0) run();


    return () => {
      cancelled = true;
    };
  }, [recordings]);
 
  const [search, setSearch] = useState("");
  const [viewingRecording, setViewingRecording] = useState<Recording | null>(null);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-50";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const tagBg = isDark ? "bg-zinc-700" : "bg-zinc-200";
  const inputBg = isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200";

  const filtered = recordings.filter((r: Recording) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  );

  function handleDelete(id: string) {
    crossPlatformAlert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This cannot be undone.',
      async () => {
        await deleteEntry(id);
        setViewingRecording(null);
      }
    );
  }

  async function handleSaveEdit(updated: Recording) {
    await updateEntry(updated.id, {
      title: updated.title,
      body_text: updated.body_text ?? '',
      tags: updated.tags.map((t) => t.name),
    });
    setEditingRecording(null);
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
          filtered.map((item: Recording) => (
            <View
              key={item.id}
              className={`rounded-2xl border mb-3 p-4 ${cardBg} ${cardBorder}`}
            >
              <View className="flex-row items-start justify-between">
                <Pressable
                  className="flex-row items-start flex-1 active:opacity-70"
                  onPress={() => setViewingRecording(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View recording: ${item.title}`}
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
                          className={`rounded-xl items-center justify-center mr-3 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                          style={{ width: 64, height: 64 }}
                        >
                          <Text className="text-xl opacity-40">▶</Text>
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

                {/* Actions */}
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