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

// Datos que se pueden modificar del perfil (todos opcionales:
// solo se envían los que han cambiado).
interface UpdateProfileData {
    nombre_usuario?: string;
    correo?: string;
}

// Datos necesarios para cambiar la contraseña.
interface UpdatePasswordData {
    password_actual: string;
    password_nueva: string;
}

// Datos públicos que devuelve el backend.
interface PublicUser {
    id_usuario: number;
    nombre_usuario: string;
    correo: string;
    onboarding_completado: boolean;
    foto_perfil?: string | null;
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

// Función para modificar el nombre de usuario y/o el correo.
// El usuario se identifica por la cookie de sesión (JWT), no por id.
export async function updateProfile(data: UpdateProfileData): Promise<PublicUser> {
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
        throw new Error(result.message || "Error al actualizar los datos");
    }

    // Actualizamos el usuario guardado para que el resto de la app lo vea al instante.
    localStorage.setItem(USER_KEY, JSON.stringify(result));
    return result as PublicUser;
}

// Función para cambiar la contraseña.
export async function updatePassword(data: UpdatePasswordData): Promise<void> {
    const response = await fetch(`${API_URL}/me`, {
        method: "PATCH",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify(data)
    });

    if (response.status === 401) throw new SessionExpiredError();

    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Error al cambiar la contraseña");
    }
}

// Función para subir o cambiar la foto de perfil.
// Se envía como multipart/form-data, así que NO se define Content-Type:
// el navegador lo pone solo, con el boundary correcto.
export async function updateAvatar(file: File): Promise<PublicUser> {
    const formData = new FormData();
    formData.append("foto", file);

    const response = await fetch(`${API_URL}/me/avatar`, {
        method: "PATCH",

        credentials: "include",

        body: formData
    });

    if (response.status === 401) throw new SessionExpiredError();

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Error al actualizar la foto de perfil");
    }

    localStorage.setItem(USER_KEY, JSON.stringify(result));
    return result as PublicUser;
}

// Función para eliminar la foto de perfil.
export async function deleteAvatar(): Promise<PublicUser> {
    const response = await fetch(`${API_URL}/me/avatar`, {
        method: "DELETE",

        credentials: "include"
    });

    if (response.status === 401) throw new SessionExpiredError();

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Error al eliminar la foto de perfil");
    }

    localStorage.setItem(USER_KEY, JSON.stringify(result));
    return result as PublicUser;
}