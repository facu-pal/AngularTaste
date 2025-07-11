import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, menuOutline, fastFoodOutline, wineOutline } from 'ionicons/icons';
import { PedidoService } from '../../../../services/pedido.service';

@Component({
  selector: 'app-home-cocinero-bartender',
  templateUrl: './home-cocinero-bartender.component.html',
  styleUrls: ['./home-cocinero-bartender.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HomeCocineroBartenderComponent implements OnInit {
  userRole: string | null = null;
  pedidos: any[] = [];
  private unsubscribePedidos: any;

  constructor(
    private auth: AuthService,
    private dbService: DatabaseService,
    private router: Router,
    private pedidoService: PedidoService
  ) {
    addIcons({ logOutOutline, menuOutline, fastFoodOutline, wineOutline });
  }

  async ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (user) {
      const userData = await this.dbService.obtenerUsuarioPorId(user.uid, 'clientes');
      if (userData) {
        this.userRole = userData.rol.toLowerCase();
        this.suscribirAPedidos();
      }
    }
  }

  ngOnDestroy() {
    if (this.unsubscribePedidos) {
      this.unsubscribePedidos();
    }
  }

  suscribirAPedidos() {
    this.unsubscribePedidos = this.pedidoService.suscribirAPedidos(
      ['en preparación', 'cocina lista', 'bebida lista'],
      (pedidos) => {
        this.pedidos = pedidos
          .map(pedido => this.filtrarYProcesarPedido(pedido))
          .filter(pedido => this.debeMostrarPedido(pedido));
      }
    );
  }

  filtrarYProcesarPedido(pedido: any): any {
    const pedidoProcesado = { ...pedido };
    
    // Filtrar productos según el rol
    pedidoProcesado.productos = pedido.productos.filter((producto: any) => {
      if (this.esCocinero) {
        return (producto.tipo === 'comida' || producto.tipo === 'postre');
      } else {
        return producto.tipo === 'bebida';
      }
    });

    // Calcular si todos los productos del tipo actual están preparados
    pedidoProcesado.todosPreparados = pedidoProcesado.productos.length > 0 && 
      pedidoProcesado.productos.every((p: any) => p.estadoProducto === 'preparado');

    // Calcular tiempo máximo de preparación
    if (pedidoProcesado.productos.length > 0) {
      pedidoProcesado.tiempoMaxPreparacion = Math.max(
        ...pedidoProcesado.productos.map((p: any) => p.tiempo || 0)
      );
    }

    return pedidoProcesado;
  }

  debeMostrarPedido(pedido: any): boolean {
    // Mostrar pedidos que tienen productos para este rol
    const tieneProductos = pedido.productos.length > 0;
    
    // Reglas específicas por rol y estado
    if (this.esCocinero) {
      return tieneProductos && pedido.estado !== 'cocina lista';
    } else {
      return tieneProductos && pedido.estado !== 'bebida lista';
    }
  }

  async cambiarEstadoProducto(pedido: any, producto: any) {
    if (producto.estadoProducto === 'preparado') return;

    try {
      producto.estadoProducto = 'preparado';
      await this.pedidoService.actualizarEstadoProducto(
        pedido.id, 
        producto.idProducto, 
        'preparado'
      );
    } catch (error) {
      producto.estadoProducto = 'pendiente';
      console.error('Error al actualizar producto:', error);
      this.pedidoService.mostrarToast('Error al actualizar producto', 'danger');
    }
  }

  async marcarPedidoEntregado(pedidoId: string,idMesa: string) {
    try {
      const tipo = this.esCocinero ? 'comida' : 'bebida';
      await this.pedidoService.marcarComoListoParaEntregar(pedidoId, tipo,idMesa);
    } catch (error) {
      console.error('Error al marcar pedido como listo:', error);
    }
  }

  getEstadoPedido(pedido: any): string {
    if (pedido.estado === 'listo para servir') return 'Listo para servir';
    if (this.esCocinero && pedido.estado === 'bebida lista') return 'Esperando bebidas';
    if (this.esBartender && pedido.estado === 'cocina lista') return 'Esperando comidas';
    return 'En preparación';
  }

  getColorEstado(pedido: any): string {
    if (pedido.estado === 'listo para servir') return 'success';
    if (pedido.estado === 'cocina lista' || pedido.estado === 'bebida lista') return 'warning';
    return 'primary';
  }

  async cerrarSesion() {
    this.auth.logout()
    let user = this.auth.user
    user.push_token = '';
    this.router.navigateByUrl('/login');
    await this.dbService.modificarUsuario(user, 'clientes');
  }

  get esCocinero(): boolean {
    return this.userRole === 'cocinero';
  }

  get esBartender(): boolean {
    return this.userRole === 'bartender';
  }

  formatearIdPedido(id: string): string {
    return id ? id.toUpperCase() : '';
  }
}