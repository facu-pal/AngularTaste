import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../../services/pedido.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  chatbubblesOutline, 
  logOutOutline,
  documentTextOutline,
  eyeOutline
} from 'ionicons/icons';
// Ionic Components
import { 
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, 
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenu, 
  IonButton 
} from "@ionic/angular/standalone";
import { MenuController } from '@ionic/angular';
import { ConsultaModal } from '../../../components/consulta-modal/consulta-modal.modal';

import { DatabaseService } from '../../../services/database.service';
import { RespuestaEncuestaModal } from '../../../components/respuesta-encuesta/respuesta-encuesta.modal';

@Component({
  selector: 'app-menu-encuesta',
  templateUrl: './menu-encuesta.page.html',
  styleUrls: ['./menu-encuesta.page.scss'],
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, 
    IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenu, IonButton]
})
export class MenuEncuestaPage implements OnInit {
  pedidoActual: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuCtrl: MenuController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private db: DatabaseService
  ) {
    addIcons({ 
      homeOutline, 
      chatbubblesOutline, 
      logOutOutline,
      documentTextOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['pedido']) {
        this.pedidoActual = JSON.parse(params['pedido']);
        console.log('Pedido recibido:', this.pedidoActual);
      } else {
        console.warn('No se recibió ningún pedido');
        this.pedidoActual = null;
      }
    });
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

  async completarEncuesta() {
    if (!this.pedidoActual || !this.pedidoActual.idPedido) {
      const toast = await this.toastCtrl.create({
        message: 'No hay un pedido seleccionado',
        duration: 2000,
        position: 'middle'
      });
      await toast.present();
      return;
    }

    // Verificar si ya existe una encuesta para este pedido
    const encuestas = await this.db.obtenerEncuestasPorPedido(this.pedidoActual.idPedido);
    
    if (encuestas && encuestas.length > 0) {
      // Mostrar toast si ya existe una encuesta
      const toast = await this.toastCtrl.create({
        message: 'Ya respondiste esta encuesta',
        duration: 2000,
        position: 'middle'
      });
      await toast.present();
    } else {
      // Navegar a la página de encuesta con el idPedido
      this.router.navigate(['/client-survey'], {
        queryParams: { idPedido: this.pedidoActual.idPedido }
      });
    }
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