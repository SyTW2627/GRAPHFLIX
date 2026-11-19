import { SessionExpiredError } from "./graph.service";
const API_URL = `${import.meta.env.VITE_API_URL}/users`;

// Datos necesarios para iniciar sesión.
interface LoginData {
    correo: string;
    password: string;
}

interface RegisterData {
    nombre_usuario: string;
    correo: string;
    password: string;
}

// Datos públicos que devuelve el backend.
interface PublicUser {
    id_usuario: number;
    nombre_usuario: string;
    correo: string;
    onboarding_completado: boolean;
}

// Datos que se pueden modificar del usuario (todos opcionales:
// solo se envían los que han cambiado).
// Para cambiar la contraseña hay que enviar password_actual y password_nueva.
interface UpdateUserData {
    nombre_usuario?: string;
    correo?: string;
    password_actual?: string;
    password_nueva?: string;
}

// para guardar el usuario
const USER_KEY = "graphflix_user";

export function getStoreUSer(): PublicUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as PublicUser;
}

// Función para iniciar sesión.
export async function login(data: LoginData): Promise<PublicUser> {

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Error al iniciar sesión");
    }

    localStorage.setItem(USER_KEY, JSON.stringify(result));
    return result as PublicUser;
}



export async function register(data: RegisterData) {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Error al registrar usuario");
    }

    return result as PublicUser;
}

// Función para cerrar sesión
export async function logout(): Promise<void> {
    const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include"
    });

    if (!response.ok && response.status !== 401) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Error al cerrar sesión");
    }
    localStorage.removeItem(USER_KEY);
}

export async function completeOnboarding(): Promise<PublicUser> {
    const response = await fetch(`${API_URL}/me/onboarding`, {
        method: "PATCH",
        credentials: "include"
    });
    
    if (response.status === 401)  throw new SessionExpiredError();
    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        throw new Error(result.message || "Error al completar el onboarding");
    }

    localStorage.setItem(USER_KEY, JSON.stringify(result));
    return result as PublicUser;
}

export async function updateUser(data: UpdateUserData): Promise<PublicUser | null> {
    const response = await fetch(`${API_URL}/me`, {
        method: "PATCH",
 
        headers: {
            "Content-Type": "application/json"
        },
 
        credentials: "include",
 
        body: JSON.stringify(data)
    });
 
    if (response.status === 401) throw new SessionExpiredError();
 
    const result = await response.json().catch(() => ({}));
 
    if (!response.ok) {
        throw new Error(result.message || "Error al actualizar el usuario");
    }
 
    // Si el backend devuelve el usuario, lo guardamos para que el resto
    // de la app vea el cambio al instante. Al cambiar solo la contraseña
    // puede no devolver nada.
    if (result.id_usuario) {
        localStorage.setItem(USER_KEY, JSON.stringify(result));
        return result as PublicUser;
    }
 
    return null;
}