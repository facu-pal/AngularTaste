import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  query,
  where,
  getDocs,
  addDoc,
  runTransaction,
} from '@angular/fire/firestore';
import { collection as colRef, DocumentData } from 'firebase/firestore';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private firestore: Firestore) {}

  async agregarUsuario(user: any, coleccion: string) {
    try {
      const userRef = doc(this.firestore, `${coleccion}/${user.id}`);
      await setDoc(userRef, { ...user });

      console.log('Usuario agregado exitosamente con ID:', user.id);
    } catch (error) {
      console.error('Error al agregar el usuario:', error);
    }
  }

  async agregarProducto(producto: any, coleccion: string) {
    try {
      const col = collection(this.firestore, coleccion);
      const docRef = await addDoc(col, producto);

      console.log('Producto agregado exitosamente con ID:', docRef.id);
    } catch (error) {
      console.error('Error al agregar el producto:', error);
    }
  }

  async agregarLog(log: any, coleccion: string) {
    try {
      const col = collection(this.firestore, coleccion);
      const docRef = await addDoc(col, log);
      console.log('Log agregado exitosamente con ID:', docRef.id);
    } catch (error) {
      console.error('Error al agregar el log:', error);
    }
  }

  async agregarEncuesta(producto: any, coleccion: string) {
  try {
    const col = collection(this.firestore, coleccion);
    const docRef = await addDoc(col, producto);

    // 🔐 Guardamos el ID dentro del documento
    await setDoc(doc(this.firestore, coleccion, docRef.id), {
      ...producto,
      id: docRef.id
    });

    console.log('Producto agregado exitosamente con ID:', docRef.id);
  } catch (error) {
    console.error('Error al agregar el producto:', error);
  }
}

  traerColeccion(nombreColeccion: string) {
    const col = collection(this.firestore, nombreColeccion);
    return collectionData(col, { idField: 'id' });
  }

  async modificarUsuario(usuario: any, coleccion: string) {
    try {
      const docRef = doc(this.firestore, `${coleccion}/${usuario.id}`);
      await updateDoc(docRef, { ...usuario });
    } catch (error) {
      console.error('Error al modificar usuario:', error);
    }
  }

  async eliminar(usuario: any, coleccion: string) {
    try {
      const docRef = doc(this.firestore, `${coleccion}/${usuario.id}`);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  }

  async obtenerUsuarioPorId(uid: string, coleccion: string): Promise<any> {
    try {
      const col = collection(this.firestore, coleccion);
      const q = query(col, where('id', '==', uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        console.log('Usuario encontrado:', data['nombre']);
        return data;
      } else {
        console.log('No se encontró el usuario con el UID proporcionado.');
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo el usuario:', error);
      return null;
    }
  }

  //metodos para pedidos
  //generar id para pedidos
  async generarIdSecuencial(
    coleccion: string,
    prefijo: string = 'p'
  ): Promise<string> {
    const counterRef = doc(this.firestore, 'counters', coleccion);

    try {
      return await runTransaction(this.firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nuevoNumero = 1;

        if (counterDoc.exists()) {
          nuevoNumero = counterDoc.data()['ultimoNumero'] + 1;
        }

        // Actualiza el contador
        transaction.set(counterRef, { ultimoNumero: nuevoNumero });

        // Formatea el número con ceros a la izquierda
        const numeroFormateado = nuevoNumero.toString().padStart(4, '0');
        return `${prefijo}${numeroFormateado}`;
      });
    } catch (error) {
      console.error('Error generando ID secuencial:', error);
      throw error;
    }
  }

  //se fija si tiene algun pedido activo ese usuario
  async puedeHacerNuevoPedido(uid: string): Promise<boolean> {
     try {
    // 1. Traer TODOS los pedidos del usuario
       const col = collection(this.firestore, 'pedidos');
        const q = query(col, where('idUsuario', '==', uid));
       const snapshot = await getDocs(q);

        // 2. Si no tiene pedidos, puede hacer uno nuevo
       if (snapshot.empty) return true;

       // 3. Verificar que TODOS estén en 'pago confirmado'
       const todosConfirmados = snapshot.docs.every(doc => 
         doc.data()['estado'] === 'pago confirmado'
        );

       return todosConfirmados;
     } catch (error) {
       console.error('Error verificando pedidos:', error);
         throw error;
      }
    }




    async obtenerEncuestasPorPedido(idPedido: string): Promise<any[]> {
  try {
    const snapshot = await getDocs(
      query(collection(this.firestore, 'encuestas'), 
      where('idPedido', '==', idPedido)
    ));
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error al obtener encuestas:', error);
    return [];
  }
}
}
