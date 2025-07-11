import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp,
  getDocs
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';
import { NotificationSenderService } from './notification-sender.service';
@Injectable({
  providedIn: 'root',
})
export class ConsultasService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private db: DatabaseService,
    private notificationSenderService: NotificationSenderService,
  ) {}

  async enviarMensaje(mensaje: string) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const cliente = await this.db.obtenerUsuarioPorId(user.uid, 'clientes');
    const rol = cliente?.rol || 'cliente';

    let idMesa = 0;
    if (rol === 'cliente') {
      const pedidos = query(
        collection(this.firestore, 'pedidos'),
        where('idUsuario', '==', user.uid)
      );
      const snap = await getDocs(pedidos);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        idMesa = data['idMesa'] || 0;
      }
    }

    const docRef = collection(this.firestore, 'mensajes');
    await addDoc(docRef, {
      mensaje,
      fecha: Timestamp.now(),
      uid: user.uid,
      rol,
      nombre: cliente?.nombre || '',
      idMesa,
    });
    if (rol === 'cliente') {
        this.notificationSenderService.enviarNotificacion({
              title: 'Nuevo consulta del cliente',
              body: `Hay una nueva consulta del cliente: ${cliente?.nombre}`,
              roles: ['mozo'],
              path: 'client-approval',
              collection: 'clientes',
            });

    }

  }

  escucharMensajes(callback: (mensajes: any[]) => void): () => void {
    const mensajesRef = query(
      collection(this.firestore, 'mensajes'),
      orderBy('fecha', 'asc')
    );

    const unsubscribe = onSnapshot(mensajesRef, (snapshot) => {
      const mensajes = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          fecha: data['fecha'].toDate(),
        };
      });
      callback(mensajes);
    });

    return unsubscribe;
  }
}
