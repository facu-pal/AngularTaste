import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private messaging!: Messaging;
  public push_token: string | null = null;

  constructor(private router: Router) {
    this.initFirebaseMessaging();
    this.listenToForegroundMessages();
  }

  private async initFirebaseMessaging() {
    try {
      const app = initializeApp(environment.firebaseConfig);
      this.messaging = getMessaging(app);

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'BCczorjTya43RxCNnXK4DUVsR1u7wkAYjABCCIo8kQXFrDjnNkVf_PznciEHkMb_8aHEPbc8Gx2osrEVKhru5hw',
        });

        if (token) {
          console.log('✅ Token FCM:', token);
          this.push_token = token;
          // Podés guardar el token en Firestore si querés
        } else {
          console.warn('⚠️ No se pudo obtener el token FCM.');
        }
      } else {
        console.warn('⚠️ Permiso para notificaciones denegado.');
      }
    } catch (error) {
      console.error('❌ Error al inicializar Firebase Messaging:', error);
    }
  }

  private listenToForegroundMessages() {
    try {
      if (!this.messaging) return;

      onMessage(this.messaging, (payload: any) => {
        console.log('📬 Mensaje recibido en primer plano:', payload);
        console.log('Permiso actual:', Notification.permission);


        const { title, body } = payload.notification!;
        const { path } = payload.data || {}; // 👈 obtenés el path

        alert(`Notificación: ${title} - ${body}`);
        
        if (Notification.permission === 'granted') {
          const notification = new Notification(title, { 
              body,
              // icon: '/assets/icon/favicon.png',
           });
         // Escuchar cuando el usuario hace clic en la notificación
          notification.onclick = () => {
            if (path) {

              console.log('🔗 Navegando a:', path);
              this.router.navigate([path]);
            }
          };

        }
      });
    } catch (error) {
      console.error('❌ Error al escuchar mensajes en primer plano:', error);
    }
  }
}