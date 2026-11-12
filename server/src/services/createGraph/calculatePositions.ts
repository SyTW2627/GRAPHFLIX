import type { Pelicula, PeliculaPosicion } from "./type-model";

const CENTERX = 500;
const CENTERY = 400;
const RADIO_BASE = 140;
const DESFASE_ANGULAR = 0.35;

export function calcularPosiciones( peliculasSemilla: Pelicula[], peliculasRecomendadas: Pelicula[],
                                    idsPorNivel: Map<number, number[]> ): PeliculaPosicion[] {

    // Crear diccionario de películas con un Map (id_obra, datos_obra)
    const datosObra = new Map<number, Pelicula>( [...peliculasSemilla, ...peliculasRecomendadas]
                                               .map(p => [Number(p.id_obra), p]) );

    const peliculasConPosicion: PeliculaPosicion[] = [];

    for (const [nivel, ids] of idsPorNivel) {
        // Separa cada capa de nivel 140 pixeles 
        const radio = RADIO_BASE * (nivel + 1);
        const desfaseAngular = nivel * DESFASE_ANGULAR;

        ids.forEach((idObra, index) => {

            const obra = datosObra.get(idObra);
            if (!obra) return;

            const angulo = (2 * Math.PI * index) / (ids.length || 1) + desfaseAngular;

            peliculasConPosicion.push({
                ...obra,
                nivel,
                pos_x: CENTERX + radio * Math.cos(angulo),
                pos_y: CENTERY + radio * Math.sin(angulo)
            });
        });
    }

    return peliculasConPosicion;
}

