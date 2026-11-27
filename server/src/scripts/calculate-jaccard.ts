
import { sql } from '../db/db';
import { MovieRepository } from '../modules/movies/MovieRepository';
import { MovieService } from '../modules/movies/MovieService';

interface SimilitudObra {
    obra_origen_id: number;
    obra_destino_id: number;
    puntuacion: number;
}

/* ------------------------------ Configuración ------------------------------ */

// Pesos de cada categoría (si falta una, el resto se renormaliza)
const PESOS = {
    generos: 0.50,
    directores: 0.20,
    reparto: 0.30,
} as const;

type Categoria = keyof typeof PESOS;
const CATEGORIAS = Object.keys(PESOS) as Categoria[];

const VECINAS_POR_PELICULA = 30;                       // vecinas que se guardan por película
const CANDIDATAS_POR_PELICULA = VECINAS_POR_PELICULA * 4; // margen para poder aplicar el límite de sagas
const MAX_MISMA_SAGA = 2;                              // máximo de vecinas de su misma saga
const PUNTUACION_MINIMA = 0.05;                        // descarta parejas casi sin relación
const TAM_LOTE = 5000;

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

/* --------------------------------- Tipos ----------------------------------- */

// Conjunto de características con el peso (IDF) de cada elemento ya calculado
interface ConjuntoPonderado {
    items: Map<string, number>;   // característica -> peso
    total: number;                // suma de los pesos
}

type Pelicula = Record<Categoria, ConjuntoPonderado> & {
    id: number;
    sagas: Set<string>;
};

interface Candidata {
    indice: number;               // posición de la otra película
    puntuacion: number;
}

/* ------------------------------- Similitud --------------------------------- */

/**
 * Jaccard ponderado: peso de lo compartido / peso de la unión.
 * Devuelve null si a cualquiera de las dos le faltan datos (no hay base para comparar).
 */
function jaccardPonderado(a: ConjuntoPonderado, b: ConjuntoPonderado): number | null {
    if (a.items.size === 0 || b.items.size === 0) return null;

    // Se recorre el conjunto pequeño y se consulta el grande
    const [pequeno, grande] = a.items.size <= b.items.size ? [a, b] : [b, a];

    let interseccion = 0;
    for (const [elemento, peso] of pequeno.items) {
        if (grande.items.has(elemento)) interseccion += peso;
    }

    const union = a.total + b.total - interseccion;
    return union > 0 ? interseccion / union : null;
}

/** Media ponderada de las categorías disponibles. */
function calcularSimilitud(a: Pelicula, b: Pelicula): number | null {
    let suma = 0;
    let pesoTotal = 0;

    for (const categoria of CATEGORIAS) {
        const jaccard = jaccardPonderado(a[categoria], b[categoria]);
        if (jaccard !== null) {
            suma += jaccard * PESOS[categoria];
            pesoTotal += PESOS[categoria];
        }
    }

    return pesoTotal === 0 ? null : suma / pesoTotal;
}

function comparteSaga(a: Pelicula, b: Pelicula): boolean {
    for (const saga of a.sagas) if (b.sagas.has(saga)) return true;
    return false;
}

/** Inserta en una lista ordenada de mayor a menor, manteniendo como máximo `max` elementos. */
function insertarOrdenada(lista: Candidata[], nueva: Candidata, max: number) {
    if (lista.length >= max && nueva.puntuacion <= lista[lista.length - 1]!.puntuacion) return;

    let posicion = lista.length;
    while (posicion > 0 && lista[posicion - 1]!.puntuacion < nueva.puntuacion) posicion--;

    lista.splice(posicion, 0, nueva);
    if (lista.length > max) lista.pop();
}

/* ----------------------------- Carga de datos ------------------------------ */

