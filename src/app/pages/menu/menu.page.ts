import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaModal } from '../../components/consulta-modal/consulta-modal.modal';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  chatbubblesOutline, 
  logOutOutline, 
  cartOutline, 
  informationCircleOutline,
  remove,
  add
} from 'ionicons/icons';

// Ionic Components
import { 
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, 
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenu, 
  IonSegment, IonSegmentButton, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, 
  IonButton 
} from "@ionic/angular/standalone";
import { MenuController } from '@ionic/angular';
import { DetallePedidoModal } from '../../components/detalle-pedido/detalle-pedido.modal';
import { AuthService } from '../../services/auth.service';
// Swiper
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, 
    IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenu, 
    IonSegment, IonSegmentButton, IonCard, IonCardHeader, 
    IonCardTitle, IonCardSubtitle, IonCardContent,IonButton
  ]
})
export class MenuPage implements OnInit {
  segment: string = 'comida';
  productosFiltrados: { [key: string]: any[] } = { comida: [], bebida: [], postre: [] };
  carrito: any[] = [];
  loading: boolean = true;
  constructor(
    private db: DatabaseService,
    private router: Router,
    private modalCtrl: ModalController,
    private menuCtrl: MenuController ,
    private auth: AuthService
  ) {
    addIcons({ 
      homeOutline, 
      chatbubblesOutline, 
      logOutOutline, 
      cartOutline, 
      informationCircleOutline,
      remove,
      add
    });
  }

  ngOnInit() {
    this.db.traerColeccion('productos').subscribe((productos: any[]) => {
      this.productosFiltrados = { comida: [], bebida: [], postre: [] };

      productos.forEach((p) => {
        p.cantidad = 0; // Inicializamos en 0
        if (p.tipo === 'comida' || p.tipo === 'bebida' || p.tipo === 'postre') {
          this.productosFiltrados[p.tipo].push(p);
        }
      });
      this.loading = false;
    });
  }

  incrementarCantidad(producto: any) {
    if (!producto.cantidad) producto.cantidad = 0;
    producto.cantidad++;
    this.actualizarCarrito(producto);
  }

  decrementarCantidad(producto: any) {
    if (producto.cantidad && producto.cantidad > 0) {
      producto.cantidad--;
      this.actualizarCarrito(producto);
    }
  }

  actualizarCarrito(producto: any) {
    const existente = this.carrito.find(p => p.id === producto.id);
    
    if (producto.cantidad > 0) {
      if (existente) {
        existente.cantidad = producto.cantidad;
      } else {
        this.carrito.push({ ...producto });
      }
    } else {
      this.carrito = this.carrito.filter(p => p.id !== producto.id);
    }
  }

  calcularTotal(): number {
    return this.carrito.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);
  }

  calcularTiempoMaximo(): number {
    if (this.carrito.length === 0) return 0;
    return Math.max(...this.carrito.map(producto => producto.tiempo));
  }

  async verDetallePedido() {
 const modal = await this.modalCtrl.create({
    component: DetallePedidoModal,
    componentProps: {
      carrito: this.carrito // Pasar el carrito actual
    }
  });
  
  await modal.present();
  
  // Opcional: Manejar el resultado cuando se cierra el modal
  const { data } = await modal.onWillDismiss();
  if (data?.ordenRealizada) {
    // Limpiar carrito si se realizó la orden
    this.carrito = [];
  }
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
    this.auth.logout().then(() => {
      this.router.navigateByUrl('/login');
    })
  }


  
}