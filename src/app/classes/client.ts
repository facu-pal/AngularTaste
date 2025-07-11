export class Client {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  foto: string;
  estado: string;
  rol: string;
  push_token: string;
  esAnonimo: boolean  = false;
  constructor(
    id: string,
    nombre: string,
    apellido: string,
    dni: string,
    email: string,
    foto: string,
    estado: string,
    rol: string,
    push_token: string,
    esAnonimo: boolean 
  ) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.dni = dni;
    this.email = email;
    this.foto = foto;
    this.estado = estado;
    this.rol = rol;
    this.push_token = push_token;
    this.esAnonimo = esAnonimo;
  }
}
