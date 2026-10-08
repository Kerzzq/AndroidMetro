// La configuración original de app.json se conserva para las builds normales.
module.exports = ({ config }) => {
  if (process.env.ANDROIDMETRO_TEST !== '1') return config;
  return {
    ...config,
    name: 'Metro Bilbao (pruebas)',
    android: {
      ...config.android,
      package: 'com.metrobilbao.widget.pruebas',
      versionCode: 1,
    },
    plugins: config.plugins.map((plugin) => {
      if (!Array.isArray(plugin) || plugin[0] !== 'react-native-android-widget') return plugin;
      return [plugin[0], {
        ...plugin[1],
        widgets: plugin[1].widgets.map((widget) => ({ ...widget, label: 'Metro Bilbao (pruebas)' })),
      }];
    }),
  };
};
