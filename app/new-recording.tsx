import { useEntries } from '@/hooks/useEntries';
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import {Video, ResizeMode} from "expo-av"
import * as VideoThumbnails from 'expo-video-thumbnails';
import {Image} from "expo-image"

const SUGGESTED_TAGS = [
  "morning", "evening", "gratitude", "reflection",
  "goals", "work", "personal", "health", "ideas", "weekly",
];

export default function NewRecordingScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const { createEntry, saveTags, saveVideo } = useEntries();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
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

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const recorded = !!videoUri
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [showFullVideo, setShowFullVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(false);

  useEffect(() => {
  if (!videoUri) return;

  let cancelled = false;

  async function run() {
    try {
      if (!videoUri) return;

      const uri = videoUri;

      const thumb = await generateThumbnail(uri);

      if (!cancelled) {
        console.log("THUMB GENERATED:", thumb);
        setThumbnailUri(thumb);
      }
    } catch (e) {
      console.log("Thumbnail effect error:", e);
    }
  }
  run();

  return () => {
    cancelled = true;
  };
}, [videoUri]);

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


  const recordingRef = useRef(false);

  async function webRecording() {
    if (isRecording) return;
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "video/webm",
        });

        setVideoBlob(blob);

        const url = URL.createObjectURL(blob);

        setVideoUri(url);
      };

      recorder.start();
      setIsRecording(true);
      recordingRef.current = true;
    } catch (e) {
      console.log(e);
      setError("Web recording failed (camera permission?)");
    }
  }

  function stopWebRecording() {
  if (!mediaRecorderRef.current) return;

  setIsRecording(false);

  mediaRecorderRef.current.stop();

  streamRef.current?.getTracks().forEach((track) => track.stop());
}

  async function handleStartRecording() {
    setError(null);

    if (Platform.OS === "web") {
      return webRecording();
    }
    
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) return;
      }

      setIsRecording(true);
      recordingRef.current = true;

      await new Promise<void>((resolve) => {
        const check = () => {
          if (cameraRef.current) return resolve();
          setTimeout(check, 50);
        };
        check();
      });

      if (!cameraRef.current) {
        setError("Camera not ready");
        setIsRecording(false);
        return;
      }

      const video = await cameraRef.current.recordAsync({
        maxDuration: 10,
      });

      console.log("VIDEO RESULT:", video);
    
      if (!video?.uri){
        setError("Recording failed - no video returned");
        setIsRecording(false);
        return;
      }

      setVideoUri(video.uri);

    } catch (e) {
      console.log(e);
      setError("Recording failed");
    } finally {
      setIsRecording(false);
      recordingRef.current = false;
    }
  }

  function handleStopRecording() {
    recordingRef.current = false;

    if (Platform.OS === "web") {
      stopWebRecording();
      return;
    }
  
    cameraRef.current?.stopRecording();
    setIsRecording(false);
  }

  async function generateThumbnail(videoUri: string) {
    if (Platform.OS === "web") {
      return new Promise<string | null>((resolve) => {
        const video = document.createElement("video");
        video.src = videoUri;
        video.currentTime = 1;

        video.onloadeddata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0);

          resolve(canvas.toDataURL("image/jpeg"));
        };

        video.onerror = () => resolve(null);
      });
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

  async function handleSave() {
    setError(null);
        
     if (!videoBlob && !videoUri) {
       setError("Please record a video before saving.");
       return;
     }
    if (!title.trim()) {
      setError("Please add a title for your recording.");
      return;
    }

    setSaving(true);
    try {
      const file: Blob | { uri: string; type?: string; name?: string } =
        Platform.OS === "web"
          ? (videoBlob as Blob)
          : { uri: videoUri!, type: "video/mp4" };

      const videoUrl = await saveVideo(file);

      const { data, error: saveError } = await createEntry(title.trim(), note.trim(), videoUrl);
      if (saveError) throw saveError;

      // Save tags if any were selected
      if (selectedTags.length > 0 && data) {
        await saveTags(data.id, selectedTags);
      }

      router.back();
    } catch (e) {
      console.log("SAVE ERROR:", e);
      setError("Something went wrong. Please try again.");
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  console.log("STATE:", {
    videoUri,
    thumbnailUri,
    recorded,
    isRecording,
  });

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className={`px-6 py-4 flex-row items-center justify-between border-b ${cardBorder}`}>
          <Pressable
            onPress={() => router.replace("/dashboard")} 
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
              <CameraView
                ref={cameraRef}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  opacity: 0,
                }}
                mode="video"
                facing='front'
              />

            {recorded ? (
              <View className="items-center">
                <Text className="text-4xl mb-2">✅</Text>
                <Text className={`text-sm font-medium ${textPrimary}`}>
                  Video recorded
                </Text>

                <Pressable
                  className="mt-3 px-4 py-2 rounded-lg bg-black"
                  onPress={() => setShowFullVideo(true)}
                >
                  <Text className="text-white text-xs">
                    View Playback
                  </Text>
                </Pressable>

                {thumbnailUri && (
                  <Pressable
                    className="mt-2 px-3 py-1 rounded-md bg-black"
                    onPress={() => {
                      setShowThumbnail(true);
                    }}
                  >
                    <Text className="text-white text-xs">
                      Preview Thumbnail
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  className="mt-3 active:opacity-60"
                  onPress={() => { setVideoUri(null); setIsRecording(false); setThumbnailUri(null)}}
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

                <Pressable onPress={() => router.push("/Video/recordingPreview")}>
                  <Text className={`text-xs mt-3 ${textMuted}`}>
                    Tap to open your camera
                  </Text>
                </Pressable>

                <Pressable onPress={() => router.push("/Audio/audioPreview")}>
                  <Text className={`text-xs mt-3 ${textMuted}`}>
                    Tap to open audio
                  </Text>
                </Pressable>


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
      <Modal visible={showFullVideo} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "black",
            width: "100%",
            height: "100%",
          }}
        >

          <View
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
            }}
          >
            {Platform.OS === "web" ? (
              <video
                src={videoUri!}
                controls
                autoPlay
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backgroundColor: "black",
                }}
              />
            ) : (
              <Video
                source={{ uri: videoUri! }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
              />
            )}
          </View>

          <Pressable
            onPress={() => setShowFullVideo(false)}
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 999,
              padding: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 18 }}>✕</Text>
          </Pressable>

        </View>
      </Modal>
      <Modal visible={showThumbnail} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Image
            source={{ uri: thumbnailUri! }}
            style={{
              width: "90%",
              height: 450,
              borderRadius: 12,
            }}
            contentFit="contain"
          />

          <Pressable
            onPress={() => setShowThumbnail(false)}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: "white" }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}