async function cargarPeliculas(): Promise<Pelicula[]> {
    const obras = await movieService.findAllIdMovies();
    const generos = await movieService.findGenres();
    const personas = await movieService.findPeople();   // feature = persona_<id>_<tipo>
    const sagas = await movieService.findSagas();

    // 1. Conjuntos sin pesos
    type Crudo = Record<Categoria, Set<string>> & { sagas: Set<string> };
    const crudos = new Map<number, Crudo>();

    for (const obra of obras) {
        crudos.set(obra.id_obra, {
            generos: new Set(), directores: new Set(), reparto: new Set(), sagas: new Set(),
        });
    }

    for (const fila of generos) crudos.get(fila.id_obra)?.generos.add(fila.feature);
    for (const fila of sagas) crudos.get(fila.id_obra)?.sagas.add(fila.feature);

    // El rol viene al final del texto: persona_12_actor / persona_5_director
    for (const fila of personas) {
        const crudo = crudos.get(fila.id_obra);
        if (!crudo) continue;

        const feature: string = fila.feature;
        const tipo = feature.slice(feature.lastIndexOf('_') + 1);

        if (tipo === 'director') crudo.directores.add(feature);
        else if (tipo === 'actor') crudo.reparto.add(feature);
    }

    // 2. En cuántas películas aparece cada característica (por categoría)
    const frecuencias = {} as Record<Categoria, Map<string, number>>;
    for (const categoria of CATEGORIAS) frecuencias[categoria] = new Map();

    for (const crudo of crudos.values()) {
        for (const categoria of CATEGORIAS) {
            for (const elemento of crudo[categoria]) {
                const mapa = frecuencias[categoria];
                mapa.set(elemento, (mapa.get(elemento) ?? 0) + 1);
            }
        }
    }

    // 3. Peso IDF: ln(N / frecuencia). Lo raro pesa más, lo común casi nada.
    const totalPeliculas = obras.length;

    return obras.map(obra => {
        const crudo = crudos.get(obra.id_obra)!;
        const pelicula = { id: obra.id_obra, sagas: crudo.sagas } as Pelicula;

        for (const categoria of CATEGORIAS) {
            const items = new Map<string, number>();
            let total = 0;

            for (const elemento of crudo[categoria]) {
                const peso = Math.log(totalPeliculas / frecuencias[categoria].get(elemento)!);
                items.set(elemento, peso);
                total += peso;
            }
            pelicula[categoria] = { items, total };
        }
        return pelicula;
    });
}

/* --------------------------------- Proceso --------------------------------- */

async function calculateJaccard() {
    console.log("Calculando similitud ponderada...");

    try {
        const peliculas = await cargarPeliculas();
        console.log(`Películas encontradas: ${peliculas.length}`);

        // 1. Comparar todas las parejas, guardando solo las mejores candidatas de cada una
        const candidatas: Candidata[][] = peliculas.map(() => []);

        for (let i = 0; i < peliculas.length; i++) {
            for (let j = i + 1; j < peliculas.length; j++) {
                const puntuacion = calcularSimilitud(peliculas[i]!, peliculas[j]!);
                if (puntuacion === null || puntuacion < PUNTUACION_MINIMA) continue;

                insertarOrdenada(candidatas[i]!, { indice: j, puntuacion }, CANDIDATAS_POR_PELICULA);
                insertarOrdenada(candidatas[j]!, { indice: i, puntuacion }, CANDIDATAS_POR_PELICULA);
            }
        }

        // 2. Elegir las K vecinas de cada película, limitando las de su misma saga
        const parejas = new Map<string, SimilitudObra>();

        for (let i = 0; i < peliculas.length; i++) {
            const origen = peliculas[i]!;
            let elegidas = 0;
            let mismaSaga = 0;

            for (const candidata of candidatas[i]!) {
                if (elegidas >= VECINAS_POR_PELICULA) break;

                const destino = peliculas[candidata.indice]!;

                if (comparteSaga(origen, destino)) {
                    if (mismaSaga >= MAX_MISMA_SAGA) continue;
                    mismaSaga++;
                }
                elegidas++;

                // Una misma pareja puede salir en la lista de las dos películas: se guarda una vez
                const menor = Math.min(origen.id, destino.id);
                const mayor = Math.max(origen.id, destino.id);
                parejas.set(`${menor}-${mayor}`, {
                    obra_origen_id: menor,
                    obra_destino_id: mayor,
                    puntuacion: candidata.puntuacion,
                });
            }
        }

        const resultados = [...parejas.values()];

        // 3. Guardar. Se borra justo antes de insertar, con todo ya calculado,
        //    para no dejar la tabla vacía si el cálculo falla.
        await movieService.deleteSimilitudObra();

        for (let i = 0; i < resultados.length; i += TAM_LOTE) {
            const lote = resultados.slice(i, i + TAM_LOTE);
            await movieService.insertByBatchInSimilitudObra(lote);
            console.log(`Guardadas ${Math.min(i + TAM_LOTE, resultados.length)} / ${resultados.length}`);
        }

        console.log("--------------------------------");
        console.log("Cálculo de similitud terminado.");
        console.log(`Películas analizadas: ${peliculas.length}`);
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
