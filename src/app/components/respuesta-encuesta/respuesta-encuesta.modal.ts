import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  chevronBackOutline, 
  chevronForwardOutline,
  cameraOutline
} from 'ionicons/icons';
import { EncuestaService } from '../../services/encuesta.service';
import { Subscription } from 'rxjs';

// Componentes Ionic
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardContent, IonCardTitle, IonCardSubtitle, IonButton, IonButtons, 
  IonIcon, IonTextarea, IonSegment, IonSegmentButton, IonLabel, IonImg,
  IonSpinner
} from '@ionic/angular/standalone';

Chart.register(...registerables);

const CHART_COLORS = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)',
  teal: 'rgb(0, 204, 188)',
  pink: 'rgb(255, 102, 178)',
  cyan: 'rgb(0, 204, 255)'
};

@Component({
  selector: 'app-detalle-pedido',
  templateUrl: './respuesta-encuesta.modal.html',
  styleUrls: ['./respuesta-encuesta.modal.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardContent, IonCardTitle, IonCardSubtitle, IonButton, IonButtons,
    IonIcon, IonTextarea, IonSegment, IonSegmentButton, IonLabel, IonImg, IonSpinner
  ]
})
export class RespuestaEncuestaModal implements AfterViewInit, OnDestroy {
  @ViewChild('comidaChart') comidaChartRef!: ElementRef;
  @ViewChild('atencionChart') atencionChartRef!: ElementRef;
  @ViewChild('recomendacionChart') recomendacionChartRef!: ElementRef;

  encuestas: any[] = [];
  indiceActual = 0;
  fotoSeleccionada = 0;
  cargando = true;
  error = false;

  // Charts
  comidaChart!: Chart;
  atencionChart!: Chart;
  recomendacionChart!: Chart;

  private encuestasSub!: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private encuestaService: EncuestaService
  ) {
    addIcons({ 
      closeOutline, 
      chevronBackOutline, 
      chevronForwardOutline,
      cameraOutline
    });
  }

  ngAfterViewInit() {
    this.cargarEncuestas();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    if (this.encuestasSub) {
      this.encuestasSub.unsubscribe();
    }
    this.destruirGraficos();
  }

  private cargarEncuestas() {
    this.cargando = true;
    this.error = false;

    this.encuestasSub = this.encuestaService.obtenerTodasEncuestas().subscribe({
      next: (encuestas) => {
        this.encuestas = encuestas;
        if (encuestas.length > 0) {
          this.crearGraficos();
        } else {
          this.mostrarMensajeNoHayDatos();
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar encuestas:', err);
        this.error = true;
        this.cargando = false;
      }
    });
  }

  private mostrarMensajeNoHayDatos() {
    console.log('No hay encuestas para mostrar');
  }

  private crearGraficos() {
    this.destruirGraficos();

    try {
      const puntuacionesComida = this.encuestaService.procesarDatosComida(this.encuestas);
      const distribucionAtencion = this.encuestaService.procesarDatosAtencion(this.encuestas);
      const datosRecomendacion = this.encuestaService.procesarDatosRecomendacion(this.encuestas);

      this.crearGraficoComida(puntuacionesComida);
      this.crearGraficoAtencion(distribucionAtencion);
      this.crearGraficoRecomendacion(datosRecomendacion);

    } catch (error) {
      console.error('Error al crear gráficos:', error);
    }
  }

  private crearGraficoComida(puntuaciones: number[]) {
    this.comidaChart = new Chart(this.comidaChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: Array(this.encuestas.length).fill(''),
        datasets: [{
          label: 'Puntuación (1-10)',
          data: puntuaciones,
          borderColor: CHART_COLORS.teal,
          backgroundColor: 'transparent',
          tension: 0.3,
          fill: false,
          borderWidth: 3,
          pointBackgroundColor: CHART_COLORS.teal,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        ...this.getChartOptions('Calidad de la Comida', false),
        scales: {
          y: {
            beginAtZero: false,
            min: 0,
            max: 10,
            ticks: {
              color: '#ffffff',
              stepSize: 1
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              display: false
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  private crearGraficoAtencion(distribucion: {[key: string]: number}) {
    const labels = Object.keys(distribucion).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const data = Object.values(distribucion);
    const backgroundColors = [
      CHART_COLORS.blue,
      CHART_COLORS.green,
      CHART_COLORS.orange,
      CHART_COLORS.red
    ];

    this.atencionChart = new Chart(this.atencionChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: '#000000',
          borderWidth: 1
        }]
      },
      options: this.getChartOptions('Nivel de Atención', true)
    });
  }

  private crearGraficoRecomendacion(datos: [number, number]) {
    this.recomendacionChart = new Chart(this.recomendacionChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Sí', 'No'],
        datasets: [{
          label: 'Recomendaciones',
          data: datos,
          backgroundColor: [
            this.hexToRgba(CHART_COLORS.green, 0.7),
            this.hexToRgba(CHART_COLORS.red, 0.7)
          ],
          borderColor: [
            CHART_COLORS.green,
            CHART_COLORS.red
          ],
          borderWidth: 1
        }]
      },
      options: this.getChartOptions('Recomendarían el Restaurante', false)
    });
  }

  private getChartOptions(title: string, showLegend: boolean): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: title === 'Nivel de Atención' ? 'bottom' : 'right',
          labels: {
            color: '#ffffff',
            font: {
              weight: 'bold'
            }
          }
        },
        title: {
          display: true,
          text: title,
          color: '#ffffff',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#ffffff',
            precision: 0
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private destruirGraficos() {
    [this.comidaChart, this.atencionChart, this.recomendacionChart].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  handleImageError(event: any) {
    console.error('Error al cargar imagen:', event);
  }

  get encuestaActual() {
    return this.encuestas[this.indiceActual];
  }

  get tieneEncuestas() {
    return this.encuestas.length > 0;
  }

  get tieneFotos() {
    return this.encuestaActual?.imagenes?.length > 0;
  }

  anterior() {
    if (this.indiceActual > 0) {
      this.indiceActual--;
      this.fotoSeleccionada = 0;
    }
  }

  siguiente() {
    if (this.indiceActual < this.encuestas.length - 1) {
      this.indiceActual++;
      this.fotoSeleccionada = 0;
    }
  }

  recargar() {
    this.cleanup();
    this.cargarEncuestas();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}