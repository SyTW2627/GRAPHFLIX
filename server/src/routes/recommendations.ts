import { Hono } from "hono";
import { sql } from "../db/db";

export const recommendations = new Hono();


// FUNCIÓN PARA CONSTRUIR EL GRAFO
async function construirGrafo(peliculasSemilla: any[], tipoSemilla: string) {

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


// ENDPOINT DE RECOMENDACIONES
recommendations.get("/recommendations/:idUsuario", async (c) => {
    const idUsuario = Number(c.req.param("idUsuario"));
    const limit = Number(c.req.query("limit") ?? 10);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return c.json({ error: "id_usuario debe ser un número entero positivo" }, 400);
    }

    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
        return c.json({ error: "limit debe ser un entero entre 1 y 100" }, 400);
    }

    // Comprobar que el usuario existe
    const usuario = await sql`
        SELECT 1
        FROM usuario
        WHERE id_usuario = ${idUsuario}
    `;

    if (usuario.length === 0) {
        return c.json({ error: "Usuario no encontrado" }, 404);
    }

    // Obtener las películas favoritas del usuario
    const peliculasFavoritas = await sql`
        SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
        FROM favorita f
        JOIN obra o ON o.id_obra = f.id_obra
        WHERE f.id_usuario = ${idUsuario}
    `;

    // CASO A: EL USUARIO TIENE PELÍCULAS FAVORITAS
    if (peliculasFavoritas.length > 0) {
        // Construir el grafo utilizando sus películas favoritas
        const grafo = await construirGrafo(peliculasFavoritas, "favorita");
        return c.json({ isColdStart: false, ...grafo });
    }

    // CASO B: EL USUARIO NO TIENE FAVORITAS (COLD START)
    // Obtener las películas más populares de la aplicación
    const peliculasPopulares = await sql`
        SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url,
               COUNT(f.id_usuario)::int AS total_favoritos
        FROM obra o
        JOIN favorita f ON f.id_obra = o.id_obra
        GROUP BY o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
        ORDER BY total_favoritos DESC, o.titulo ASC
        LIMIT ${limit}
    `;

    // Comprobar si existen películas populares
    if (peliculasPopulares.length === 0) {
        return c.json({ isColdStart: true, nodes: [], edges: [] });
    }

    // Construir el grafo utilizando las películas populares
    const grafo = await construirGrafo(peliculasPopulares, "popular");
    return c.json({ isColdStart: true, ...grafo });
});