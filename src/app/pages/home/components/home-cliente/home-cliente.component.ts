import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule  } from '@ionic/angular';
import { ToastController,ModalController,Platform }  from '@ionic/angular/standalone';
import { AuthService } from '../../../../services/auth.service';
import { addIcons } from 'ionicons';
import { qrCode, exitOutline } from 'ionicons/icons';
import { DatabaseService } from '../../../../services/database.service';
import { BarcodeScannerComponent } from '../../../../components/barcode-scanner/barcode-scanner.component';
import { LensFacing, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { PedidoService } from '../../../../services/pedido.service';

@Component({
  selector: 'app-home-cliente',
  templateUrl: './home-cliente.component.html',
  styleUrls: ['./home-cliente.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class HomeClienteComponent implements OnInit {
  private modalController: ModalController = inject(ModalController);
  private pedidoActual: any = null;

  constructor(
              private router: Router, 
              private auth: AuthService,
              private toastController: ToastController,
              private db: DatabaseService,
              private platform: Platform,
              private pedidoService: PedidoService

            ) {
    addIcons({ qrCode, exitOutline });
   }

  ngOnInit() {
        if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
        this.suscribirAPedidoUsuario();

  }

    private suscribirAPedidoUsuario() {
    const usuario = this.auth.getCurrentUser();
    if (!usuario) return;

    this.pedidoService.suscribirAPedidosPorUsuario(
      usuario.uid,
      ['esperando mesa', 'mesa asignada', 'pedido hecho','cocina lista','bebida lista', 'en preparación', 'listo para servir', 'servido', 'pedido servido', 'pedir la cuenta', 'cuenta entregada', 'pagado'],
      (pedidos) => {
        if (pedidos && pedidos.length > 0) {
          this.pedidoActual = pedidos[0]; // Asumimos que el cliente solo tiene un pedido activo
        } else {
          this.pedidoActual = null;
        }
      },
      (error) => {
        console.error('Error al obtener pedido:', error);
      }
    );
  }

async escanearQR() {
  // Mostrar mensaje inicial

  console.log('Toast de escaneo QR presentado');
  // Abrir modal de escaneo QR
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
    const { data } = await scannerModal.onDidDismiss();

    if (data?.barcode?.rawValue) {
      const qrValue: string = data.barcode.rawValue.trim();
      console.log('Valor del QR escaneado:', qrValue);

      // Manejar QR de lista de espera
      if (qrValue === 'lista_de_espera') {
        this.router.navigate(['/lista-de-espera']);
        return;
      }

      // Manejar QR de mesas (mesa_1, mesa_2, etc.)
      if (qrValue.startsWith('mesa_')) {
        await this.manejarQRMesa(qrValue);
        return;
      }

      // QR no reconocido
      const invalidToast = await this.toastController.create({
        message: 'QR no reconocido',
        duration: 2000,
        position: 'bottom'
      });
      await invalidToast.present();
    } else {
      const noResultToast = await this.toastController.create({
        message: 'No se escaneó ningún QR',
        duration: 2000,
        position: 'bottom'
      });
      await noResultToast.present();
    }
  }

  private async manejarQRMesa(qrValue: string) {
  const numeroMesa = parseInt(qrValue.split('_')[1]);

  if (!this.pedidoActual) {
    const toast = await this.toastController.create({
      message: 'No tiene un pedido asignado',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
    return;
  }

  
    console.log('Pedido actual:', this.pedidoActual.estado);
    const estado = await this.pedidoService.obtenerEstadoPedido(this.pedidoActual.id);
    console.log('Estado del pedido:', estado);
  
  
  if ( 'pagado'== estado ||'pago confirmado' == estado) {
    const toast = await this.toastController.create({
      message: 'Su pedido ya fue finalizado. No puede volver a la mesa.',
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
    return;
  }

  if (!this.pedidoActual.idMesa) {
    const toast = await this.toastController.create({
      message: 'Aún no tiene mesa asignada',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
    return;
  }

  if (this.pedidoActual.idMesa !== numeroMesa) {
    const toast = await this.toastController.create({
      message: 'Esta no es su mesa asignada',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
    return;
  }

  if (this.pedidoActual.estado === 'mesa asignada') {
    this.router.navigate(['/menu']);
  } else {
    this.router.navigate(['/menu-principal']);
  }
  }










































  async cerrarSesion() {
    this.auth.logout()
    let user = this.auth.user
    user.push_token = '';
    this.router.navigateByUrl('/login');
    await this.db.modificarUsuario(user, 'clientes');
  }


}