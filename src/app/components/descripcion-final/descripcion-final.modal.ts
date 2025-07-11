import { Component, Input ,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonList, IonItem, IonLabel, IonText, ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-descripcion-final',
  templateUrl: './descripcion-final.modal.html',
  styleUrls: ['./descripcion-final.modal.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonIcon, IonContent, IonList, IonItem, IonLabel, IonText,
    CommonModule
  ]
})
export class DescripcionFinalModal implements OnInit {
  @Input() pedido: any;
  @Input() porcentajePropina: number = 0;
  precioFinal: number = 0;
  propinaCalculada: number = 0;
  isLoading: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private pedidoService: PedidoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ closeOutline });
  }

    ngOnInit() {
    this.validarDatosPedido();
    this.calcularPrecioFinal();
  }
private validarDatosPedido() {
    if (!this.pedido) {
      console.error('Error: Pedido no definido');
      this.mostrarError('Pedido no válido');
      this.modalCtrl.dismiss();
      return;
    }

    if (typeof this.pedido.precioTotal === 'undefined') {
      console.error('Error: precioTotal no definido en el pedido');
      console.log('Estructura del pedido recibido:', this.pedido);
      this.mostrarError('Datos del pedido incompletos');
      this.modalCtrl.dismiss();
    }
  }

  private calcularPrecioFinal() {
    try {
      if (!this.pedido || typeof this.pedido.precioTotal !== 'number') {
        throw new Error('Datos del pedido inválidos');
      }

      this.propinaCalculada = (this.pedido.precioTotal * this.porcentajePropina) / 100;
      this.precioFinal = this.pedido.precioTotal + this.propinaCalculada;

      console.log('Cálculos realizados:', {
        subtotal: this.pedido.precioTotal,
        porcentajePropina: this.porcentajePropina,
        propina: this.propinaCalculada,
        total: this.precioFinal
      });
    } catch (error) {
      console.error('Error en cálculo:', error);
      this.precioFinal = 0;
      this.propinaCalculada = 0;
    }
  }

  getMensajePropina(): string {
    switch(this.porcentajePropina) {
      case 20: return 'Excelente!';
      case 15: return 'Muy bueno!';
      case 10: return 'Bueno';
      case 5: return 'Regular';
      case 0: return 'Mala';
      default: return '';
    }
  }

  getClaseEvaluacion(): string {
    switch(this.porcentajePropina) {
      case 20: return 'excelente';
      case 15: return 'muy-bueno';
      case 10: return 'bueno';
      case 5: return 'regular';
      case 0: return 'mala';
      default: return '';
    }
  }

  async pagar() {
    try {
      // Actualizamos el pedido con la propina y precio final
      const pedidoActualizado = {
        ...this.pedido,
        porcentajePropina: this.porcentajePropina,
        precioFinal: this.precioFinal,
        estado: 'pagado'
      };

      await this.pedidoService.actualizarPedidoCompleto(
        this.pedido.id, 
        pedidoActualizado
      );
      
      const toast = await this.toastCtrl.create({
        message: 'Pago realizado con éxito',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
      await this.modalCtrl.dismiss();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al realizar el pago:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al procesar el pago',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

    private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}