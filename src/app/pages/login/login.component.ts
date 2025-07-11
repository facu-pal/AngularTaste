import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import {
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
  LoadingController,
  IonButton,
  IonIcon,
  AlertController,
  Platform,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

import { addIcons } from 'ionicons';
import { heart, accessibility } from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    FormsModule,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSegmentContent,
    IonSegmentView,
    IonButton,
    
  ],
})
export class LoginComponent implements OnInit {
  user: string = '';
  password: string = '';
  clientsList: any[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertController: AlertController,
    private databaseService: DatabaseService,
    private pushNotificationService: PushNotificationService,
    //private notificationService: NotificationService, //notificacione para web
    private platform: Platform,
  ) {
    addIcons({ heart, accessibility });
  }

  ngOnInit() {
    this.databaseService.traerColeccion('clientes').subscribe((response) => {
      this.clientsList = response;
    });
  }

  async login() {
    if (this.user === '' || this.password === '') {
      await this.showAlert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    // Buscar el usuario en la lista local de clientes
    const cliente = this.clientsList.find((c) => c.email === this.user);
    console.log('Cliente encontrado:', cliente);

    switch (cliente?.estado) {
      case 'pendiente':
        this.showAlert(
          'Cuenta pendiente',
          'Tu cuenta está pendiente de aprobación. Por favor, espera a que sea aprobada.'
        );
          this.user = '';
          this.password = '';
        return;
      case 'rechazado':
        this.showAlert(
          'Cuenta rechazada',
          'Tu cuenta está rechazada de aprobación.'
        );
            this.user = '';
            this.password = '';
        return;
      case 'aceptado':
        break; // Continuar con el login
      default:
        this.showAlert('Error', 'Usuario no encontrado o estado desconocido.');
            this.user = '';
            this.password = '';
        return;
    }

    try {
      // Login con Firebase Auth
      const userCredential = await this.auth.login(this.user, this.password);
      const user = userCredential.user;

      if (user) {
        // Inicializar push notifications
        await this.pushNotificationService.initPush();

        // Obtener token actual
      //const token = this.notificationService.push_token;
      const tokenMobile = this.pushNotificationService.push_token;

        console.log('Token de notificación:', tokenMobile);
        if (tokenMobile) {
          cliente.push_token = tokenMobile;
          this.auth.user = cliente;
          await this.databaseService.modificarUsuario(cliente, 'clientes');

          this.showLoading().then(() => {
            this.user = '';
            this.password = '';
            this.router.navigate(['home']);
          });
        }
      }
    } catch (error) {
      this.showAlert('Login fallido', 'Verificá tu email y contraseña.');
      console.error('❌ Error en login:', error);
    }
  }

  async register() {
    this.router.navigate(['high-client']);
  }

  autoCompleteLogin(mail: string, password: string) {
    this.user = mail;
    this.password = password;
  }

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Ingresando...',
      duration: 2000,
    });

    loading.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: 'custom-alert',
      buttons: ['Aceptar'],
    });
    await alert.present();
  }
}
