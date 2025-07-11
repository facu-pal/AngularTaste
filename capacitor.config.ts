import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'angular.taste',
  appName: 'Angular Taste',
  webDir: 'www',
   plugins: {
    SplashScreen: {
      launchShowDuration: 0,      // No mostrar splash nativo
      launchAutoHide: true,      // Ocultar inmediatamente si aparece
      backgroundColor: '#ffffff', // Color de fondo (igual al de tu splash)
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: false,   // No usar fullscreen nativo
      splashImmersive: false     // Desactivar inmersivo nativo
    }
  }
};

export default config;
