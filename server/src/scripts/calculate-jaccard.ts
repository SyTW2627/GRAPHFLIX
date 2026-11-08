import postgres from 'postgres';
import {MovieRepository} from '../modules/movies/MovieRepository';
import {MovieService} from '../modules/movies/MovieService';

const connectionString = process.env.DATABASE_URL;

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

if (!connectionString) {
    console.error("ERROR: DATABASE_URL no está configurada en el entorno.");
    process.exit(1);
}

const sql = postgres(connectionString);

async function calculateJaccard() {
    console.log("Calculando Similitud de Jaccard...");

    try {
        //Obras
        const obras = await movieService.findAllIdMovies();

        const generos = await movieService.findGenres();
        const personas = await movieService.findPeople();
        const sagas = await movieService.findSagas();

        //Conjunto de caracteristicas
        const caracteristicas = new Map<number, Set<string>>();

        for (const obra of obras) caracteristicas.set(obra.id_obra, new Set());

        for (const fila of [...generos, ...personas, ...sagas]) caracteristicas.get(fila.id_obra)?.add(fila.feature);

        //Comparar obra por obra
        const resultados = [];

        for (let i = 0; i < obras.length; i++) {
            const id1 = obras[i]!.id_obra;
            const set1 = caracteristicas.get(id1)!;

            for (let j = i+1; j < obras.length; j++) {
                const id2 = obras[j]!.id_obra;
                const set2 = caracteristicas.get(id2)!;

                //Interseccion
                let interseccion = 0;

                for (const feature of set1) {
                    if (set2.has(feature)) interseccion++;
                }

                //Unión
                const union = set1.size + set2.size - interseccion;
                if (union === 0) continue;

                //Jaccard
                const jaccard = interseccion / union;
                if (jaccard > 0.2) resultados.push({ obra_origen_id: id1, obra_destino_id: id2, puntuacion: jaccard });
            }
        }

        //Guardar por lotes
        const TAM_LOTE = 5000;

        for (let i = 0; i < resultados.length; i+=TAM_LOTE) {
            const lote = resultados.slice(i, i+TAM_LOTE);
            await movieService.insertByBatchInSimilitudObra(lote);
        }

        console.log(`Jaccard terminado. ${resultados.length} similitudes guardadas.`);
    }
    catch(error) {
        console.error("Error calculando Jaccard:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

calculateJaccard();