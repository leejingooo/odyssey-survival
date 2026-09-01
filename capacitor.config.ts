import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native packaging config. `npm run cap:sync` builds the web app into `dist/`
 * and copies it into the native projects created by `npx cap add android|ios`.
 */
const config: CapacitorConfig = {
  appId: 'com.odyssey.survival',
  appName: 'Odyssey Survival',
  webDir: 'dist',
  // Locking to portrait and hiding the status bar is done in the native
  // projects; see README for the two files to touch.
  android: {
    backgroundColor: '#07060F',
  },
  ios: {
    backgroundColor: '#07060F',
    contentInset: 'never',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
