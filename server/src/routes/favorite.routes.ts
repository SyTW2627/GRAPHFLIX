import { Hono } from "hono";
import { sql } from "../db/db";
import { UserRepository } from "../modules/users/UserRepository";
import { UserService } from "../modules/users/UserService";
import { MovieRepository } from "../modules/movies/MovieRepository";
import { MovieService } from "../modules/movies/MovieService";
import { ValidationError, NotFoundError } from "../errors/AppError";
import { authMiddleware } from "../auth/auth.middleware";
import { MapRepository } from "../modules/map/MapRepository";
import { construirGrafo } from "../services/createGraph/buildgraph";

export const favorite = new Hono<{ Variables: { id_usuario: number } }>();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

const mapRepository = new MapRepository();

async function reconstruirMapaUsuario(idUsuario: number) {
    const obrasFavoritas = await movieService.findFavoriteMovies(idUsuario);
    const maps = await mapRepository.findByUserId(idUsuario);
    const mapaRecomendacion = maps.find(m => m.tipo_mapa === 'peliculas' || m.tipo_mapa === 'recommendation');

    if (obrasFavoritas.length === 0) {
        if (mapaRecomendacion) {
            await mapRepository.delete(mapaRecomendacion.id_mapa);
        }
        return;
    }

    const tipoMapa = mapaRecomendacion?.tipo_mapa || "peliculas";
    const nombreMapa = mapaRecomendacion?.nombre_mapa || "Mapa de Recomendaciones";

    if (mapaRecomendacion) {
        await mapRepository.delete(mapaRecomendacion.id_mapa);
    }

    await construirGrafo(
        obrasFavoritas,
        idUsuario,
        tipoMapa,
        nombreMapa
    );
}

// post
favorite.post("/favorites", authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => null);
    const idUsuario = c.get("id_usuario");
    const idObra = Number(body?.id_obra);

    if (idUsuario <= 0 || idObra <= 0) {
        throw new ValidationError("id_usuario e id_obra deben ser enteros positivos");
    }

    const usuarios = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuarios[0]) throw new NotFoundError("Usuario");

    const obras = await sql`SELECT 1 FROM obra WHERE id_obra = ${idObra}`;
    if (!obras[0]) throw new NotFoundError("Obra");
 
    const ins = await sql `INSERT INTO favorita (id_usuario, id_obra)
                           VALUES (${idUsuario}, ${idObra})
                           ON CONFLICT DO NOTHING
                           RETURNING id_obra`;
 
    if (ins.length === 0) {
        return c.json({ message: "Ya se encuentra en favoritos" }, 200);
    }

    // Reconstruir
    await reconstruirMapaUsuario(idUsuario);
    
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
    const idUsuario = c.get("id_usuario");
    const idsObras = body?.ids_obras;

    if (!Number.isInteger(idUsuario) || idUsuario === 0) {
        throw new ValidationError("id_usuario debe ser un número entero positivo");
    }

    if (!Array.isArray(idsObras) || idsObras.length === 0) {
        throw new ValidationError("ids_obras deber ser un array no vacio de IDs");
    }

    const obrasValidas = idsObras.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    if (obrasValidas.length === 0) {
        throw new ValidationError("Ningun id de obra enviado es válido");
    } 

    if (obrasValidas.length < 3) {
        throw new ValidationError("Se deben proporcionar al menos 3 obras únicas y validas");
    }

    const usuario = await userService.getUserById(idUsuario);

    //Insertar obras recibidas sin duplicados
    const insertados = await movieService.insertFavoriteMovies(obrasValidas, idUsuario);

    if (insertados.length > 0) {
        await reconstruirMapaUsuario(idUsuario);
    }

    return c.json({
        message: "Favoritos guardados correctamente",
        recibidos: idsObras.length,
        validos: obrasValidas.length,
        insertados: insertados.length    
    }, 200);
 
});

// get
favorite.get("/favorites/:idUsuario", async (c) => {
    const idUsuario = c.get("id_usuario");

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        throw new ValidationError("id usuario debe ser un entero positivo");
    }

    const usuarios = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuarios[0]) throw new NotFoundError("Usuario");

    const favoritas = await sql`SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
                                FROM favorita f
                                JOIN obra o ON o.id_obra = f.id_obra
                                WHERE f.id_usuario = ${idUsuario}
                                ORDER BY o.titulo`;
    
    return c.json(favoritas);
})

// delete
favorite.delete("/favorites/:idUsuario/:idObra", async (c) => {
    const idUsuario = c.get("id_usuario");
    const idObra = Number(c.req.param("idObra"));

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        throw new ValidationError("id usuario debe ser un entero positivo");
    }

    if (!Number.isInteger(idObra) || idObra <= 0) {
        throw new ValidationError("id obra debe ser un entero positivo");
    }

    const obras = await sql`SELECT 1 FROM obra WHERE id_obra = ${idObra}`;
    if (!obras[0]) throw new NotFoundError("Obra");

    const usuarios = await sql`SELECT 1 FROM usuario WHERE id_usuario = ${idUsuario}`;
    if (!usuarios[0]) throw new NotFoundError("Usuario");

    const borradas = await sql`DELETE from favorita
                               WHERE id_usuario = ${idUsuario} AND id_obra = ${idObra}
                               RETURNING id_obra`;
    
    if (borradas.length === 0) {
        throw new NotFoundError("Favorito");
    }

    // Reconstruir 
    await reconstruirMapaUsuario(idUsuario);

    return c.json({ message: "Eliminada de favoritos" });
})