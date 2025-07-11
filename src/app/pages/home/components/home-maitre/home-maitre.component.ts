import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, AlertController } from '@ionic/angular';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { menuOutline, logOutOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { MaitreService } from 'src/app/services/maitre.service';
import { Subscription } from 'rxjs';
import { DatabaseService } from 'src/app/services/database.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';

interface ClienteEnEspera {
  idPedido: string;
  idDocumento: string;
  idUsuario: string;
  estado: string;
  clienteInfo: {
    nombre: string;
    apellido: string;
  };
  mesaSeleccionada: string | null;
}

@Component({
  selector: 'app-home-maitre',
  templateUrl: './home-maitre.component.html',
  styleUrls: ['./home-maitre.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomeMaitreComponent implements OnInit, OnDestroy {
  listaEspera: ClienteEnEspera[] = [];
  mesasDisponibles: any[] = [];
  
  private mesasSub!: Subscription;
  private clientesSub!: Subscription;

  constructor(
    private menuCtrl: MenuController,
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private maitreService: MaitreService,
    private db: DatabaseService,
    private notificationSender: NotificationSenderService,
    private alertCtrl: AlertController
  ) {
    addIcons({ menuOutline, logOutOutline });
  }

  ngOnInit() {
    this.cargarDatos();
    console.log(this.mesasDisponibles);

    this.maitreService.traerColeccion('mesas').subscribe((response) => {
      this.mesasDisponibles = response;
      console.log(this.mesasDisponibles);
    });
  }

  cargarDatos() {
    this.clientesSub = this.maitreService.getClientesEnEspera().subscribe({
      next: (clientes) => {
        this.listaEspera = clientes;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.mostrarError('Error al cargar lista de espera');
      }
    });
  }

  getNumeroMesa(docId: string): number {
    const mesa = this.mesasDisponibles.find(m => m.id === docId);
    return mesa ? mesa.idMesa : 0;
  }

  async mostrarSelectorMesas(cliente: ClienteEnEspera) {
    if (this.mesasDisponibles.length === 0) {
      await this.mostrarError('No hay mesas disponibles');
      return;
    }

    const mesasLibres = this.mesasDisponibles.filter(m => m.estado === 'libre');
    
    if (mesasLibres.length === 0) {
      await this.mostrarError('No hay mesas libres en este momento');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Seleccionar mesa',
      inputs: mesasLibres.map(mesa => ({
        name: 'mesa',
        type: 'radio',
        label: `Mesa ${mesa.idMesa}`,
        value: mesa.id,
        checked: cliente.mesaSeleccionada === mesa.id
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: (selectedId) => {
            if (selectedId) {
              cliente.mesaSeleccionada = selectedId;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async asignarMesa(cliente: ClienteEnEspera) {
    if (!cliente.mesaSeleccionada) {
      await this.mostrarError('Seleccione una mesa primero');
      return;
    }

    try {
      const resultado = await this.maitreService.asignarMesa(
        cliente.idDocumento,
        cliente.mesaSeleccionada,
        cliente.idUsuario
      );

      if (resultado.success) {
        await this.mostrarExito(`Mesa ${resultado.mesaNumero} asignada a ${cliente.clienteInfo.nombre} ${cliente.clienteInfo.apellido} numero de pedido ${cliente.idPedido}`);
        this.notificationSender.enviarNotificacion({
              title: 'Mesa asignada',
              body: `Su mesa es la numero: ${resultado.mesaNumero}, ya se puede ir a sentar`,
              roles: ['cliente'], 
              path: 'home',
              collection: 'clientes'
            });
        this.listaEspera = this.listaEspera.filter(c => c.idDocumento !== cliente.idDocumento);
      }
    } catch (error: any) {
      await this.mostrarError(error.message || 'Error al asignar la mesa');
    }
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'middle',
      color: 'danger'
    });
    await toast.present();
  }

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'middle',
      color: 'success'
    });
    await toast.present();
  }

  async cerrarSesion() {
    this.menuCtrl.close();
    this.auth.logout()
    let user = this.auth.user
    user.push_token = '';
    this.router.navigateByUrl('/login');
    await this.db.modificarUsuario(user, 'clientes');
  }

  ngOnDestroy() {
    this.mesasSub?.unsubscribe();
    this.clientesSub?.unsubscribe();
  }
}