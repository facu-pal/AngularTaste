import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonCardHeader, IonCardSubtitle,
         IonCard, IonCardContent, ModalController, IonCardTitle } from '@ionic/angular/standalone'; 
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonCardHeader, IonCardTitle,
         IonCard, IonCardContent, IonButton, IonCardSubtitle]
})
export class OrderDetailComponent  implements OnInit {

   @Input() pedido: any;

  constructor(private modalCtrl: ModalController) {}

  cerrar() {
    this.modalCtrl.dismiss();
  }

  ngOnInit() {}

}
