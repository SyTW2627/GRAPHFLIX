import { Hono } from "hono";
import { sql } from "../db/db";

export const favorite = new Hono();

// post
favorite.post("/favorites", async (c) => {
    const body = await c.req.json().catch(() => null);
    const idUsuario = Number(body?.id_usuario);
    const idObra = Number(body?.id_obra);

    if (idUsuario <= 0 || idObra <= 0) {
        return c.json({ error: "id_usuario e id_obra deben ser enteros positivos" }, 400);
    }

    const usuarios = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuarios[0]) return c.json({ error: "Usuario no encontrado" }, 404);

    const obras = await sql`SELECT 1 FROM obra WHERE id_obra = ${idObra}`;
    if (!obras[0]) return c.json({ error: "Obra no encontrada" }, 404);
 
    const ins = await sql `INSERT INTO favorita (id_usuario, id_obra)
                           VALUES (${idUsuario}, ${idObra})
                           ON CONFLICT DO NOTHING`;
 
    if (ins.length === 0) {
        return c.json({ message: "Ya se encuentra en favoritos" }, 200);
    }
    
    return c.json({ message: "Se ha añadido a favoritos"});
})

// get
favorite.get("/favorites/:idUsuario", async (c) => {
    const idUsuario = Number(c.req.param("idUsuario"));

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return c.json({error: "id usuario debe ser un entero positivo"}, 400)
    }

    const usuarios = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuarios[0]) return c.json({ error: "Usuario no encontrado" }, 404);

    const favoritas = await sql`SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
                                FROM favorita f
                                JOIN obra o ON o.id_obra = f.id_obra
                                WHERE f.id_usuario = ${idUsuario}
                                ORDER BY o.titulo`;
    
    // if (favoritas.length === 0) return c.json({message: "No hay peliculas en favoritos"});
    return c.json(favoritas);
})

// delete
favorite.delete("favorites/:idUsuario/:idObra", async (c) => {
    const idUsuario = Number(c.req.param("idUsuario"));
    const idObra = Number(c.req.param("idObra"));

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return c.json({error: "id usuario debe ser un entero positivo"}, 400)
    }

    if (!Number.isInteger(idObra) || idObra <= 0) {
        return c.json({error: "id obra debe ser un entero positivo"}, 400)
    }

    const obras = await sql`SELECT 1 FROM obra WHERE id_obra = ${idObra}`;
    if (!obras[0]) return c.json({ error: "Obra no encontrada" }, 404);

    const usuarios = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuarios[0]) return c.json({ error: "Usuario no encontrado" }, 404);

    const borradas = await sql`DELETE from favorita
                               WHERE id_usuario = ${idUsuario} AND id_obra = ${idObra}
                               RETURNING id_obra`;
    
    if (borradas.length === 0) {
        return c.json({ error: "No estaba en favoritos" }, 404);
    }
    return c.json({ message: "Eliminada de favoritos" });
})