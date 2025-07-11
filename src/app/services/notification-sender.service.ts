import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

interface NotificationPayload {
  title: string;
  body: string;
  roles: string[];
  path?: string;
  collection: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSenderService {

 private apiUrl = 'https://push-notification-nqye.onrender.com/enviarNotificacion';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  async enviarNotificacion(payload: NotificationPayload): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.http.post(this.apiUrl, payload, { headers: this.headers })
      );
      console.log('Notificación enviada:', response);
      return response;
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      throw error;
    }
  }
}
