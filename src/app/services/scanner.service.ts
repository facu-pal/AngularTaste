import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  constructor(private router: Router) {}

  /**
   * Parses the QR code string from an Argentinian DNI and returns an object with the extracted data.
   *
   * The expected format of the QR string is:
   * "numeroDeTramite@APELLIDO@NOMBRE@SEXO@numeroDeDni@EJEMPLAR@fechaDeNacimiento@fechaDeEmision"
   *
   * @param qrCodeString The string obtained from scanning the DNI QR code.
   * @returns An object containing the DNI data, or null if the string format is invalid.
   * {
   * numeroDeTramite: string;
   * apellido: string;
   * nombre: string;
   * sexo: string;
   * numeroDeDni: string;
   * ejemplar: string;
   * fechaDeNacimiento: Date;
   * fechaDeEmision: Date;
   * }
   */
  parseDniQrCode(qrCodeString: string): DniData | null {
    if (!qrCodeString) {
      console.error('QR code string is empty or null.');
      return null;
    }

    const parts = qrCodeString.split('@');

    // Expected number of parts is 8
    if (parts.length !== 8) {
      console.error(
        `Invalid QR code string format. Expected 8 parts, but got ${parts.length}. String: ${qrCodeString}`
      );
      return null;
    }

    try {
      const dniData: DniData = {
        numeroDeTramite: parts[0],
        // Apply capitalization for apellido
        apellido: this.capitalizeFirstLetter(parts[1]),
        // Apply capitalization for nombre
        nombre: this.capitalizeFirstLetter(parts[2]),
        sexo: parts[3],
        numeroDeDni: parts[4],
        ejemplar: parts[5],
        fechaDeNacimiento: this.parseDateString(parts[6]),
        fechaDeEmision: this.parseDateString(parts[7]),
        hash: parts[8],
      };
      return dniData;
    } catch (error) {
      console.error('Error parsing DNI QR code string:', error);
      return null;
    }
  }

  /**
   * Helper function to parse a date string in "DD/MM/YYYY" format to a Date object.
   * @param dateString The date string to parse.
   * @returns A Date object.
   * @throws Error if the date string format is invalid.
   */
  private parseDateString(dateString: string): Date {
    const [day, month, year] = dateString.split('/').map(Number);
    // Month is 0-indexed in JavaScript Date objects, so subtract 1 from the month.
    const date = new Date(year, month - 1, day);

    // Check if the date is valid (e.g., handles "31/02/2023" gracefully)
    if (
      isNaN(date.getTime()) ||
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      throw new Error(
        `Invalid date string format: ${dateString}. Expected DD/MM/YYYY.`
      );
    }
    return date;
  }

  /**
   * Helper function to capitalize the first letter of a string and convert the rest to lowercase.
   * Handles multi-word names by applying capitalization to each word.
   * @param text The input string (e.g., "APELLIDO" or "NOMBRE").
   * @returns The capitalized string (e.g., "Apellido" or "Nombre").
   */
  private capitalizeFirstLetter(text: string): string {
    if (!text) {
      return '';
    }
    // Split by spaces to handle multiple words (e.g., "JUAN CARLOS")
    return text
      .split(' ')
      .map((word) => {
        if (word.length === 0) {
          return '';
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  dispatchQRCode(qrCodeString: string): void {
    if (!qrCodeString) {
      console.log('QR invalido.');
      return;
    }

    const trimmedQrString = qrCodeString.trim();

    switch (trimmedQrString) {
      case 'esperar-mesa':
        this.router.navigate(['esperar-mesa']);
        break;
      case 'lista-de-espera':
        this.router.navigate(['lista-de-espera']);
        break;
      case 'Funciona el QR':
        this.router.navigate(['login']);
        break;
      default:
        console.warn('No existe esa ruta');
        break;
    }
  }

  ingresarAListaDeEspera(qrCodeString: string): void {
    if (!qrCodeString) {
      console.log('QR invalido.');
      return;
    }
  }
}

/**
 * Interface to define the structure of the parsed DNI data.
 */
export interface DniData {
  numeroDeTramite: string;
  apellido: string;
  nombre: string;
  sexo: string;
  numeroDeDni: string;
  ejemplar: string;
  fechaDeNacimiento: Date;
  fechaDeEmision: Date;
  hash: string;
}
