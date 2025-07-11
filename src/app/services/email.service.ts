import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';


@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private serviceID = 'service_ic2o3ya';
  private templateID = 'template_q3ai93d';
  private userID = 'XzfU8LtYCFnxSfe-q';

  constructor() {}

  enviarCorreo(datos: {
    nombre: string;
    estado: string;
    mensaje: string;
    email: string;
    foto: string;
    foto_portada: string;
  }): Promise<EmailJSResponseStatus> {
    const templateParams = {
      nombre: datos.nombre,
      estado: datos.estado,
      mensaje: datos.mensaje,
      email: datos.email,
      foto_portada: datos.foto_portada,
      foto: datos.foto,
    };

    return emailjs.send(this.serviceID, this.templateID, templateParams, this.userID);
  }
}
