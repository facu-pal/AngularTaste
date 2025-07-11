import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonMenuButton, 
  IonMenu, IonLabel, IonCard, IonCardContent, IonButtons, IonBackButton,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonItem, IonList, IonIcon,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { chatbubblesOutline , logOutOutline, informationCircleOutline,receiptOutline  } from 'ionicons/icons';
import { ConsultaModal } from '../../../../components/consulta-modal/consulta-modal.modal';
import { ModalController } from '@ionic/angular/standalone';
import { PedidoService } from '../../../../services/pedido.service';
import { DescripcionPedidoModal } from '../../../../components/descripcion-pedido-modal/descripcion-pedido-modal.modal';
import { DatabaseService } from 'src/app/services/database.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';

@Component({
  selector: 'app-home-mozo',
  templateUrl: './home-mozo.component.html',
  styleUrls: ['./home-mozo.component.scss'],
  standalone: true,
  imports: [
     IonButtons, IonCardContent, IonCard, IonMenuButton, 
    IonMenu, IonLabel, IonContent, IonHeader, IonTitle, IonToolbar, 
    CommonModule, FormsModule, IonButton, IonCardHeader, IonCardTitle,
     IonItem, IonList, IonIcon
  ]
})
export class HomeMozoComponent implements OnInit, OnDestroy {
  pedidos: any[] = [];
  estadosPermitidos = ['pedido hecho','en preparación','cocina lista','bebida lista', 'listo para servir', 'pedir la cuenta', 'pagado'];

  constructor(
    private router: Router, 
    private auth: AuthService,
    private modalCtrl: ModalController,
    private pedidoService: PedidoService,
    private db: DatabaseService,
    private notificationSenderService: NotificationSenderService,
  ) {
    addIcons({ chatbubblesOutline, logOutOutline, informationCircleOutline,receiptOutline  });
  }

  async ngOnInit() {
    this.suscribirAPedidos();
  }

    ngOnDestroy(): void {
    this.pedidoService.cancelarSuscripcion();
  }

 private suscribirAPedidos(): void {
    this.pedidoService.suscribirAPedidos(this.estadosPermitidos, (pedidos) => {
      this.pedidos = pedidos.sort((a, b) => 
        (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0)
      );
    });
  }

  navigateTo(path: string) {
    this.router.navigate([`/${path}`]);
  }

  async closeSession() {
    this.auth.logout()
    let user = this.auth.user
    user.push_token = '';
    this.router.navigateByUrl('/login');
    await this.db.modificarUsuario(user, 'clientes');
  }

  async abrirConsulta() {
    const modal = await this.modalCtrl.create({
      component: ConsultaModal,
      showBackdrop: true,
      backdropDismiss: true,
      cssClass: 'consulta-modal-custom',
      
    });
    await modal.present();
  }

async verInfo(pedido: any) {
  const modal = await this.modalCtrl.create({
    component: DescripcionPedidoModal,
    componentProps: {
      pedido: pedido
    },
    cssClass: 'detalle-pedido-modal'
  });
  await modal.present();
}

  getBotonTexto(estado: string): string {
    const textos: {[key: string]: string} = {
      'pedido hecho': 'Empezar preparación',
      'listo para servir': 'Marcar como servido',
      'pedir la cuenta': 'Entregar cuenta',
      'pagado': 'Confirmar pago'
    };
    return textos[estado] || 'Cambiar estado';
  }

  getNuevoEstado(estadoActual: string): {estado: string, mensaje: string} {
    const estados: {[key: string]: {estado: string, mensaje: string}} = {
      'pedido hecho': { estado: 'en preparación', mensaje: 'Preparación iniciada' },
      'listo para servir': { estado: 'servido', mensaje: 'Pedido servido' },
      'pedir la cuenta': { estado: 'cuenta entregada', mensaje: 'Cuenta entregada' },
      'pagado': { estado: 'pago confirmado', mensaje: 'Pago confirmado' }
    };
    return estados[estadoActual] || { estado: estadoActual, mensaje: 'Estado actualizado' };
  }

  async cambiarEstado(pedido: any) {
    const { estado: nuevoEstado, mensaje } = this.getNuevoEstado(pedido.estado);
    await this.pedidoService.actualizarEstadoPedido(pedido.id, nuevoEstado, mensaje);
    
    // Enviar notificación si es necesario si el estado cambia a en preparcion al cocinero y bartender
    if (nuevoEstado === 'en preparación') {
       this.notificationSenderService.enviarNotificacion({
              title: 'Nueva orden',
              body: `Nuevo pedido para preparar: ${pedido.idPedido}`,
              roles: ['cocinero', 'bartender'],
              path: 'home',
              collection: 'clientes',
            });
  }

  //agregar aca para cambiar el estado de la mesa a disponible si el pedido es pago confirmado
  if (nuevoEstado === 'pago confirmado') {
     await this.pedidoService.liberarMesa(pedido.idMesa);
    }

}
}