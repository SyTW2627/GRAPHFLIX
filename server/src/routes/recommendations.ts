import {Hono} from "hono";
import {sql} from "../db/db";

export const recommendations = new Hono();

recommendations.get("/recommendations/:idUsuario", async (c) => {
    const idUsuario = Number(c.req.param("idUsuario"));
    const limit = Number(c.req.query("limit")) || 10;
    
    if (!Number.isInteger(idUsuario) || idUsuario === 0) {
        return c.json({error: "id_usuario debe ser un número entero positivo"}, 400)
    }

    //Verificación de que el usuario existe
    const usuario = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuario[0]) {
        return c.json({error: "Usuario no encontrado"}, 404);
    }

    //Obtención ids de peliculas favoritas del usuario
    const favoritas = await sql`SELECT id_obra FROM favorita WHERE id_usuario = ${idUsuario}`;
    const idsFavoritas = favoritas.map((fav: { id_obra: number }) => fav.id_obra);

    //CASO A: El usuario no añadió peliculas a su lista de favoritas
    if (idsFavoritas.length === 0) {
        const coldStartMovies = await sql `
            SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url, COUNT (f.id_usuario):: int AS total_favoritos
            FROM obra o
            LEFT JOIN favorita f on o.id_obra = f.id_obra
            GROUP BY o.id_obra, o.id_titulo, o.ano_publicacion, o.imagen_url
            ORDER BY total_favoritos DESC, o.titulo ASC
            LIMIT ${limit}
        `;
        return c.json({
            isColdStart: true,
            data: coldStartMovies
        });
    }
    
    //CASO B: 

    const recomendadas = await sql `
        SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url, 
               ROUND(AVG(so.puntuacion)::numeric, 4) AS score_similitud
        FROM similitud_obra so
        JOIN obra o ON id_obra = CASE
            WHEN so.obra_origen_id = ANY(${idsFavoritas})
                THEN so.obra_destino_id
            ELSE so.obra_origen_id
        END

        WHERE (so.obra_origen_id = ANY(${idsFavoritas})) OR so.obra_destino_id = ANY(${idsFavoritas}))
        AND o.id_obra <> ALL(${idsFavoritas})
        GROUP BY o.id_obra
        ORDER BY score_similitud DESC, o.titulo ASC
        LIMIT ${limit}
    `;

    return c.json({
        isColdStart: false,
        data: recomendadas
    });
});