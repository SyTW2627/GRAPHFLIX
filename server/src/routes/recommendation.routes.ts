import { Hono } from "hono";
import { authMiddleware } from "../auth/auth.middleware";
import { construirGrafo } from "../services/createGraph/buildgraph";
import { UserRepository } from "../modules/users/UserRepository";
import { UserService } from "../modules/users/UserService";
import { MovieRepository } from "../modules/movies/MovieRepository";
import { MovieService } from "../modules/movies/MovieService";
import { ValidationError } from "../errors/AppError";

export const recommendations = new Hono();

const userService = new UserService(new UserRepository());
const movieService = new MovieService(new MovieRepository());

recommendations.get("/recommendations/:idUsuario", authMiddleware, async (c) => {
    const idUsuario = Number(c.req.param("idUsuario"));
    const limit = Number(c.req.query("limit") ?? 10);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        throw new ValidationError("id_usuario debe ser un número entero positivo");
    }

    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
        throw new ValidationError("limit debe ser un entero entre 1 y 100");
    }

    await userService.getUserById(idUsuario);

    // CASO A: El usuario tiene películas favoritas
    const peliculasFavoritas = await movieService.findFavoriteMovies(idUsuario);

    if (peliculasFavoritas.length > 0) {
        const grafo = await construirGrafo(
            peliculasFavoritas,
            idUsuario,
            "peliculas",
            "Mapa de Recomendaciones"
        );
        return c.json({ isColdStart: false, ...grafo });
    }

    // CASO B: Cold Start (sin favoritas -> películas populares)
    const peliculasPopulares = await movieService.findPopularMovies(limit);

    if (peliculasPopulares.length === 0) {
        return c.json({ isColdStart: true, nodes: [], edges: [] });
    }

    const grafo = await construirGrafo(
        peliculasPopulares,
        idUsuario,
        "peliculas",
        "Mapa de Películas Populares"
    );
    return c.json({ isColdStart: true, ...grafo });
});