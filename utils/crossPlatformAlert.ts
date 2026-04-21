import { Alert, Platform } from 'react-native';

export function crossPlatformAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  if (Platform.OS === 'web') {
    // Windows / web — use browser native confirm dialog
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) onConfirm();
    else onCancel?.();
  } else {
    // iOS / Android — use React Native Alert
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
}