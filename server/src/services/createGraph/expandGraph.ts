import type { Pelicula, Relacion } from "./type-model";
import { MovieRepository } from "../../modules/movies/MovieRepository";
import { MovieService } from "../../modules/movies/MovieService";

const movieService = new MovieService(new MovieRepository());

const PROFUNDIDAD_MAXIMA = 3;
const MAX_VECINOS_POR_NODO = 4;

export async function expandirGrafo(peliculasSemilla: Pelicula[]) {
    
    const idsSemilla = [...new Set(peliculasSemilla.map(p => Number(p.id_obra)))];
    const visitados = new Set<number>(idsSemilla);
    const relacionesVisitadas = new Set<string>();
    const idsPorNivel = new Map<number, number[]>([[0, idsSemilla]]);
    const relacionesTotales: Relacion[] = [];

    let fronteraActual = idsSemilla;

    for (let nivel = 1; nivel <= PROFUNDIDAD_MAXIMA && fronteraActual.length > 0; nivel++) {
        
        const fronteraSet = new Set(fronteraActual);
        const conteoPorObra = new Map<number, number>();
        const nuevosIdsNivel: number[] = [];

        // Se buscan todas las relaciones de las peliculas de la frontera y se ordenan por puntuacion de forma descentente
        const relacionesNivel = await movieService.findSimilarityRelations(fronteraActual);
        const relacionesOrdenadas = [...relacionesNivel].sort(
            (a, b) => Number(b.puntuacion ?? 0) - Number(a.puntuacion ?? 0)
        );

        for (const r of relacionesOrdenadas) {
            // Se cogen el origen y destino de las relaciones
            const origen = Number(r.obra_origen_id);
            const destino = Number(r.obra_destino_id);

            // Se suman la cantidad de vecinos por obra 
            const cOrigen = conteoPorObra.get(origen) ?? 0;
            const cDestino = conteoPorObra.get(destino) ?? 0;

            // Si las obras no están en el frontera set o ya hay demasiados nodos vecinos no lo coge y sigue
            const aplicaOrigen = fronteraSet.has(origen) && cOrigen < MAX_VECINOS_POR_NODO;
            const aplicaDestino = fronteraSet.has(destino) && cDestino < MAX_VECINOS_POR_NODO;

            if (!aplicaOrigen && !aplicaDestino) continue;

            // Se actualiza el conteo por obra
            if (aplicaOrigen) conteoPorObra.set(origen, cOrigen + 1);
            if (aplicaDestino) conteoPorObra.set(destino, cDestino + 1);

            // Toma siempre la relacion de origen: menor, destino: mayor
            const clave = origen < destino ? `${origen}-${destino}` : `${destino}-${origen}`;
            
            // Se añade la relacion a relacionesVisitadas
            if (!relacionesVisitadas.has(clave)) {
                relacionesVisitadas.add(clave);
                relacionesTotales.push({ obra_origen_id: origen, obra_destino_id: destino });
            }

            // Se comprueba si origen y destino están en visitados y si no están se añaden y se añaden a nuevosIdsNivel
            if (!visitados.has(origen)) {
                visitados.add(origen);
                nuevosIdsNivel.push(origen);
            }
            if (!visitados.has(destino)) {
                visitados.add(destino);
                nuevosIdsNivel.push(destino);
            }
        }

        // Se guardan todos los nuevos ids que se consiguieron en las similitudes y se crea una nueva frontera con ellos
        idsPorNivel.set(nivel, nuevosIdsNivel);
        fronteraActual = nuevosIdsNivel;
    }

    // Se quitan las peliculas que estaban en favoritas del const con el filtro
    const idsRecomendados = [...visitados].filter(id => !idsSemilla.includes(id));
    const peliculasRecomendadas = ( idsRecomendados.length > 0 ? 
                                    await movieService.findMovies(idsRecomendados): []
    ) as unknown as Pelicula[];

    return { idsSemilla, idsPorNivel, relacionesTotales, peliculasRecomendadas};
}