import postgres from 'postgres';
import { int } from 'zod';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("ERROR: DATABASE_URL no está configurada en el entorno.");
    process.exit(1);
}

const sql = postgres(connectionString);

async function calculateJaccard() {
    console.log("Calculando Similitud de Jaccard...");

    try {
        //Obras
        const obras = await sql `SELECT id_obra FROM obra`;

        //Caracteristicas
        const generos = await sql `SELECT id_obra, 'genero_' || id_genero AS feature FROM genero_obra`;
        const personas = await sql `SELECT id_obra, 'persona_' || id_persona || '_' || tipo AS feature FROM persona_obra`; 
        const sagas = await sql `SELECT id_obra, 'saga_' || id_saga AS feature FROM saga_obra`;

        //Conjunto de caracteristicas
        const caracteristicas = new Map<number, Set<string>>();

        for (const obra of obras) {
            caracteristicas.set(obra.id_obra, new Set());
        }

        for (const fila of [...generos, ...personas, ...sagas]) {
            caracteristicas.get(fila.id_obra)?.add(fila.feature)
        }

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
                if (jaccard > 0.2) {
                    resultados.push({
                        obra_origen_id: id1,
                        obra_destino_id: id2,
                        puntuacion: jaccard
                    });
                }
            }
        }

        //Guardar por lotes
        const TAM_LOTE = 5000;

        for (let i = 0; i < resultados.length; i+=TAM_LOTE) {
            const lote = resultados.slice(i, i+TAM_LOTE);

            await sql `
                INSERT INTO similitud_obra ${sql(lote, "obra_origen_id", "obra_destino_id", "puntuacion")}
                ON CONFLICT (obra_origen_id, obra_destino_id)
                DO UPDATE SET puntuacion = EXCLUDED.puntuacion
            `;
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