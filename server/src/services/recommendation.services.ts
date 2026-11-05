import { sql } from "../db/db";

export async function construirGrafo(peliculasSemilla: any[], tipoSemilla: string) {
    // Obtener los IDs de las películas semilla
    const idsSemilla = peliculasSemilla.map(p => Number(p.id_obra));

    // Buscar las relaciones de similitud de las películas semilla
    const relaciones = await sql`
        SELECT obra_origen_id, obra_destino_id, puntuacion
        FROM similitud_obra
        WHERE obra_origen_id = ANY(${idsSemilla})
           OR obra_destino_id = ANY(${idsSemilla})
    `;

    // Obtener los IDs de todas las películas relacionadas
    const idsRelacionados = relaciones.flatMap(r => [
        Number(r.obra_origen_id),
        Number(r.obra_destino_id)
    ]);

    // Eliminar duplicados y excluir las películas semilla
    const idsUnicos = [...new Set(idsRelacionados)];
    const idsRecomendados = idsUnicos.filter(id => !idsSemilla.includes(id));

    // Obtener los datos de las películas recomendadas
    let peliculasRecomendadas: any[] = [];

    if (idsRecomendados.length > 0) {
        peliculasRecomendadas = await sql`
            SELECT id_obra, titulo, ano_publicacion, imagen_url
            FROM obra
            WHERE id_obra = ANY(${idsRecomendados})
        `;
    }

    // Construir los nodos del grafo
    const nodes = [
        ...peliculasSemilla.map(p => ({ ...p, tipo: tipoSemilla })),
        ...peliculasRecomendadas.map(p => ({ ...p, tipo: "recomendada" }))
    ];

    // Construir las aristas del grafo
    const edges = relaciones.map(r => ({
        source: Number(r.obra_origen_id),
        target: Number(r.obra_destino_id),
        weight: Number(r.puntuacion)
    }));

    return { nodes, edges };
}
