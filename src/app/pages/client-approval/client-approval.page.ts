import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, 
         IonCardContent, IonButton, IonButtons, IonBackButton, IonMenuButton , IonMenu} from '@ionic/angular/standalone';
import { DatabaseService } from 'src/app/services/database.service';
import { EmailService } from 'src/app/services/email.service';


@Component({
  selector: 'app-client-approval',
  templateUrl: './client-approval.page.html',
  styleUrls: ['./client-approval.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButtons, IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonCard, IonContent, IonHeader, 
            IonTitle, IonToolbar, CommonModule, FormsModule, IonBackButton, IonMenuButton, IonMenu]
})
export class ClientApprovalPage implements OnInit {

  clientsList: any[] = [];

  constructor(private db: DatabaseService, private email: EmailService) { }

  ngOnInit() {
    this.db.traerColeccion('clientes').subscribe((response) => {
    
    this.clientsList = response.filter((client: any) => client.rol === 'cliente'&& (client.esAnonimo === false || client.esAnonimo === undefined));
    console.log(this.clientsList);
  });
  }

  async changeStatus(client: any, state: string) {
  client.estado = state;
  await this.db.modificarUsuario(client,'clientes'); 

  if (state == 'aceptado') {
    console.log(`Cliente ${client.nombre} aprobado.`);
    await this.accept(client);

  } else if (state == 'rechazado'){
    console.log(`Cliente ${client.nombre} rechazado.`);
    await this.reject(client);
  }
}
  private async accept(client: any){
    await this.email.enviarCorreo({
      nombre: client.nombre,
      estado: 'Aprobado',
      mensaje: 'Tu solicitud ha sido aprobada. ¡Bienvenido!',
      email: client.email,
      foto_portada: 'https://i.imgur.com/Xi4sygE.png',
      foto: 'https://i.imgur.com/uvNuOdQ.png',
    })
  }

  private async reject(client: any){
    await this.email.enviarCorreo({
      nombre: client.nombre,
      estado: 'Rechazado',
      mensaje: 'Tu solicitud ha sido rechazada.',
      email: client.email,
      foto_portada: 'https://i.imgur.com/Xi4sygE.png',
      foto: 'https://i.imgur.com/BlAOKKN.png',
    })
  }

}