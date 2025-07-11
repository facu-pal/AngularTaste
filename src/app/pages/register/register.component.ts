import { Component, OnInit } from '@angular/core';
import { LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { IonButton, ModalController } from '@ionic/angular/standalone';
import { BarcodeScannerComponent } from 'src/app/components/barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [IonButton],
})
export class RegisterComponent implements OnInit {
  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  async startScan() {
    const modal = await this.modalController.create({
      component: BarcodeScannerComponent,
      showBackdrop: false,
      cssClass: 'barcode-scanning-modal',
      componentProps: { formats: [], lensFacing: LensFacing.Back },
    });
    await modal.present();

    const barcode = await modal.onDidDismiss();
    console.log(barcode);
  }
}
