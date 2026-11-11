export interface Map {
    id_mapa: number;
    tipo_mapa: string | null;
    nombre_mapa: string | null;
    id_usuario: number;
}

export interface NewMap {
    tipo_mapa?: string;
    nombre_mapa?: string;
    id_usuario: number;
}

export interface UpdateMap {
    tipo_mapa?: string;
    nombre_mapa?: string;
}
