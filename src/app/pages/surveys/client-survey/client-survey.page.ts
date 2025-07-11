import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonRadio,  
         IonRange, IonRadioGroup, IonCheckbox, IonCardContent, IonCard, AlertController, 
         IonTextarea, IonRow, IonCol, IonImg, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';
import { StorageService } from 'src/app/services/storage.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-client-survey',
  templateUrl: './client-survey.page.html',
  styleUrls: ['./client-survey.page.scss'],
  standalone: true,
  imports: [IonButtons, IonBackButton, IonImg, IonCol, IonRow,  IonButton, IonCardContent, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, 
             FormsModule, IonItem, IonLabel, IonRadio , ReactiveFormsModule, IonRange, IonRadioGroup, IonCheckbox, 
             IonCard, IonCardContent, IonTextarea ]
})
export class ClientSurveyPage implements OnInit {

  foto: File | null = null;
  fotos: string[] = []; // URLs temporales para previsualización
  blobs: Blob[] = [];   // Imágenes reales para subir

  formularioEncuesta = new FormGroup({
    comida: new FormControl(5, [Validators.required]), // ion-range de 1 a 10
    atencion: new FormControl('', [Validators.required]), // ion-radio-group
    recomendacion: new FormControl(false), // ion-checkbox
    comentarios: new FormControl('') // ion-textarea
  });


  constructor(private router: Router,
              private db: DatabaseService,
              private storage: StorageService,
              private alertController: AlertController,
              private route: ActivatedRoute,
              ) { }

idPedido: string = '';

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    if (params['idPedido']) {
      this.idPedido = params['idPedido'];
    }
  });
  console.log('ID del pedido:', this.idPedido);
}

  async sendSurvey() {
    if (this.formularioEncuesta.invalid) {
    await this.showAlert('Formulario incompleto', 'Por favor, completá todos los campos obligatorios.');
    return;
    }

    if (this.fotos.length === 0) {
      await this.showAlert('Faltan fotos', 'Por favor, agregá al menos una foto antes de enviar.');
      return;
    }

    const datos = this.formularioEncuesta.value;

    const { comida, atencion, recomendacion, comentarios } = this.formularioEncuesta.value;

    if (typeof comida === 'number' && typeof atencion === 'string' &&
        typeof recomendacion === 'boolean' && typeof comentarios === 'string') {
         
        const uploadedUrls = await Promise.all(
          this.blobs.map((blob) => this.storage.uploadImage(blob))
        );

        const imagenesURL = uploadedUrls.filter((url): url is string => url !== null);

        const datosEncuesta = {
          id: '', // Se generará automáticamente
          idPedido: this.idPedido, 
          comida,
          atencion,
          recomendacion,
          comentarios,
          imagenes: imagenesURL
        };

        await this.db.agregarEncuesta(datosEncuesta,'encuestas');
        console.log('Datos enviados:', datos);
        console.log('Foto:', this.foto?.name);
        
        //limpiar
        this.fotos = [];
        this.blobs = [];
        this.formularioEncuesta.reset({ comida: 1, recomendacion: false });
        await this.showAlert('Envio exitoso', 'Encuesta enviada con éxito.');
        this.router.navigate(['menu-principal']);
    }
    
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: 'custom-alert', 
      buttons: ['Aceptar']
    });
    await alert.present();
  }

 async tomarFotos() {
    while (this.fotos.length < 3) {
      const imagen = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.fotos.push(imagen.dataUrl!);
      const blob = await (await fetch(imagen.dataUrl!)).blob();
      this.blobs.push(blob);

      const seguir = await this.preguntarSeguir();
      if (!seguir) break;
    }

    if (this.fotos.length === 3) {
      await this.showAlert('Límite alcanzado', 'Ya cargaste 3 fotos.');
    }
  }

  async preguntarSeguir(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: '¿Querés sacar otra foto?',
        message: `(${this.fotos.length} / 3)`,
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Sí',
            handler: () => resolve(true)
          }
        ]
      });

      await alert.present();
    });
  }


}
