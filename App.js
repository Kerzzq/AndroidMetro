import React from 'react';
import { registerWidgetTaskHandler, registerWidgetConfigurationScreen } from 'react-native-android-widget';
import ConfigScreen from './src/screens/ConfigScreen';
import ConsultationScreen from './src/screens/ConsultationScreen';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

// Registrar el handler del widget
registerWidgetTaskHandler(widgetTaskHandler);

// Registrar la pantalla de configuración del widget
registerWidgetConfigurationScreen(ConfigScreen);

export default function App() {
  return <ConsultationScreen />;
}
