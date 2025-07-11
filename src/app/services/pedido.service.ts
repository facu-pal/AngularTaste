import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Unsubscribe,
  onSnapshot,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { NotificationSenderService } from './notification-sender.service';
@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private unsubscribePedidos: Unsubscribe | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private toastCtrl: ToastController,
    private notificationSenderService: NotificationSenderService
  ) {}

  async crearPedido(pedidoData: any): Promise<string> {
    try {
      const usuario = this.authService.getCurrentUser();
      if (!usuario) throw new Error('Usuario no autenticado');

      // Verificar si ya existe un pedido con mesa asignada
      const pedidoExistente = await this.obtenerPedidoMesaAsignada(usuario.uid);

      if (pedidoExistente) {
        return await this.actualizarPedidoExistente(
          pedidoExistente.id,
          pedidoData
        );
      } else {
        const idPedido = await this.databaseService.generarIdSecuencial(
          'pedidos'
        );
        return await this.crearNuevoPedido(idPedido, usuario, pedidoData);
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      this.mostrarToast('Error al crear pedido', 'danger');
      throw error;
    }
  }

  private async obtenerPedidoMesaAsignada(usuarioId: string): Promise<any> {
    const col = collection(this.firestore, 'pedidos');
    const q = query(
      col,
      where('idUsuario', '==', usuarioId),
      where('estado', '==', 'mesa asignada')
    );
    const snapshot = await getDocs(q);

    return snapshot.empty
      ? null
      : {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
  }

  private async actualizarPedidoExistente(
    pedidoId: string,
    pedidoData: any
  ): Promise<string> {
    const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);

    await updateDoc(pedidoRef, {
      productos: this.prepararProductos(pedidoData.productos),
      precioTotal: pedidoData.precioTotal,
      tiempoEstimado: pedidoData.tiempoEstimado,
      estado: 'pedido hecho',
    });

    return pedidoId;
  }

  private async crearNuevoPedido(
    idPedido: string,
    usuario: any,
    pedidoData: any
  ): Promise<string> {
    const pedidoCompleto = {
      ...pedidoData,
      productos: this.prepararProductos(pedidoData.productos),
      idPedido,
      idUsuario: usuario.uid,
      estado: 'pedido hecho',
      fecha: new Date(),
      emailUsuario: usuario.email || '',
    };

    const col = collection(this.firestore, 'pedidos');
    const docRef = await addDoc(col, pedidoCompleto);

    return idPedido;
  }

  private prepararProductos(productos: any[]): any[] {
    return productos.map((producto) => ({
      ...producto,
      idProducto: producto.id,
      estadoProducto: 'pendiente',
    }));
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
  }

  //para obtener pedidos con estado pedido hecho
  async obtenerPedidosHechos(): Promise<any[]> {
    try {
      const col = collection(this.firestore, 'pedidos');
      const q = query(col, where('estado', '==', 'pedido hecho'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      this.mostrarToast('Error al cargar pedidos', 'danger');
      return [];
    }
  }

  async cambiarAEnPreparacion(idPedido: string): Promise<void> {
    try {
      const pedidoRef = doc(this.firestore, `pedidos/${idPedido}`);
      await updateDoc(pedidoRef, {
        estado: 'en preparación',
      });
      this.mostrarToast('Pedido enviado a cocina', 'success');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      this.mostrarToast('Error al actualizar pedido', 'danger');
      throw error;
    }
  }

  //metodos para el mozo

  async actualizarEstadoPedido(
    idPedido: string,
    nuevoEstado: string,
    mensajeExito: string
  ): Promise<void> {
    try {
      const pedidoRef = doc(this.firestore, `pedidos/${idPedido}`);
      await updateDoc(pedidoRef, {
        estado: nuevoEstado,
      });
      this.mostrarToast(mensajeExito, 'success');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      this.mostrarToast('Error al actualizar pedido', 'danger');
      throw error;
    }
  }

  suscribirAPedidos(
    estados: string[],
    callback: (pedidos: any[]) => void
  ): void {
    this.cancelarSuscripcion(); // Limpiar suscripción previa

    const col = collection(this.firestore, 'pedidos');
    const q = query(col, where('estado', 'in', estados));

    this.unsubscribePedidos = onSnapshot(
      q,
      (querySnapshot) => {
        const pedidos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(pedidos);
      },
      (error) => {
        console.error('Error en suscripción:', error);
        this.mostrarToast('Error al cargar pedidos', 'danger');
      }
    );
  }

  cancelarSuscripcion(): void {
    if (this.unsubscribePedidos) {
      this.unsubscribePedidos();
      this.unsubscribePedidos = null;
    }
  }

  /* COCINERO Y BARTENDER - AJUSTADO PARA TU ESTRUCTURA */
  async obtenerPedidosParaPreparacion(): Promise<any[]> {
    try {
      const col = collection(this.firestore, 'pedidos');
      const q = query(
        col,
        where('estado', 'in', [
          'en preparación',
          'cocina lista',
          'bebida lista',
        ])
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      this.mostrarToast('Error al cargar pedidos', 'danger');
      return [];
    }
  }

  async actualizarEstadoProducto(
    pedidoId: string,
    productoId: string,
    nuevoEstado: string
  ): Promise<void> {
    try {
      const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
      const pedidoDoc = await getDoc(pedidoRef);

      if (pedidoDoc.exists()) {
        const pedidoData = pedidoDoc.data();
        const productosActualizados = pedidoData['productos'].map(
          (producto: any) => {
            if (producto.idProducto === productoId) {
              return { ...producto, estadoProducto: nuevoEstado };
            }
            return producto;
          }
        );

        await updateDoc(pedidoRef, { productos: productosActualizados });
        this.mostrarToast('Estado del producto actualizado', 'success');
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      this.mostrarToast('Error al actualizar producto', 'danger');
      throw error;
    }
  }

  /* COCINERO Y BARTENDER  */
  async marcarComoListoParaEntregar(
    pedidoId: string,
    tipo: 'comida' | 'bebida',
    idMesa: string
  ): Promise<void> {
    try {
      const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
      const pedidoDoc = await getDoc(pedidoRef);

      if (pedidoDoc.exists()) {
        const pedidoData = pedidoDoc.data();
        const productos = pedidoData['productos'] || [];

        // Obtener todos los productos de comida/bebida
        const productosComida = productos.filter(
          (p: any) => p.tipo === 'comida' || p.tipo === 'postre'
        );
        const productosBebida = productos.filter(
          (p: any) => p.tipo === 'bebida'
        );

        // Verificar si todos los productos del tipo actual están preparados
        const todosPreparadosTipoActual =
          tipo === 'comida'
            ? productosComida.every(
                (p: any) => p.estadoProducto === 'preparado'
              )
            : productosBebida.every(
                (p: any) => p.estadoProducto === 'preparado'
              );

        if (!todosPreparadosTipoActual) {
          throw new Error('No todos los productos están preparados');
        }

        // Verificar estado del otro tipo
        const todosPreparadosComida = productosComida.every(
          (p: any) => p.estadoProducto === 'preparado'
        );
        const todosPreparadosBebida = productosBebida.every(
          (p: any) => p.estadoProducto === 'preparado'
        );

        let nuevoEstado = pedidoData['estado'];

        if (tipo === 'comida') {
          nuevoEstado = todosPreparadosBebida
            ? 'listo para servir'
            : 'cocina lista';
        } else {
          nuevoEstado = todosPreparadosComida
            ? 'listo para servir'
            : 'bebida lista';
        }

        await updateDoc(pedidoRef, { estado: nuevoEstado });

        if (nuevoEstado === 'listo para servir') {
          this.notificationSenderService.enviarNotificacion({
            title: 'Pedido listo para servir',
            body: `El pedido de la mesa${idMesa} ya está listo para servir.`,
            roles: ['mozo'],
            path: 'client-approval',
            collection: 'clientes',
          });
        }

        this.mostrarToast(`Estado actualizado a ${nuevoEstado}`, 'success');
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      this.mostrarToast(
        'Error: No todos los productos están preparados',
        'danger'
      );
      throw error;
    }
  }

  // En tu PedidoService
  suscribirAPedido(
    estados: string[],
    callback: (pedidos: any[]) => void,
    errorCallback?: (error: any) => void
  ): void {
    this.cancelarSuscripcion();

    const col = collection(this.firestore, 'pedidos');
    const q = query(col, where('estado', 'in', estados));

    this.unsubscribePedidos = onSnapshot(
      q,
      (querySnapshot) => {
        const pedidos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Asegúrate de incluir el ID del documento
          docId: doc.id,
        }));
        callback(pedidos);
      },
      (error) => {
        console.error('Error en suscripción:', error);
        if (errorCallback) errorCallback(error);
        this.mostrarToast('Error al cargar pedidos', 'danger');
      }
    );
  }

  suscribirAPedidosPorUsuario(
    usuarioId: string,
    estados: string[],
    callback: (pedidos: any[]) => void,
    errorCallback?: (error: any) => void
  ): void {
    this.cancelarSuscripcion();

    const col = collection(this.firestore, 'pedidos');
    const q = query(
      col,
      where('idUsuario', '==', usuarioId),
      where('estado', 'in', estados)
    );

    this.unsubscribePedidos = onSnapshot(
      q,
      (querySnapshot) => {
        const pedidos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(pedidos);
      },
      (error) => {
        console.error('Error en suscripción:', error);
        if (errorCallback) errorCallback(error);
        this.mostrarToast('Error al cargar pedidos', 'danger');
      }
    );
  }

  async actualizarPedidoCompleto(
    pedidoId: string,
    pedidoData: any
  ): Promise<void> {
    try {
      const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
      await updateDoc(pedidoRef, pedidoData);
      this.mostrarToast('Pedido actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      this.mostrarToast('Error al actualizar pedido', 'danger');
      throw error;
    }
  }

  //para liberar la mesa
  async liberarMesa(idMesa: number): Promise<void> {
    try {
      if (!idMesa) {
        console.warn('No se proporcionó un ID de mesa válido');
        return;
      }

      const mesasRef = collection(this.firestore, 'mesas');
      const q = query(mesasRef, where('idMesa', '==', idMesa));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`No se encontró la mesa con id ${idMesa}`);
        return;
      }

      const mesaDoc = querySnapshot.docs[0];
      await updateDoc(doc(this.firestore, `mesas/${mesaDoc.id}`), {
        estado: 'libre',
      });

      this.mostrarToast(`Mesa ${idMesa} liberada correctamente`, 'success');
    } catch (error) {
      console.error('Error al liberar la mesa:', error);
      this.mostrarToast('Error al liberar la mesa', 'danger');
      throw error;
    }
  }

  async obtenerEstadoPedido(pedidoId: string): Promise<string | null> {
  try {
    const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
    const pedidoDoc = await getDoc(pedidoRef);

    if (pedidoDoc.exists()) {
      const data = pedidoDoc.data();
      return data['estado'] || null;
    } else {
      console.warn('Pedido no encontrado:', pedidoId);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener estado del pedido:', error);
    this.mostrarToast('Error al obtener estado del pedido', 'danger');
    return null;
  }
}


}
