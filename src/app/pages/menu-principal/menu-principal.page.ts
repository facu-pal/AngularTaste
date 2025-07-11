import { Component, OnInit, OnDestroy,inject } from '@angular/core';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ModalController,ToastController } from '@ionic/angular/standalone';
import { DetallePedidoModal } from '../../components/detalle-pedido/detalle-pedido.modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  chatbubblesOutline, 
  logOutOutline,
  timeOutline,
  restaurantOutline,
  receiptOutline,
  cardOutline,
  documentTextOutline,
  gameControllerOutline
} from 'ionicons/icons';
import { ConsultaModal } from '../../components/consulta-modal/consulta-modal.modal';
import { DescripcionPedidoModal } from '../../components/descripcion-pedido-modal/descripcion-pedido-modal.modal';
import {DescripcionFinalModal} from '../../components/descripcion-final/descripcion-final.modal';
import { BarcodeScannerComponent } from '../../components/barcode-scanner/barcode-scanner.component';
import { LensFacing, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
// Ionic Components
import { 
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, 
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenu, 
    IonButton, 
} from "@ionic/angular/standalone";
import { MenuController } from '@ionic/angular';
import { NotificationSenderService } from '../../services/notification-sender.service';
@Component({
  selector: 'app-menu-principal',
  templateUrl: './menu-principal.page.html',
  styleUrls: ['./menu-principal.page.scss'],
  standalone: true,
  imports: [ CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, 
    IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenu,IonButton]
})
export class MenuPrincipalPage implements OnInit, OnDestroy {
  pedidoActual: any = null;
    private modalController: ModalController = inject(ModalController);

  
  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService,
    private router: Router,
    private modalCtrl: ModalController,
    private menuCtrl: MenuController,
    private toastCtrl: ToastController,
    private notificationSenderService: NotificationSenderService
  ) {
    addIcons({ 
      homeOutline, 
      chatbubblesOutline, 
      logOutOutline,
      timeOutline,
      restaurantOutline,
      receiptOutline,
      cardOutline,
      documentTextOutline,
      gameControllerOutline
    });
  }

  ngOnInit() {
    this.cargarPedidoActual();
    console.log(this.pedidoActual);
  }

  ngOnDestroy() {
    this.pedidoService.cancelarSuscripcion();
  }

async cargarPedidoActual() {
  // Intentar obtener usuario varias veces con retry
  let intentos = 0;
  const maxIntentos = 5;
  const delay = 500; // ms entre intentos

  const checkUser = async (): Promise<any> => {
    const usuario = this.authService.getCurrentUser();
    if (usuario || intentos >= maxIntentos) {
      return usuario;
    }
    intentos++;
    await new Promise(resolve => setTimeout(resolve, delay));
    return checkUser();
  };

  const usuario = await checkUser();
  
  if (!usuario) {
    console.error('Usuario no autenticado después de varios intentos');
    return;
  }

  console.log('Usuario obtenido:', usuario.uid);

  // Usar el método existente del servicio sin modificarlo
  this.pedidoService.suscribirAPedidos(
    ['pedido hecho', 'en preparación','cocina lista','bebida lista', 'listo para servir', 'servido','pedido servido' ,'pedir la cuenta', 'cuenta entregada', 'pagado'],
    (pedidos) => {
      // Filtrar manualmente por usuario
      const pedidosUsuario = pedidos.filter(p => p.idUsuario === usuario.uid);
      
      // Ordenar por fecha
      const pedidosOrdenados = pedidosUsuario.sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaB - fechaA;
      });

      this.pedidoActual = pedidosOrdenados[0] || null;
      
      if (!this.pedidoActual) {
        console.warn('No se encontraron pedidos para este usuario');
      }
    },
   
  );
}
  


  async verEstadoPedido() {
  const modal = await this.modalCtrl.create({
    component: DescripcionPedidoModal,
    componentProps: {
      pedido: this.pedidoActual
    },
    cssClass: 'detalle-pedido-modal'
  });
  await modal.present();
}

  async marcarComoServido() {
    try {
      await this.pedidoService.actualizarEstadoPedido(
        this.pedidoActual.id, 
        'pedido servido', 
        'Pedido marcado como servido'
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  }

  async pedirLaCuenta() {
    try {
      await this.pedidoService.actualizarEstadoPedido(
        this.pedidoActual.id, 
        'pedir la cuenta', 
        'Cuenta solicitada'
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
        this.notificationSenderService.enviarNotificacion({
              title: 'Pedir cuenta',
              body: `la mesa: ${this.pedidoActual.idMesa} ha solicitado la cuenta`,
              roles: ['mozo'],
              path: 'client-approval',
              collection: 'clientes',
            });


  }

async irAPagar() {
  // Validación básica

  try {
    


    // Mostrar el escáner QR
  const scannerModal = await this.modalController.create({
    component: BarcodeScannerComponent,
    showBackdrop: false,
    cssClass: 'barcode-scanning-modal',
    componentProps: {
      formats: [],
      lensFacing:  LensFacing.Back 
    },
  });

    await scannerModal.present();


    if (!this.pedidoActual) {
      this.mostrarError('El pedido aún no está disponible.');
      return;
    }

      const pedidoClonado = { ...this.pedidoActual };

    // Obtener resultado del escaneo
    const { data } = await scannerModal.onDidDismiss();

    if (data?.barcode?.rawValue) {
      const qrValue = data.barcode.rawValue.trim();
      console.log('QR escaneado:', qrValue);

      // Validar formato de propina
      if (qrValue.startsWith('propina_')) {
        const porcentaje = parseInt(qrValue.split('_')[1]);
        
        // Validar porcentajes permitidos
        if ([0, 5, 10, 15, 20].includes(porcentaje)) {
          // Mostrar modal de confirmación con propina
          const confirmModal = await this.modalCtrl.create({
            component: DescripcionFinalModal,
            componentProps: {
              pedido: pedidoClonado,
              porcentajePropina: porcentaje
            },
            cssClass: 'pago-confirm-modal'
          });

          await confirmModal.present();

          // Opcional: Manejar el resultado del modal de confirmación
          const { data: confirmData } = await confirmModal.onDidDismiss();
          if (confirmData?.pagoRealizado) {
            console.log('Pago confirmado con éxito');
          }
        } else {
          this.mostrarError('Porcentaje no válido. Use: 0, 5, 10, 15 o 20');
        }
      } else {
        this.mostrarError('Formato QR incorrecto. Debe ser "propina_X"');
      }
    } else {
      console.log('Escaneo cancelado');
    }
  } catch (error) {
    console.error('Error en el proceso de pago:', error);
    this.mostrarError('Error al procesar el pago');
  }
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

async irAEncuesta() {
  if (this.pedidoActual) {
    const pedidoClonado = { ...this.pedidoActual };
    this.router.navigate(['/menu-encuesta'], {
      queryParams: {
        pedido: JSON.stringify(pedidoClonado)
      }
    });
  } else {
    this.mostrarError('No hay un pedido actual para completar la encuesta');
  }
}

  jugarDescuento() {
    
    
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  async abrirConsulta() {
        await this.menuCtrl.close();
        const modal = await this.modalCtrl.create({
          component: ConsultaModal,
          cssClass: 'consulta-modal-custom'
        });
        await modal.present();
  }

  cerrarSesion() {
    this.authService.logout().then(() => {
      this.router.navigateByUrl('/login');
    });
  }
}
