import { Platform, Text, View, StyleSheet } from 'react-native';
import SlidingSquare from '@/components/ui/authMenu';

export default function LoginScreen() {
  return (
    <View style={styles.mainContainer}>
      {Platform.OS === 'web' && (
        <View style={styles.leftPanel}>
          <Text style={styles.title}>MemoriaCam</Text>
          <Text style={styles.subtitle}>Record your memories, through video and text.</Text>
        </View>
      )}
      <View style={styles.rightPanel}>
        <Text style={styles.welcomeText}>Welcome to MemoriaCam</Text>
        <SlidingSquare onSuccessfulLogin={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', minHeight: '100%' },
  leftPanel: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { color: 'white', fontSize: 36, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: '#aaa', fontSize: 16, textAlign: 'center' },
  rightPanel: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  welcomeText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});