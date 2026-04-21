import { useEntries } from '@/hooks/useEntries';
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUGGESTED_TAGS = [
  "morning", "evening", "gratitude", "reflection",
  "goals", "work", "personal", "health", "ideas", "weekly",
];

export default function NewRecordingScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const { createEntry, saveTags } = useEntries();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = isDark ? "bg-black" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const cardBg = isDark ? "bg-zinc-900" : "bg-zinc-100";
  const cardBorder = isDark ? "border-zinc-800" : "border-zinc-200";
  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm border ${
    isDark
      ? "bg-zinc-800 text-white border-zinc-700"
      : "bg-zinc-100 text-black border-zinc-200"
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

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleStartRecording() {
    // TODO: integrate with expo-camera / expo-av
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setRecorded(true);
    }, 3000);
  }

  function handleStopRecording() {
    setIsRecording(false);
    setRecorded(true);
  }

  async function handleSave() {
    setError(null);

    //Commented out for testing since video recording isnt wired up
    // if (!recorded) {
    //   setError("Please record a video before saving.");
    //   return;
    // }
    if (!title.trim()) {
      setError("Please add a title for your recording.");
      return;
    }

    setSaving(true);
    try {
      const { data, error: saveError } = await createEntry(title.trim(), note.trim());
      if (saveError) throw saveError;

      // Save tags if any were selected
      if (selectedTags.length > 0 && data) {
        await saveTags(data.id, selectedTags);
      }

      router.back();
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-50"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ flex: 1 }}
          >
            <Text className={`text-sm ${textMuted}`}>← Back</Text>
          </Pressable>

          <Text className={`text-base font-semibold ${textPrimary}`} style={{ flex: 1, textAlign: 'center' }}>
            New Recording
          </Text>

          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Error */}
          {error && (
            <View className="bg-red-100 border border-red-300 rounded-xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

          {/* Camera / Recording area */}
          <View
            className={`w-full rounded-2xl items-center justify-center mb-6 border ${cardBg} ${cardBorder}`}
            style={{ height: 220 }}
          >
            {recorded ? (
              <View className="items-center">
                <Text className="text-4xl mb-2">✅</Text>
                <Text className={`text-sm font-medium ${textPrimary}`}>
                  Video recorded
                </Text>
                <Pressable
                  className="mt-3 active:opacity-60"
                  onPress={() => { setRecorded(false); setIsRecording(false); }}
                  accessibilityRole="button"
                  accessibilityLabel="Re-record video"
                >
                  <Text className={`text-xs underline ${textMuted}`}>Re-record</Text>
                </Pressable>
              </View>
            ) : isRecording ? (
              <View className="items-center">
                <View className="w-4 h-4 rounded-full bg-red-500 mb-3" />
                <Text className={`text-sm font-medium mb-4 ${textPrimary}`}>
                  Recording…
                </Text>
                <Pressable
                  className="bg-red-500 px-5 py-2.5 rounded-xl active:opacity-70"
                  onPress={handleStopRecording}
                  accessibilityRole="button"
                  accessibilityLabel="Stop recording"
                >
                  <Text className="text-white text-sm font-semibold">Stop</Text>
                </Pressable>
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-4xl mb-3 opacity-30">🎥</Text>
                <Pressable
                  className={`px-5 py-2.5 rounded-xl active:opacity-70 ${isDark ? "bg-white" : "bg-black"}`}
                  onPress={handleStartRecording}
                  accessibilityRole="button"
                  accessibilityLabel="Start recording"
                >
                  <Text className={`text-sm font-semibold ${isDark ? "text-black" : "text-white"}`}>
                    Start Recording
                  </Text>
                </Pressable>
                <Text className={`text-xs mt-3 ${textMuted}`}>
                  Tap to open your camera
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Title</Text>
          <TextInput
            className={`${inputStyle} mb-5`}
            placeholder="e.g. Morning Reflection"
            placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
            accessibilityLabel="Recording title"
          />

          {/* Tags */}
          <Text className={`text-sm font-semibold mb-2 ${textPrimary}`}>Tags</Text>

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {selectedTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(tag)}
                  className={`flex-row items-center rounded-full px-3 py-1 ${isDark ? "bg-white" : "bg-black"}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                >
                  <Text className={`text-xs font-medium mr-1 ${isDark ? "text-black" : "text-white"}`}>
                    {tag}
                  </Text>
                  <Text className={`text-xs ${isDark ? "text-black" : "text-white"}`}>✕</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Custom tag input */}
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className={`flex-1 rounded-xl px-4 py-3 text-sm border ${
                isDark ? "bg-zinc-800 text-white border-zinc-700" : "bg-zinc-100 text-black border-zinc-200"
              }`}
              placeholder="Add a custom tag…"
              placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
              autoCapitalize="none"
              accessibilityLabel="Custom tag input"
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

          {/* Suggested tags */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            {SUGGESTED_TAGS.filter((t) => !selectedTags.includes(t)).map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 border active:opacity-60 ${cardBg} ${cardBorder}`}
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
            className={`${inputStyle} mb-2`}
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

          {/* Save button */}
          <Pressable
            className={`w-full mt-4 py-3 rounded-xl items-center active:opacity-70 ${
              saving ? "opacity-50" : ""
            } ${isDark ? "bg-white" : "bg-black"}`}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save recording"
          >
            <Text className={`text-base font-semibold ${isDark ? "text-black" : "text-white"}`}>
              {saving ? "Saving…" : "Save Recording"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}