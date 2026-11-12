// Tipos de datos
export interface Pelicula {
    id_obra: number;
    [key: string]: any;
};

export interface Relacion {
    obra_origen_id: number;
    obra_destino_id: number;
    puntuacion?: number;
};

export interface PeliculaPosicion extends Pelicula {
    nivel: number;
    pos_x: number;
    pos_y: number;
};