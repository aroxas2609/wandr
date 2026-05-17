import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const expo = appJson.expo as ExpoConfig;

const config: ExpoConfig = {
  ...expo,
  extra: {
    ...(typeof expo.extra === 'object' && expo.extra !== null ? expo.extra : {}),
    googleMapsApiKey,
  },
  ios: {
    ...expo.ios,
    config: {
      ...expo.ios?.config,
      googleMapsApiKey,
    },
  },
  android: {
    ...expo.android,
    config: {
      ...expo.android?.config,
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  plugins: (expo.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'react-native-maps') {
      return [
        'react-native-maps',
        {
          ios: { googleMapsApiKey },
          android: { googleMapsApiKey },
        },
      ] as const;
    }
    return plugin;
  }),
};

export default { expo: config };
