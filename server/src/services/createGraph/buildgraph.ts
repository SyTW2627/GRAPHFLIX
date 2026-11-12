import { sql } from "../../db/db";
import { MovieRepository } from "../../modules/movies/MovieRepository";
import { MovieService } from "../../modules/movies/MovieService";
import  { expandirGrafo} from "./expandGraph";
import { calcularPosiciones } from "./calculatePositions";
import { guardarGrafo } from "./saveGraph";
import type { Pelicula } from "./type-model";

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);



export async function construirGrafo( peliculasSemilla: Pelicula[], idUsuario: number, tipoMapa: string, nombreMapa: string) {

    // 1. Expandir grafo
    const { idsSemilla, idsPorNivel, relacionesTotales, peliculasRecomendadas } = await expandirGrafo(peliculasSemilla);

    // 2. Calcular posiciones
    const peliculasConPosicion = calcularPosiciones( peliculasSemilla, peliculasRecomendadas, idsPorNivel);

    // 3. Guardar en PostgreSQL
    const { mapaCreado, nodosGuardados, aristasGuardadas } = await guardarGrafo( 
                                                                peliculasConPosicion, 
                                                                relacionesTotales, 
                                                                idUsuario, 
                                                                tipoMapa, 
                                                                nombreMapa
                                                            );


    // 4. Construir respuesta para el frontend
    const nodoPorObra = new Map( nodosGuardados.map(n => [ Number(n.id_obra), n ]) );

    // Añadir ID de nodo e ID de mapa a las películas
    const nodosPeliculas = peliculasConPosicion.flatMap(p => {
        
        const nodoBD = nodoPorObra.get(Number(p.id_obra));

        if (!nodoBD) return [];

        return [{
            ...p,
            id_nodo: Number(nodoBD.id_nodo),
            id_mapa: Number(mapaCreado.id_mapa)
        }];
    });


    // Crear nodo central virtual
    const nodoCentral = {
        id_nodo: 0,
        id_obra: null,
        id_mapa: Number(mapaCreado.id_mapa),
        nivel: -1,
        pos_x: 500,
        pos_y: 400
    };


    // Conectar nodo central con las películas semilla
    const aristasCentrales = idsSemilla
        .map(id => nodoPorObra.get(id))
        .filter(Boolean)
        .map(n => ({ source: 0, destiny: Number(n!.id_nodo) }));


    // Convertir aristas de similitud al formato del frontend
    const aristasSimilitud = aristasGuardadas.map(a => ({
        source: Number(a.id_nodo_origen),
        destiny: Number(a.id_nodo_destino)
    }));


    // 5. Devolver grafo completo
    return {
        id_mapa: Number(mapaCreado.id_mapa),
        nodes: [ nodoCentral, ...nodosPeliculas ],
        edges: [ ...aristasCentrales, ...aristasSimilitud ]
    };
}