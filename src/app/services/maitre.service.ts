import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  doc, 
  updateDoc,
  getDoc
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';

interface Mesa {
  idMesa: number;
  estado: string;
  docId: string;
}

interface PedidoConCliente {
  idPedido: string;  // p0005
  idDocumento: string; // ID del documento Firestore
  idUsuario: string;
  estado: string;
  clienteInfo: any;
  mesaSeleccionada: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MaitreService {
  constructor(
    private firestore: Firestore,
    private database: DatabaseService
  ) {}

  getMesasDisponibles(): Observable<Mesa[]> {
    const mesasRef = collection(this.firestore, 'mesas');
    const q = query(mesasRef, where('estado', '==', 'libre'));
    
    return collectionData(q, { idField: 'docId' }).pipe(
      map((mesas: any[]) => mesas.map(mesa => ({
        idMesa: Number(mesa['idMesa']),
        estado: mesa['estado'],
        docId: mesa['docId']
      })).filter(mesa => !isNaN(mesa.idMesa)))
    );
  }

    traerColeccion(nombreColeccion: string) {
    const col = collection(this.firestore, nombreColeccion);
    return collectionData(col, { idField: 'id' });
  }

  getClientesEnEspera(): Observable<PedidoConCliente[]> {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const q = query(pedidosRef, where('estado', '==', 'esperando mesa'));
    
    return collectionData(q, { idField: 'idDocumento' }).pipe(
      switchMap((pedidos: any[]) => 
        pedidos.length === 0 ? of([]) : this.obtenerClientesConInfo(pedidos)
      )
    );
  }

  private obtenerClientesConInfo(pedidos: any[]): Observable<PedidoConCliente[]> {
    return combineLatest(
      pedidos.map(pedido => 
        this.database.obtenerUsuarioPorId(pedido['idUsuario'], 'clientes')
          .then(cliente => ({
            idPedido: pedido['idPedido'],
            idDocumento: pedido['idDocumento'],
            idUsuario: pedido['idUsuario'],
            estado: pedido['estado'],
            clienteInfo: cliente,
            mesaSeleccionada: null
          } as PedidoConCliente))
      )
    );
  }

  async asignarMesa(idPedido: string, docIdMesa: string, idUsuario: string): Promise<{success: boolean, mesaNumero?: number}> {
    try {
      // 1. Obtener los datos de la mesa
      const mesaRef = doc(this.firestore, `mesas/${docIdMesa}`);
      const mesaSnap = await getDoc(mesaRef);

      if (!mesaSnap.exists()) {
        throw new Error('La mesa seleccionada no existe');
      }

      const mesaData = mesaSnap.data();
      const mesaNumero = Number(mesaData['idMesa']);

      if (isNaN(mesaNumero)) {
        throw new Error('Número de mesa inválido en la base de datos');
      }

      if (mesaData['estado'] !== 'libre') {
        throw new Error(`La mesa ${mesaNumero} no está disponible`);
      }

      // 2. Actualizar estado de la mesa
      await updateDoc(mesaRef, { estado: 'ocupado' });

      // 3. Actualizar estado del pedido
      const pedidoRef = doc(this.firestore, `pedidos/${idPedido}`);
      await updateDoc(pedidoRef, { 
        estado: 'mesa asignada',
        idMesa: mesaNumero
      });

      return { success: true, mesaNumero };
    } catch (error) {
      console.error('Error al asignar mesa:', error);
      throw error;
    }
  }
}