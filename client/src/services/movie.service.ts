const API_URL = import.meta.env.VITE_API_URL;

export interface MovieResult{
    id_obra: number;
    titulo: string;
    ano_publicacion: number | null;
    imagen_url: string | null;
}

export interface SearchParams {
    q?: string;
    genre?: string;
    director?: string;
    actor?: string;
    year?: string;
    from?: string;
    to?: string;
}

// get /movies/search
export async function searchMovies(params: SearchParams, signal?: AbortSignal): Promise<MovieResult[]> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value && value.trim() !== "") query.set(key, value.trim());
    }

    const response = await fetch(`${API_URL}/movies/search?${query.toString()}`, { signal });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.message || "Error al buscar películas");

    return result as MovieResult[];
}
