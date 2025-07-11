import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { peopleOutline, logOutOutline } from 'ionicons/icons';
import { DatabaseService } from 'src/app/services/database.service';

  @Component({
    selector: 'app-home-admin',
    templateUrl: './home-admin.component.html',
    styleUrls: ['./home-admin.component.scss'],
    standalone: true,
     imports: [IonicModule],
  })
  export class HomeAdminComponent  implements OnInit {

  constructor(private router: Router, private auth: AuthService,private db: DatabaseService) {
     addIcons({ peopleOutline, logOutOutline });
   }

  ngOnInit() {}

  irAClientes() {
    this.router.navigateByUrl('/client-approval');
  }

  async cerrarSesion() {
    this.auth.logout()
    let user = this.auth.user
    user.push_token = '';
    this.router.navigateByUrl('/login');
    await this.db.modificarUsuario(user, 'clientes');
  }
}