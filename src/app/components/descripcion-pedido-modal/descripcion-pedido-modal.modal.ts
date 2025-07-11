import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonList, IonItem, IonLabel, IonText, IonBadge } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
@Component({
  selector: 'app-descripcion-pedido-modal',
  templateUrl: './descripcion-pedido-modal.modal.html',
  styleUrls: ['./descripcion-pedido-modal.modal.scss'],
  imports: [IonBadge, 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonIcon, IonContent, IonList, IonItem, IonLabel, IonText,
    CommonModule
  ]
})
export class DescripcionPedidoModal {
 @Input() pedido: any;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeOutline });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  getEstadoProductoColor(estado: string): string {
    const colores: {[key: string]: string} = {
      'pendiente': 'warning',
      'preparado': 'success',
      'en preparación': 'primary',
      'entregado': 'tertiary'
    };
    return colores[estado] || 'medium';
  }
}