import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { closeOutline, cartOutline } from 'ionicons/icons';

// Ionic Components
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
  IonLabel, IonButton, IonButtons, IonIcon, IonText,  
  IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-detalle-pedido',
  templateUrl: './detalle-pedido.modal.html',
  styleUrls: ['./detalle-pedido.modal.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonButtons, IonIcon, IonText, 
    IonSpinner
  ]
})
export class DetallePedidoModal {
  @Input() carrito: any[] = [];
  @Input() idPedido: string = '';
  tiempoEstimado: number = 0;
  precioTotal: number = 0;
  cargando: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private pedidoService: PedidoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ closeOutline, cartOutline });
  }

  ionViewWillEnter() {
    this.calcularTotales();
  }

  calcularTotales() {
    this.precioTotal = this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    this.tiempoEstimado = Math.max(...this.carrito.map(item => item.tiempo), 0);
  }

  async ordenarPedido() {
    this.cargando = true;
    try {
      const pedidoData = {
        productos: this.carrito,
        precioTotal: this.precioTotal,
        tiempoEstimado: this.tiempoEstimado
      };

      this.idPedido = await this.pedidoService.crearPedido(pedidoData);
      
      const toast = await this.toastCtrl.create({
        message: `Pedido realizado con éxito`,
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      this.modalCtrl.dismiss({ ordenRealizada: true });
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al ordenar pedido:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al realizar el pedido',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.cargando = false;
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}