/**
 * Representa un registro que ya existe en PostgreSQL.
 * Por ello, incluye id_usuario.
 */
export interface User {
    id_usuario: number;
    nombre_usuario: string;
    correo: string;
    password_hash: string;
}

/**
 * Representa los datos que recibe el backend para
 * registrar a alguien. No necesita el id_usuario porque
 * PostgreSQL lo genera automáticamente.
 */
export interface CreateUser {
    nombre_usuario: string;
    correo: string;
    password_hash: string;
}

export interface UpdateData {
  correo?: string;
  nombre_usuario?: string;
}