import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';
import { AlertController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,IonIcon } from '@ionic/angular/standalone';
import {  LoadingController,ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, hourglassOutline, statsChartOutline, logOutOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { RespuestaEncuestaModal } from '../../components/respuesta-encuesta/respuesta-encuesta.modal';
import { NotificationSenderService } from '../../services/notification-sender.service';
@Component({
  selector: 'app-lista-de-espera',
  templateUrl: './lista-de-espera.page.html',
  styleUrls: ['./lista-de-espera.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonContent, IonHeader, IonTitle, IonToolbar,IonIcon],
  providers: [ModalController]
})
export class ListaDeEsperaPage {
  constructor(
    private router: Router,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private alertCtrl: AlertController,
      private toastCtrl: ToastController,
          private loadingCtrl: LoadingController,
          private modalCtrl: ModalController,
    
    private notificationSenderService: NotificationSenderService,
  ) {
      addIcons({ arrowBackOutline, hourglassOutline, statsChartOutline, logOutOutline });

  }

    async entrarListaEspera(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Verificando tus pedidos...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        await loading.dismiss();
        await this.mostrarError('Usuario no autenticado');
        return;
      }

      const puedePedir = await this.databaseService.puedeHacerNuevoPedido(user.uid);
      
      if (!puedePedir) {
        await loading.dismiss();
        await this.mostrarToast('Usted ya tiene un pedido en orden.', 5000);
        return;
      }

      const pedidoData = {
        idPedido: await this.databaseService.generarIdSecuencial('pedidos'),
        idUsuario: user.uid,
        estado: 'esperando mesa',
        fecha: new Date().toISOString(),
        emailUsuario: user.email || '',
    
      };

      await this.databaseService.agregarLog(pedidoData, 'pedidos');
      await loading.dismiss();
      await this.mostrarToast('Ya está en lista de espera, dentro de poco se le asigna una mesa.', 5000);
      this.notificationSenderService.enviarNotificacion({
              title: 'Cliente en lista de espera',
              body: `El cliente: ${user.email} esta esperando una mesa.`,
              roles: ['maitre'],
              path: 'client-approval',
              collection: 'clientes',
            });

    } catch (error) {
      await loading.dismiss();
      await this.mostrarError('Error al procesar la solicitud');
      console.error(error);
    }
  }
    private async mostrarToast(mensaje: string, duracion: number = 3000): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      position: 'middle',
      color: 'dark',       // Cambiado a 'dark' para fondo negro
      cssClass: 'custom-toast', // Clase CSS adicional para personalización
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }



  private async mostrarError(mensaje: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: mensaje,
      buttons: ['Entendido'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  private async obtenerNombreUsuario(uid: string): Promise<string> {
    try {
      const usuario = await this.databaseService.obtenerUsuarioPorId(uid, 'usuarios');
      return usuario?.nombre || '';
    } catch {
      return '';
    }
  }

  volverAHome(): void {
    this.router.navigate(['/home']);
  }

  async verEncuesta() {
    // Abrir el modal con las encuestas encontradas
    const modal = await this.modalCtrl.create({
      component: RespuestaEncuestaModal,
      componentProps: {
      },
      cssClass: 'encuesta-modal-custom'
    });

    await modal.present();
  }
}