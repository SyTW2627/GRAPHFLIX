const API_URL = import.meta.env.VITE_API_URL;

export interface GraphNode {
    id_nodo: number;
    id_mapa: number;
    id_obra: number | null;
    titulo?: string;
    ano_publicacion?: number | null;
    imagen_url?: string | null;
    generos?: string[];
    directores?: string[];
    reparto?: string[];
    nivel: number;
    pos_x: number;
    pos_y: number;
}

export interface GraphEdge {
    source: number;
    destiny: number;
}

export interface GraphResponse {
  isColdStart: boolean;
  id_mapa?: number;
  total_generos?: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface UserMap {
    id_mapa: number;
    tipo_mapa: string | null;
    nombre_mapa: string | null;
    id_usuario: number;
}

// cuando la cookie de sesión ha caducado o no existe
export class SessionExpiredError extends Error {
    constructor() {
        super("La sesión ha caducado");
        this.name = "SessionExpiredError";
    }
}

// cargar un mapa /maps/:id/graph
export async function getMapGraph(idMapa: number): Promise<GraphResponse> {
    const response = await fetch(`${API_URL}/maps/${idMapa}/graph`, { credentials: "include" });

    if (response.status === 401) throw new SessionExpiredError();

    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.message || "Error al cargar el grafo");

    return result as GraphResponse;
}

// obtiene los mapas de los usuarios
export async function getUserMaps(): Promise<UserMap[]> {
    const response = await fetch(`${API_URL}/maps`, { credentials: "include" });

    if (response.status === 401) throw new SessionExpiredError();

    const result = await response.json().catch(() => []);

    if (!response.ok) throw new Error(result.message || "Error al obtener los mapas");

    return result as UserMap[];
}

// para la creacion del primer grafo
export async function getRecommendationGraph( idUsuario: number, limit?: number): Promise<GraphResponse> {
    const query = limit ? `?limit=${limit}` : "";

    const response = await fetch(`${API_URL}/recommendations/${idUsuario}${query}`, { credentials: "include"});

    if (response.status === 401) throw new SessionExpiredError();

    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.message || "Error al cargar el grafo");

    return result as GraphResponse;
}