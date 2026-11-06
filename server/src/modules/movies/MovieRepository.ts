import { sql } from "../../db/db";


export class MovieRepository {
    async getFavoriteMovies(userId: number) {
        const favorites = await sql `
            SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
            FROM favorita f
            JOIN obra o ON o.id_obra = f.id_obra
            WHERE f.id_usuario = ${userId}
        `;

        return favorites;
    }

    async getPopularMovies(limit: number) {
        const populars = await sql `
            SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url,
            COUNT(f.id_usuario)::int AS total_favoritos
            FROM obra o
            JOIN favorita f ON f.id_obra = o.id_obra
            GROUP BY o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
            ORDER BY total_favoritos DESC, o.titulo ASC
            LIMIT ${limit}
        `;

        return populars;
    }

    async getMovies(movies: number[]) {
        const movieData = await sql `
            SELECT id_obra, titulo, ano_publicacion, imagen_url
            FROM obra
            WHERE id_obra = ANY(${movies})
        `;

        return movieData;
    }

    async getSimilarityRelations(movieIds: number[]) {
        const relations = await sql`
            SELECT obra_origen_id, obra_destino_id, puntuacion
            FROM similitud_obra
            WHERE obra_origen_id = ANY(${movieIds})
               OR obra_destino_id = ANY(${movieIds})
        `;

        return relations;
    }
}