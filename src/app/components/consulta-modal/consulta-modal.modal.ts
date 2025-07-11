import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent, ModalController } from '@ionic/angular';
import { ConsultasService } from '../../services/consultas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-consulta-modal',
  templateUrl: './consulta-modal.modal.html',
  styleUrls: ['./consulta-modal.modal.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ConsultaModal implements OnInit, OnDestroy {
  mensajes: any[] = [];
  nuevoMensaje: string = '';
  @ViewChild(IonContent) content!: IonContent;
  private unsubscribeFn: () => void = () => {};
  currentUserId: string = '';
  
  keyboardActive = false;
  keyboardHeight = 0;
  userScrolledUp = false;
  private keyboardShowListener!: (ev: any) => void;
  private keyboardHideListener!: () => void;

  constructor(
    private consultasService: ConsultasService,
    private modalCtrl: ModalController,
    private authService: AuthService
  ) {
    this.keyboardShowListener = (ev: any) => this.onKeyboardShow(ev);
    this.keyboardHideListener = () => this.onKeyboardHide();
    
    window.addEventListener('keyboardWillShow', this.keyboardShowListener);
    window.addEventListener('keyboardWillHide', this.keyboardHideListener);
  }

  async ngOnInit() {
    const uid = this.authService.getCurrentUserId();
    if (uid) this.currentUserId = uid;

    this.unsubscribeFn = this.consultasService.escucharMensajes((mensajes) => {
      this.mensajes = mensajes.sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      
      this.forceScrollToBottom(300);
    });
  }

  async onScroll(event: any) {
    const scrollElement = await this.content.getScrollElement();
    this.userScrolledUp = scrollElement.scrollTop < scrollElement.scrollHeight - scrollElement.clientHeight - 100;
  }

  private async forceScrollToBottom(delay: number = 0) {
    if (!this.content) return;

    setTimeout(async () => {
      await this.content.scrollToBottom(50);
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      await this.content.scrollToBottom(50);
      
      setTimeout(() => this.content.scrollToBottom(80), 80);
    }, delay);
  }

  onKeyboardShow(ev: CustomEvent) {
    this.keyboardActive = true;
    const adjustedHeight = ev.detail.keyboardHeight + 45; 
    this.keyboardHeight = adjustedHeight;
    
    document.documentElement.style.setProperty('--keyboard-height', `${adjustedHeight}px`);
    
    this.forceScrollToBottom(150);
  }

  onKeyboardHide() {
    this.keyboardActive = false;
    document.documentElement.style.removeProperty('--keyboard-height');
    
    setTimeout(() => {
      this.content?.scrollToBottom(100);
    }, 200);
  }

  async enviar() {
    const texto = this.nuevoMensaje.trim();
    if (texto === '') return;

    await this.consultasService.enviarMensaje(texto);
    this.nuevoMensaje = '';
    this.forceScrollToBottom(100);
  }

  scrollToBottom() {
    this.content?.scrollToBottom(300);
    this.userScrolledUp = false;
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  formatearFecha(fecha: Date): string {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const hora = d.getHours().toString().padStart(2, '0');
    const minuto = d.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes} - ${hora}:${minuto}`;
  }

  esMiMensaje(usuarioId: string): boolean {
    return usuarioId === this.currentUserId;
  }

  ngOnDestroy() {
    window.removeEventListener('keyboardWillShow', this.keyboardShowListener);
    window.removeEventListener('keyboardWillHide', this.keyboardHideListener);
    this.unsubscribeFn();
  }
}