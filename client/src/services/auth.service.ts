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
}