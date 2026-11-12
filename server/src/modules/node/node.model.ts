/**
 * Esta interfaz representa un nodo en el grafo de recomendaciones.
 * Cada nodo corresponde a una obra (película o serie) y contiene información
 * sobre su posición en el mapa de recomendaciones.
 */
export interface Node {
    id_nodo: number;
    id_obra: number;
    id_mapa: number;
    pos_x: number;
    pos_y: number;
}

/**
 * Esta interfaz representa los datos que se pueden actualizar de un nodo.
 * Las propiedades pos_x y pos_y son opcionales, lo que permite actualizar
 * únicamente la posición en el eje X, la posición en el eje Y o ambas.
 */
export interface UpdateNode {
    id_nodo: number;
    pos_x?: number;
    pos_y?: number;
}

export interface CreateNode {
    id_obra: number;
    id_mapa: number;
    pos_x: number;
    pos_y: number;
}