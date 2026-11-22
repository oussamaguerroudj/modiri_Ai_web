import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.modiri.app',
  appName: 'Modiri AI',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
