import React from 'react';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import ConfigScreen from './src/screens/ConfigScreen';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

// Registrar el handler del widget
registerWidgetTaskHandler(widgetTaskHandler);

export default function App() {
  return <ConfigScreen />;
}
