import { Hono } from "hono";
import { authMiddleware } from "../auth/auth.middleware";
import { sql } from "../db/db";
import { construirGrafo } from "../services/recommendation.services";
import { UserRepository } from "../modules/users/UserRepository";
import { UserService } from "../modules/users/UserService";
import { MovieRepository } from "../modules/movies/MovieRepository";
import { MovieService } from "../modules/movies/MovieService";

export const recommendations = new Hono();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);


recommendations.get("/recommendations/:idUsuario", async (c) => {
    const idUsuario = Number(c.req.param("idUsuario"));
    const limit = Number(c.req.query("limit") ?? 10);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return c.json({ error: "id_usuario debe ser un número entero positivo" }, 400);
    }

    try {
        const usuario = await userService.getUserById(idUsuario);

        // Obtener las películas favoritas del usuario
        const peliculasFavoritas = await movieService.findFavoriteMovies(idUsuario);

        // CASO A: EL USUARIO TIENE PELÍCULAS FAVORITAS
        if (peliculasFavoritas.length > 0) {
            const grafo = await construirGrafo(peliculasFavoritas, "favorita");
            return c.json({ isColdStart: false, ...grafo });
        }

        // CASO B: EL USUARIO NO TIENE FAVORITAS (COLD START)
        const peliculasPopulares = await movieService.findPopularMovies(limit);

        if (peliculasPopulares.length === 0) {
            return c.json({ isColdStart: true, nodes: [], edges: [] });
        }

        const grafo = await construirGrafo(peliculasPopulares, "popular");
        return c.json({ isColdStart: true, ...grafo });

    }catch(error) {
        return c.json({error: error}, 500);
    }
});