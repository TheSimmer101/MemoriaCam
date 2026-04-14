import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";

const NUM_BARS = 8;

export default function App() {
  const [levels, setLevels] = useState<number[]>(Array(NUM_BARS).fill(0));
  const prevLevelsRef = useRef<number[]>(Array(NUM_BARS).fill(0));
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      setupWebMic();
    } else {
      setupMobileMic();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (Platform.OS !== "web" && recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);


  //Web Audio API
  const setupWebMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevels = () => {
        analyser.getByteFrequencyData(dataArray);
        const skipLow = 2;
        const usableBins = Math.floor(analyser.frequencyBinCount * 0.8) - skipLow;
        const sliceSize = Math.floor(usableBins / NUM_BARS);
        const newLevels = Array(NUM_BARS).fill(0);

        for (let i = 0; i < NUM_BARS; i++) {
          let sum = 0;
          for (let j = 0; j < sliceSize; j++) {
            sum += dataArray[skipLow + i * sliceSize + j];
          }
          const avg = sum / sliceSize / 255;
          const smoothed = prevLevelsRef.current[i] * 0.8 + avg * 0.2;
          newLevels[i] = Math.max(smoothed - 0.02, 0);
          prevLevelsRef.current[i] = newLevels[i];
        }

        setLevels(newLevels);
        animationRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch (err) {
      console.error("Web mic failed:", err);
    }
  };

  const setupMobileMic = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      recordingRef.current = recording;

      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recording.startAsync();

      const updateLevels = async () => {
        if (!recordingRef.current) return;
        const status = await recordingRef.current.getStatusAsync();
        if (status.metering !== undefined) {
          const normalized = (status.metering + 160) / 160; // dB → 0–1
          const newLevels = Array(NUM_BARS)
            .fill(0)
            .map((_, i) => prevLevelsRef.current[i] * 0.8 + normalized * 0.2);
          prevLevelsRef.current = newLevels;
          setLevels(newLevels);
        }
        animationRef.current = requestAnimationFrame(updateLevels);
      };

      updateLevels();
    } catch (err) {
      console.error("Mobile mic failed:", err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 24, marginBottom: 20 }}>
        Mic Levels
      </Text>
      <View style={{ flexDirection: "row", gap: 4, height: 200 }}>
        {levels.map((level, idx) => {
          let color = "green";
          if (level > 0.6) color = "orange";
          if (level > 0.8) color = "red";
          return (
            <View
              key={idx}
              style={{
                width: 20,
                height: 200,
                backgroundColor: "#333",
                borderRadius: 4,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: level * 200,
                  backgroundColor: color,
                  borderRadius: 4,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}