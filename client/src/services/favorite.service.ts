import { SessionExpiredError } from "./graph.service";

const API_URL = import.meta.env.VITE_API_URL;

export interface Favorite {
    id_obra: number;
    titulo: string;
    year_pub: number | null;
    imagen_url: string | null;
}

// pedir al servidor las peliculas favoritas del usuario
export async function getFavorites(idUsuario: number) {
    const response = await fetch(`${API_URL}/favorites/${idUsuario}`, { credentials: "include" });

    if (response.status === 401) throw new SessionExpiredError()

    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.message || "Error al cargar los favoritos");

    return result as Favorite[]
}

// Añadir a favoritos
export async function addFavorite(id_obra: number) {
    const response = await fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_obra }),
        credentials: "include",
    });

    if (!response.ok) throw new Error("Error al añadir a favoritos");
    return response.json();
}

// Guarda las películas favoritas del usuario autenticado.
export async function addManyFavorites(idsObras: number[]) {

    const idsUnicos = [...new Set(idsObras)];
    
    if (idsUnicos.length !== 3) {
        throw new Error("Debes seleccionar exactamente 3 películas");
    }
    
    const response = await fetch(`${API_URL}/favorites/batch`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            ids_obras: idsUnicos
        })
    });
    
    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        throw new Error(result.message || "Error al guardar las películas favoritas");
    }
    
    return result;
    
}

// Eliminar de favoritos
export async function removeFavorite(idUsuario: number, id_obra: number) {
    const response = await fetch(`${API_URL}/favorites/${idUsuario}/${id_obra}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (response.status === 401) throw new SessionExpiredError();

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Error al eliminar de favoritos");
    return result;
}