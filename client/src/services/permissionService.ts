import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

export interface CameraPermissionResult {
  granted: boolean;
  error?: string;
}

export async function ensureCameraPermissions(): Promise<CameraPermissionResult> {

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Camera.checkPermissions();
      if (status.camera === 'granted') {
        return { granted: true };
      }

      const requestResult = await Camera.requestPermissions({ permissions: ['camera'] });
      if (requestResult.camera === 'granted') {
        return { granted: true };
      }

      return {
        granted: false,
        error: 'Permissão de câmera não foi concedida. Habilite nas configurações do aplicativo.'
      };
    } catch (err: any) {
      console.warn('Native camera permission error:', err);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
    return { granted: true };
  }

  return {
    granted: false,
    error: 'Seu navegador ou dispositivo não tem suporte à câmera.'
  };
}
