import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

function ScreenContents({ children, avoidKeyboard }) {
  const frame = useSafeAreaFrame(), insets = useSafeAreaInsets();
  const body = <SafeAreaView style={{ flex: 1, backgroundColor: '#011228' }}>{children}</SafeAreaView>;
  if (!avoidKeyboard) return body;
  // Provider frame is relative to the native window (a modal may start below
  // status bars). Bottom safe padding is already applied inside: subtract it
  // from the keyboard offset, so content ends at IME top without double insets.
  // Keep the outer frame stable: height feedback can oscillate in Android modals.
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding"
    keyboardVerticalOffset={frame.y - insets.bottom}>{body}</KeyboardAvoidingView>;
}

// Each RN Modal owns a native window. Measure there, outside animated/scrolling
// content, and apply each inset once. No cached activity metrics in modal roots.
export default function SafeScreen({ children, avoidKeyboard = false }) {
  return <SafeAreaProvider style={{ flex: 1, backgroundColor: '#011228' }}>
    <ScreenContents avoidKeyboard={avoidKeyboard}>{children}</ScreenContents>
  </SafeAreaProvider>;
}
