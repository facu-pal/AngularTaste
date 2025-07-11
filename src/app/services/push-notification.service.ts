import { Injectable } from '@angular/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema
} from '@capacitor/push-notifications';
import { isPlatform, AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  public push_token: string | null = null;
  private initialized = false;

  constructor(private alertController: AlertController) {}

  async initPush() {
    // Solo ejecuta en dispositivos con Capacitor
    if (!isPlatform('capacitor')) return;

    // Previene múltiples registros de listeners
    if (this.initialized) {
      console.log('⛔ initPush ya fue inicializado');
      return;
    }

    // Solicita permisos
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('❌ Permiso de notificaciones denegado');
      return;
    }

    // Registra el dispositivo en FCM
    await PushNotifications.register();

    // ✅ Marca como inicializado antes de registrar los listeners
    this.initialized = true;

    // Listener: token obtenido
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('✅ Token FCM obtenido:', token.value);
      this.push_token = token.value;
      // Enviar al backend si lo necesitás
    });

    // Listener: error en el registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Error de registro:', error);
    });

    // Listener: notificación recibida en primer plano
    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        console.log('📩 Notificación recibida:', notification);

        const alert = await this.alertController.create({
          header: notification.title || 'Notificación',
          message: notification.body || 'Sin contenido',
          buttons: ['Aceptar']
        });

        await alert.present();
      }
    );

    // Listener: usuario interactúa con la notificación
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('🔁 Acción en notificación:', notification);
        // Podés hacer navegación si incluís un "path" en el `data` del backend
      }
    );
  }

  clearToken() {
    this.push_token = null;
    // Si tenés backend, avisale que se limpió
  }
}
