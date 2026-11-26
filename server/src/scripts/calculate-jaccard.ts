import { sql } from '../db/db';
import { MovieRepository } from '../modules/movies/MovieRepository';
import { MovieService } from '../modules/movies/MovieService';

interface SimilitudObra {
    obra_origen_id: number;
    obra_destino_id: number;
    puntuacion: number;
}

interface Caracteristicas {
    generos: Set<string>;
    personas: Set<string>;
    sagas: Set<string>;
}

const PESOS = {
    generos: 0.50,
    personas: 0.35,
    sagas: 0.15
};

const UMBRAL_SIMILITUD = 0.30;
const TAM_LOTE = 5000;

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

/**
 * Calcula el índice de Jaccard entre dos conjuntos.
 */
function calcularJaccard(
    conjuntoA: Set<string>,
    conjuntoB: Set<string>
): number | null {

    const union = new Set([...conjuntoA, ...conjuntoB]);

    // Si ambos conjuntos están vacíos, no hay información comparable.
    if (union.size === 0) return null;

    let interseccion = 0;

    for (const elemento of conjuntoA) {
        if (conjuntoB.has(elemento)) {
            interseccion++;
        }
    }

    return interseccion / union.size;
}

/**
 * Calcula la similitud ponderada entre dos películas.
 */
function calcularSimilitud(
    obraA: Caracteristicas,
    obraB: Caracteristicas
): number | null {

    const jaccardGeneros = calcularJaccard(
        obraA.generos,
        obraB.generos
    );

    const jaccardPersonas = calcularJaccard(
        obraA.personas,
        obraB.personas
    );

    const jaccardSagas = calcularJaccard(
        obraA.sagas,
        obraB.sagas
    );

    let puntuacion = 0;
    let pesoTotal = 0;

    if (jaccardGeneros !== null) {
        puntuacion += jaccardGeneros * PESOS.generos;
        pesoTotal += PESOS.generos;
    }

    if (jaccardPersonas !== null) {
        puntuacion += jaccardPersonas * PESOS.personas;
        pesoTotal += PESOS.personas;
    }

    if (jaccardSagas !== null) {
        puntuacion += jaccardSagas * PESOS.sagas;
        pesoTotal += PESOS.sagas;
    }

    if (pesoTotal === 0) return null;

    return puntuacion / pesoTotal;
}

async function calculateJaccard() {

    console.log("Calculando similitud ponderada...");

    try {

        // 1. Obtener las películas y sus características.

        await movieService.deleteSimilitudObra();

        const obras = await movieService.findAllIdMovies();

        const generos = await movieService.findGenres();
        const personas = await movieService.findPeople();
        const sagas = await movieService.findSagas();

        console.log(`Películas encontradas: ${obras.length}`);

        // 2. Crear los conjuntos de características.

        const caracteristicas = new Map<number, Caracteristicas>();

        for (const obra of obras) {
            caracteristicas.set(obra.id_obra, {
                generos: new Set(),
                personas: new Set(),
                sagas: new Set()
            });
        }

        for (const fila of generos) {
            caracteristicas.get(fila.id_obra)?.generos.add(fila.feature);
        }

        for (const fila of personas) {
            caracteristicas.get(fila.id_obra)?.personas.add(fila.feature);
        }

        for (const fila of sagas) {
            caracteristicas.get(fila.id_obra)?.sagas.add(fila.feature);
        }

        // 3. Comparar todas las parejas de películas.

        const resultados: SimilitudObra[] = [];

        for (let i = 0; i < obras.length; i++) {

            const id1 = obras[i]!.id_obra;
            const caracteristicasA = caracteristicas.get(id1)!;

            for (let j = i + 1; j < obras.length; j++) {

                const id2 = obras[j]!.id_obra;
                const caracteristicasB = caracteristicas.get(id2)!;

                const puntuacion = calcularSimilitud(
                    caracteristicasA,
                    caracteristicasB
                );

                if (
                    puntuacion !== null &&
                    puntuacion > UMBRAL_SIMILITUD
                ) {
                    resultados.push({
                        obra_origen_id: id1,
                        obra_destino_id: id2,
                        puntuacion
                    });
                }
            }
        }

        // 4. Guardar las similitudes por lotes.

        for (let i = 0; i < resultados.length; i += TAM_LOTE) {

            const lote = resultados.slice(i, i + TAM_LOTE);

            await movieService.insertByBatchInSimilitudObra(lote);

            console.log(
                `Guardadas ${Math.min(i + TAM_LOTE, resultados.length)} / ${resultados.length}`
            );
        }

        console.log("--------------------------------");
        console.log("Cálculo de similitud terminado.");
        console.log(`Películas analizadas: ${obras.length}`);
        console.log(`Relaciones guardadas: ${resultados.length}`);
        console.log("--------------------------------");

    } catch (error) {

        console.error("Error calculando similitudes:", error);
        process.exitCode = 1;

    } finally {

        await sql.end();
    }
}

calculateJaccard();