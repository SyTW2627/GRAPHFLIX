import { sql } from "../../db/db"; 
import type {Pelicula} from "../../services/createGraph/type-model";
import type { MovieDetail } from "./movie.model";

export class MovieRepository {
    async getFavoriteMovies(userId: number): Promise<Pelicula[]> {
        const favorites = await sql<Pelicula[]> `
            SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
            FROM favorita f
            JOIN obra o ON o.id_obra = f.id_obra
            WHERE f.id_usuario = ${userId}
        `;

        return favorites;
    }

    async getPopularMovies(limit: number): Promise<Pelicula[]> {
        const populars = await sql<Pelicula[]> `
            SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url,
            COUNT(f.id_usuario)::int AS total_favoritos
            FROM obra o
            LEFT JOIN favorita f ON f.id_obra = o.id_obra
            WHERE o.imagen_url IS NOT NULL
            GROUP BY o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
            ORDER BY total_favoritos DESC, o.titulo ASC
            LIMIT ${limit}
        `;

        return populars;
    }

    async getMovies(movies: number[]): Promise<Pelicula[]> {
        const movieData = await sql<Pelicula[]> `
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

    async insertMovies( movieIds: number[], userId: number): Promise<Pelicula[]> {
        const insertados = await sql<Pelicula[]> `
            INSERT INTO favorita (id_usuario, id_obra)
            SELECT ${userId}, obra.id_obra
            FROM obra
            WHERE obra.id_obra IN ${sql(movieIds)}
            ON CONFLICT (id_usuario, id_obra) DO NOTHING
            RETURNING id_obra
        `;
        return insertados;
    }

    async getGenres() {
        const generos = await sql `SELECT id_obra, 'genero_' || id_genero AS feature FROM genero_obra`;
        return generos;
    }

    async getPeople() {
        const personas = await sql `SELECT id_obra, 'persona_' || id_persona || '_' || tipo AS feature FROM persona_obra`;
        return personas;
    }

    async getSagas() {
        const sagas = await sql `SELECT id_obra, 'saga_' || id_saga AS feature FROM saga_obra`;
        return sagas;
    }

    async getAllIdMovies(): Promise<Pelicula[]> {
        const allMovies = await sql<Pelicula[]> `SELECT id_obra FROM obra`;
        return allMovies;
    }

    async insertByBatchInSimilitudObra(lote: { obra_origen_id: number, obra_destino_id: number, puntuacion: number }[]) {
        const insertados = await sql `
            INSERT INTO similitud_obra ${sql(lote, "obra_origen_id", "obra_destino_id", "puntuacion")}
            ON CONFLICT (obra_origen_id, obra_destino_id)
            DO UPDATE SET puntuacion = EXCLUDED.puntuacion
        `;
        return insertados;
    }

    async deleteSimilitudObra() {
        const del = await sql`
            DELETE FROM similitud_obra;
        `;
    }

    async getMovieDetails(movieId: number): Promise<MovieDetail | null> {
        const [obra] = await sql`
            SELECT id_obra, titulo, ano_publicacion, descripcion, imagen_url
            FROM obra
            WHERE id_obra = ${movieId}
        `;

        if (!obra) return null;

        const generos = await sql`
            SELECT g.nombre AS genero
            FROM genero_obra go
            JOIN genero g ON g.id_genero = go.id_genero
            WHERE go.id_obra = ${movieId}
        `;
        
        const personas = await sql`
            SELECT p.nombre, po.tipo
            FROM persona_obra po
            JOIN persona p ON p.id_persona = po.id_persona
            WHERE po.id_obra = ${movieId}
        `;

        const sagas = await sql`
            SELECT s.nombre AS saga
            FROM saga_obra so
            JOIN saga s ON s.id_saga = so.id_saga
            WHERE so.id_obra = ${movieId}
        `;

        return {
            id_obra: obra.id_obra,
            titulo: obra.titulo,
            ano_publicacion: obra.ano_publicacion,
            descripcion: obra.descripcion,
            imagen_url: obra.imagen_url,
            generos: generos.map(g => g.genero),
            directores: personas.filter(p => p.tipo === 'director').map(p => p.nombre),
            reparto: personas.filter(p => p.tipo === 'actor').map(p => p.nombre),
            sagas: sagas.map(s => s.saga)
        }  as MovieDetail;
    } 
       
}