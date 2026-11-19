export interface MovieDetail {
    id_obra: number;
    titulo: string;
    ano_publicacion: number | null;
    descripcion: string | null;
    imagen_url: string | null;
    generos: string[];
    directores: string[];
    reparto: string[];
    sagas: string[];
}