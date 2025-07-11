import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  AlertController,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  Platform,
  ModalController,
  IonCheckbox,
  IonLabel
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { StorageService } from 'src/app/services/storage.service';
import { Client } from 'src/app/classes/client';
import { BarcodeScannerComponent } from 'src/app/components/barcode-scanner/barcode-scanner.component';
import { LensFacing, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { DniData, ScannerService } from 'src/app/services/scanner.service';

@Component({
  selector: 'app-high-client',
  templateUrl: './high-client.page.html',
  styleUrls: ['./high-client.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonIcon,
    IonCheckbox,
    IonLabel,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class HighClientPage implements OnInit {
  selectedFile: File | null = null;

  formularioAlta = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', []),
    dni: new FormControl('', []),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    esAnonimo: new FormControl(false),
    push_token: new FormControl('')
  });

  private modalController: ModalController = inject(ModalController);

  qrCode: string = '';
  parsedDniData: DniData | null = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    private db: DatabaseService,
    private storage: StorageService,
    private alertController: AlertController,
    private platform: Platform,
    private notificationSenderService: NotificationSenderService,
    private scannerService: ScannerService
  ) {}

  ngOnInit() {
    if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
  }

  async handleRegister() {
    if (this.formularioAlta.valid && this.selectedFile) {
      const { nombre, email, password, esAnonimo } = this.formularioAlta.value;

      if (
        typeof nombre === 'string' &&
        typeof email === 'string' &&
        typeof password === 'string' &&
        typeof esAnonimo === 'boolean'
      ) {
        try {
          const url = await this.storage.uploadImage(this.selectedFile);
          const userCredential = await this.auth.register(email, password);
          const userId = userCredential.user?.uid;

          if (userId && url) {
            const client: Client = new Client(
              userId,
              nombre,
              esAnonimo ? '' : (this.formularioAlta.get('apellido')?.value || ''),
              esAnonimo ? '' : (this.formularioAlta.get('dni')?.value || ''),
              email,
              url,
              esAnonimo ? 'aceptado' : 'pendiente',
              'cliente', // Rol fijo como 'cliente'
              '',
              esAnonimo
            );

            await this.db.agregarUsuario(client, 'clientes');
            
            if (!esAnonimo) {
              this.notificationSenderService.enviarNotificacion({
                title: 'Nuevo Cliente Registrado',
                body: `Se ha registrado el cliente: ${nombre} ${this.formularioAlta.get('apellido')?.value}`,
                roles: ['dueño', 'supervisor'],
                path: 'client-approval',
                collection: 'clientes',
              });
            }
          }

          this.setForm();
          await this.showAlert(
            'Registro exitoso',
            esAnonimo 
              ? 'Registro anónimo completado correctamente.'
              : 'El cliente ha sido registrado correctamente.'
          );

          this.router.navigate(['/login']);
        } catch (error) {
          await this.showAlert(
            'Error',
            'Error al registrarse. Por favor, intenta de nuevo.'
          );
        }
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  toggleAnonimo() {
    const esAnonimo = this.formularioAlta.get('esAnonimo')?.value;
    
    if (esAnonimo) {
      this.formularioAlta.get('apellido')?.setValue('');
      this.formularioAlta.get('dni')?.setValue('');
    }
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

  private setForm() {
    this.formularioAlta.get('nombre')?.setValue('');
    this.formularioAlta.get('apellido')?.setValue('');
    this.formularioAlta.get('email')?.setValue('');
    this.formularioAlta.get('dni')?.setValue('');
    this.formularioAlta.get('password')?.setValue('');
    this.formularioAlta.get('esAnonimo')?.setValue(false);
    this.selectedFile = null;
  }

  async escanearQR() {
    const modal = await this.modalController.create({
      component: BarcodeScannerComponent,
      showBackdrop: false,
      cssClass: 'barcode-scanning-modal',
      componentProps: { formats: [], lensFacing: LensFacing.Back },
    });
    await modal.present();

    const barcode = await modal.onDidDismiss();
    this.qrCode = barcode?.data?.barcode?.displayValue;
    this.onScanQrCode();
  }

  onScanQrCode() {
    const qrString = this.qrCode;
    this.parsedDniData = this.scannerService.parseDniQrCode(qrString);

    if (this.parsedDniData) {
      this.formularioAlta.patchValue({
        nombre: this.parsedDniData.nombre,
        apellido: this.parsedDniData.apellido,
        dni: this.parsedDniData.numeroDeDni,
      });
    } else {
      this.formularioAlta.patchValue({
        nombre: '',
        apellido: '',
        dni: '',
      });
    }
  }
}