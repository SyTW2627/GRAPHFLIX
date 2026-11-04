import { startTime } from 'hono/timing';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("ERROR: DATABASE_URL no está configurada en el entorno.");
    process.exit(1);
}

const sql = postgres(connectionString);

async function calculateJaccard() {
    console.log("Calculando Similitud de Jaccard...");

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS similitud_obra (
                obra_origen_id INTEGER NOT NULL,
                obra_destino_id INTEGER NOT NULL,
                puntuacion DOUBLE PRECISION NOT NULL,
                PRIMARY KEY (obra_origen_id, obra_destino_id),
                CONSTRAINT fk_obra_origen FOREIGN KEY (obra_origen_id) 
                    REFERENCES obra(id_obra) ON DELETE CASCADE,
                CONSTRAINT fk_obra_destino FOREIGN KEY (obra_destino_id) 
                    REFERENCES obra(id_obra) ON DELETE CASCADE
            );
        `;

        console.log("Carga de caracteristicas...");
        const generos= await sql`SELECT id_obra, 'genero_' || id_genero AS caracteristica FROM genero_obra`;
        const personas = await sql`SELECT id_obra, 'persona_' || id_persona || '_' || tipo AS caracteristica FROM persona_obra`;
        const sagas = await sql`SELECT id_obra, 'saga_' || id_saga AS caracteristica FROM saga_obra`;

        const obraCaracteristicas = new Map<number, Set<string>>();
        const caracteristicaObras = new Map<string, number[]>();

        function addFeature(obraId: number, feature: string) {
            if (!obraCaracteristicas.has(obraId)) {
                obraCaracteristicas.set(obraId, new Set());
            }
            obraCaracteristicas.get(obraId)!.add(feature);

            if (!caracteristicaObras.has(feature)) {
                caracteristicaObras.set(feature, []);
            }
            caracteristicaObras.get(feature)!.push(obraId);
        }

        for (const g of generos)  addFeature(g.id_obra, g.caracteristica);
        for (const p of personas) addFeature(p.id_obra, p.caracteristica);
        for (const s of sagas)   addFeature(s.id_obra, s.caracteristica);

        console.log(`Procesando caracteristicas de ${obraCaracteristicas.size} obras...`);
        
        const pairCounts = new Map<string, number>();

        for (const [feature, obras] of caracteristicaObras.entries()) {
            if (feature.startsWith('genero_') && obras.length > 1000) continue;

            for (let i = 0; i < obras.length; i++) {
                for (let j = i + 1; j < obras.length; j++) {
                    const o1 = Math.min(obras[i], obras[j]);
                    const o2 = Math.max(obras[i], obras[j]);
                    const key = `${o1},${o2}`;
                    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
                }
            }
        }

        const rowsToInsert: { obra_origen_id: number; obra_destino_id: number; puntuacion: number }[] = [];

        for (const [key] of pairCounts.entries()) {
            const [o1, o2] = key.split(',').map(Number);
            const set1 = obraCaracteristicas.get(o1)!;
            const set2 = obraCaracteristicas.get(o2)!;

            let intersectionSize = 0;
            for (const item of set1) {
                if (set2.has(item)) intersectionSize++;
            }

            const unionCount = set1.size + set2.size - intersectionSize;
            const score = intersectionSize / unionCount;

            //Almacenar solo si la similitud es mayor al 0.05
            if (score > 0.05) {
                rowsToInsert.push({
                    obra_origen_id: o1,
                    obra_destino_id: o2,
                    puntuacion: score
                });
            }
        }
        console.log(`Insertando ${rowsToInsert.length} similitudes en PostgreSQL...`);

        const CHUNK_SIZE = 5000;
        for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
            const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
            await sql`
                INSERT INTO similitud_obra ${sql(chunk, "obra_origen_id", "obra_destino_id", "puntuacion")}
                ON CONFLICT (obra_origen_id, obra_destino_id)
                DO UPDATE SET puntuacion = EXCLUDED.puntuacion;
            `;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log("Similitud de Jaccard calculada y almacenada en la base de datos.");

    } catch (error) {
        console.error("ERROR: Ocurrió un error al calcular la similitud de Jaccard.", error);
        process.exit(1);

    }finally {
        await sql.end();
        process.exit(0);
    }
}

calculateJaccard();