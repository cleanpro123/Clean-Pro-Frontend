import { Alert, Platform } from 'react-native';

let _show = null;

export function _registerConfirmHost(fn) {
  _show = fn;
  return () => {
    if (_show === fn) _show = null;
  };
}

export function confirmAction({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  // Single-button informational modal (no Cancel) — e.g. validation notices.
  hideCancel = false,
  // Visual tone: 'info' shows an information icon instead of the question/alert.
  tone = null,
  onConfirm,
}) {
  if (_show) {
    _show({
      title,
      message,
      confirmLabel,
      cancelLabel,
      destructive,
      hideCancel,
      tone,
      onConfirm,
    });
    return;
  }

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (hideCancel) {
      if (typeof window !== 'undefined') window.alert(text);
      onConfirm && onConfirm();
      return;
    }
    if (typeof window !== 'undefined' && window.confirm(text)) {
      onConfirm && onConfirm();
    }
    return;
  }

  const buttons = hideCancel
    ? [{ text: confirmLabel, onPress: () => onConfirm && onConfirm() }]
    : [
        { text: cancelLabel, style: 'cancel' },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => onConfirm && onConfirm(),
        },
      ];
  Alert.alert(title, message, buttons);
}
