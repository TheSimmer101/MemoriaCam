import { Platform } from "react-native";

/**
 * Compresses a video for iOS/Android using react-native-compressor,
 * and returns the raw blob on web (FFmpeg.wasm is too heavy for most use cases).
 *
 * Install deps:
 *   npx expo install react-native-compressor
 *
 * Usage:
 *   const result = await compressVideo(videoUri);
 *   // result.uri  — compressed file URI (native) or original blob URL (web)
 *   // result.blob — Blob (web only), undefined on native
 */

export type CompressVideoResult =
  | { uri: string; blob?: Blob }
  | { uri: string; blob: Blob };

export async function compressVideo(
  videoUri: string,
  options?: {
    quality?: number; // 0.0 – 1.0, default 0.6
  }
): Promise<CompressVideoResult> {
  const quality = options?.quality ?? 0.6;

  // On web:
  // Browsers don't support native video compression libs.
  // Return the blob URL as is (unchanged)
 
  if (Platform.OS === "web") {
    const response = await fetch(videoUri);
    const blob = await response.blob();
    return { uri: videoUri, blob };
  }

  // On mobile (IOS/Android):
  // react-native-compressor handles native compression.
  // It uses AVFoundation on iOS and MediaCodec on Android.
  try {
    const { Video } = await import("react-native-compressor");

    const compressedUri = await Video.compress(videoUri, {
      compressionMethod: "auto",
      quality,
    });

    return { uri: compressedUri };
  } catch (e) {
    console.warn("compressVideo: compression failed, returning original", e);
    return { uri: videoUri };
  }
}