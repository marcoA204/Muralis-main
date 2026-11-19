import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muralis.app',
  appName: 'Muralis',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
