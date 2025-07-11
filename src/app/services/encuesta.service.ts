import { Injectable } from '@angular/core';
import { collection, getDocs, Firestore } from '@angular/fire/firestore';
import { from, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncuestaService {

  constructor(private firestore: Firestore) { }

  /**
   * Obtiene todas las encuestas sin ordenar por fecha
   */
  obtenerTodasEncuestas(): Observable<any[]> {
    const encuestasRef = collection(this.firestore, 'encuestas');
    return from(getDocs(encuestasRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))
    );
  }

  /**
   * Procesa datos para el gráfico de calidad de comida
   */
  procesarDatosComida(encuestas: any[]): number[] {
    return encuestas.map(e => e.comida);
  }

  /**
   * Procesa datos para el gráfico de atención
   */
  procesarDatosAtencion(encuestas: any[]): {[key: string]: number} {
    const conteo: {[key: string]: number} = {
      'muy mala': 0,
      'mala': 0,
      'buena': 0,
      'excelente': 0
    };

    encuestas.forEach(e => {
      if (conteo.hasOwnProperty(e.atencion)) {
        conteo[e.atencion]++;
      }
    });

    return conteo;
  }

  /**
   * Procesa datos para el gráfico de recomendación
   */
  procesarDatosRecomendacion(encuestas: any[]): [number, number] {
    const recomendaron = encuestas.filter(e => e.recomendacion).length;
    return [recomendaron, encuestas.length - recomendaron];
  }
}