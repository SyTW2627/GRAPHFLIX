import { sql } from "../db/db";
import { MovieRepository } from "../modules/movies/MovieRepository";
import { MovieService } from "../modules/movies/MovieService";

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

/**
 * Función para construir un grafo de películas basado en similitudes.
 * @param peliculasSemilla Array de películas semilla (favoritas o populares).
 * @returns Un objeto con nodos y aristas del grafo.
 * @param peliculasSemilla Array de películas semilla (favoritas o populares).
 * @returns Un objeto con nodos y aristas del grafo.
 */
export async function construirGrafo(peliculasSemilla: any[]) {
    // Obtener los IDs de las películas semilla
    const idsSemilla = peliculasSemilla.map(p => Number(p.id_obra));

    const relaciones = await movieService.findSimilarityRelations(idsSemilla);

    // Obtener los IDs de todas las películas relacionadas
    const idsRelacionados: number[] = relaciones.flatMap(r => [
        Number(r.obra_origen_id),
        Number(r.obra_destino_id)
    ]);

    // Eliminar duplicados y excluir las películas semilla
    const idsUnicos = [...new Set(idsRelacionados)];
    const idsRecomendados: number[] = idsUnicos.filter(id => !idsSemilla.includes(id));

    // Obtener los datos de las películas recomendadas
    let peliculasRecomendadas: any[] = [];

    if (idsRecomendados.length > 0) {
        peliculasRecomendadas = await movieService.findMovies(idsRecomendados);
    }

    // Construir los nodos del grafo
    const nodes = [
        ...peliculasSemilla,
        ...peliculasRecomendadas
    ];

    // Construir las aristas del grafo
    const edges = relaciones.map(r => ({
        source: Number(r.obra_origen_id),
        destiny: Number(r.obra_destino_id)
    }));

    return { nodes, edges };
}
