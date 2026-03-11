import {
  AudioModule, RecordingPresets, setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';

export default function App() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [uri, setUri] = useState<string | null>(null);
  const player = useAudioPlayer(uri ?? undefined);

  const record = async () => {
    await audioRecorder.prepareToRecordAsync();
    await audioRecorder.record();
  };

  const stopRecording = async () => {
    await audioRecorder.stop();
    setUri(audioRecorder.uri);
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
        <Button
            title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
            onPress={recorderState.isRecording ? stopRecording : record}
        />

        {uri && (
            <Button
            title="Play Test Audio"
            onPress={() => player.play()}
            />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});