import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Barcode,
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
  StartScanOptions,
} from '@capacitor-mlkit/barcode-scanning';
import {
  IonHeader,
  IonFab,
  IonFabButton,
  IonContent,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flashlight, close } from 'ionicons/icons';

@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
  imports: [
    IonButtons,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonFab,
    IonFabButton,
    IonButton,
    IonIcon,
  ],
})
export class BarcodeScannerComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input()
  public formats: BarcodeFormat[] = [];
  @Input()
  public lensFacing: LensFacing = LensFacing.Back;

  @ViewChild('square')
  public squareElement: ElementRef<HTMLDivElement> | undefined;

  public isTorchAvailable = false;

  constructor(
    private readonly ngZone: NgZone,
    private modalController: ModalController
  ) {
    addIcons({ flashlight, close });
  }
  ngOnDestroy(): void {
    this.stopScan();
  }

  public ngOnInit(): void {
    BarcodeScanner.isTorchAvailable().then((result) => {
      this.isTorchAvailable = result.available;
    });
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.startScan();
    }, 250);
  }

  public async closeModal(barcode?: Barcode): Promise<void> {
    await this.modalController.dismiss({ barcode });
  }

  public async toggleTorch(): Promise<void> {
    await BarcodeScanner.toggleTorch();
  }

  private async startScan(): Promise<void> {
    document.querySelector('body')?.classList.add('barcode-scanning-active');

    const options: StartScanOptions = {
      formats: this.formats,
      lensFacing: this.lensFacing,
    };

    const squareElementBoundingClientRect =
      this.squareElement?.nativeElement.getBoundingClientRect();
    const scaledRect = squareElementBoundingClientRect
      ? {
          left: squareElementBoundingClientRect.left * window.devicePixelRatio,
          right:
            squareElementBoundingClientRect.right * window.devicePixelRatio,
          top: squareElementBoundingClientRect.top * window.devicePixelRatio,
          bottom:
            squareElementBoundingClientRect.bottom * window.devicePixelRatio,
          width:
            squareElementBoundingClientRect.width * window.devicePixelRatio,
          height:
            squareElementBoundingClientRect.height * window.devicePixelRatio,
        }
      : undefined;
    const detectionCornerPoints = scaledRect
      ? [
          [scaledRect.left, scaledRect.top],
          [scaledRect.left + scaledRect.width, scaledRect.top],
          [
            scaledRect.left + scaledRect.width,
            scaledRect.top + scaledRect.height,
          ],
          [scaledRect.left, scaledRect.top + scaledRect.height],
        ]
      : undefined;

    const listener = await BarcodeScanner.addListener(
      'barcodesScanned',
      async (event: { barcodes: Barcode[] }) => {
        // <--- Changed event type here
        this.ngZone.run(() => {
          // Check if any barcodes were scanned
          if (event.barcodes && event.barcodes.length > 0) {
            const scannedBarcode = event.barcodes[0]; // Assuming you only care about the first one

            const cornerPoints = scannedBarcode.cornerPoints;
            if (detectionCornerPoints && cornerPoints) {
              // Your existing detection logic
              // if (
              //   detectionCornerPoints[0][0] > cornerPoints[0][0] ||
              //   detectionCornerPoints[0][1] > cornerPoints[0][1] ||
              //   detectionCornerPoints[1][0] < cornerPoints[1][0] ||
              //   detectionCornerPoints[1][1] > cornerPoints[1][1] ||
              //   detectionCornerPoints[2][0] < cornerPoints[2][0] ||
              //   detectionCornerPoints[2][1] < cornerPoints[2][1] ||
              //   detectionCornerPoints[3][0] > cornerPoints[3][0] ||
              //   detectionCornerPoints[3][1] < cornerPoints[3][1]
              // ) {
              //   console.log(
              //     'BarcodeScannerComponent: Barcode did not fit detection area. Returning.'
              //   );
              //   return;
              // }
            }
            console.log(
              'BarcodeScannerComponent: Barcode passed detection logic. Removing listener and closing modal.'
            );
            listener.remove();
            this.closeModal(scannedBarcode);
          } else {
            console.log(
              'BarcodeScannerComponent: barcodesScanned event received, but no barcodes found in event.barcodes array.'
            );
          }
        });
      }
    );
    await BarcodeScanner.startScan(options);
  }

  private async stopScan(): Promise<void> {
    document.querySelector('body')?.classList.remove('barcode-scanning-active');
    await BarcodeScanner.stopScan();
  }
}
