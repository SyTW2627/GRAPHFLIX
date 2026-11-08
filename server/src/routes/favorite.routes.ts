import { Hono } from "hono";
import { sql } from "../db/db";
import { UserRepository } from "../modules/users/UserRepository";
import { UserService } from "../modules/users/UserService";
import { MovieRepository } from "../modules/movies/MovieRepository";
import { MovieService } from "../modules/movies/MovieService";

export const favorite = new Hono();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

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

/**
 * POST /favorites/batch
 * Guarda un lote de obras favoritas para un usuario.
 * Recibe: un objeto JSON con id_usuario y un array de ids_obras.
 * Devuelve: un mensaje de confirmación y estadísticas sobre la operación (200).
 */
favorite.post("/favorites/batch", async (c) => {
    const body = await c.req.json().catch(() => null);
    const idUsuario = Number(body?.id_usuario);
    const idsObras = body?.ids_obras;

    if (!Number.isInteger(idUsuario) || idUsuario === 0) {
        return c.json({error: "id_usuario debe ser un número entero positivo"}, 400)
    }

    if (!Array.isArray(idsObras) || idsObras.length === 0) {
        return c.json({error: "ids_obras deber ser un array no vacio de IDs"}, 400)
    }

    const obrasValidas = idsObras.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    if (obrasValidas.length === 0) {
        return c.json({error: "Ningun id de obra enviado es válido"}, 400);
    } 

    if (obrasValidas.length < 3) {
        return c.json({error: "Se deben proporcionar al menos 3 obras únicas y validas"}, 400);
    }

    const usuario = await userService.getUserById(idUsuario);

    //Insertar obras recibidas sin duplicados
    const insertados = await movieService.insertFavoriteMovies(obrasValidas, idUsuario);

    return c.json({
        message: "Favoritos guardados correctamente",
        recibidos: idsObras.length,
        validos: obrasValidas.length,
        insertados: insertados.length    
    }, 200);
 
});

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