import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Each RN Modal owns a native window. Measure there, outside animated/scrolling
// content, and apply each inset once. No cached activity metrics in modal roots.
export default function SafeScreen({ children }) {
  return <SafeAreaProvider style={{ flex: 1, backgroundColor: '#011228' }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#011228' }}>{children}</SafeAreaView>
  </SafeAreaProvider>;
}
