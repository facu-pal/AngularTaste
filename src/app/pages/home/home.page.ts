import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';

// Importar los componentes por rol
import { HomeClienteComponent } from './components/home-cliente/home-cliente.component';
import { HomeMozoComponent } from './components/home-mozo/home-mozo.component';
import { HomeMaitreComponent } from './components/home-maitre/home-maitre.component';
import { HomeCocineroBartenderComponent } from './components/home-cocinero-bartender/home-cocinero-bartender.component';
import { HomeAdminComponent } from './components/home-admin/home-admin.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    HomeClienteComponent,
    HomeMozoComponent,
    HomeMaitreComponent,
    HomeCocineroBartenderComponent,
    HomeAdminComponent,
  ],
})
export class HomePage implements OnInit {
  private authService = inject(AuthService);
  private dbService = inject(DatabaseService);

  userRole: string | null = null;

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      const userData = await this.dbService.obtenerUsuarioPorId(user.uid, 'clientes');
      if (userData && userData.estado === 'aceptado') {
        this.userRole = userData.rol.toLowerCase(); // Ej: "cliente"
      }
    }
  }
}