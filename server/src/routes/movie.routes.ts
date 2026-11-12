import { Hono } from "hono";
import { sql } from "../db/db";
import { ValidationError } from "../errors/AppError"; 
import { MovieRepository } from "../modules/movies/MovieRepository";
import { MovieService } from "../modules/movies/MovieService";


export const movies = new Hono();

const movieRepository = new MovieRepository();
const movieService = new MovieService(movieRepository);

function esEnteroPositivo(valor?: string): Boolean {
    if (valor === undefined) return true;
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0;
}

// get query search?q= &genre= &year= &from= &to= &director= &actor= &saga=
movies.get("/movies/search", async (c) => {
    const q = c.req.query("q"); 
    const genre = c.req.query("genre");
    const year = c.req.query("year");
    const from = c.req.query("from");
    const to = c.req.query("to");
    const director = c.req.query("director");
    const actor = c.req.query("actor");
    const saga = c.req.query("saga");

    if (!esEnteroPositivo(year)) throw new ValidationError("year debe ser un entero positivo");
    if (!esEnteroPositivo(from)) throw new ValidationError("from debe ser un entero positivo");
    if (!esEnteroPositivo(to)) throw new ValidationError("to debe ser un entero positivo");

    if (from !== undefined && to !== undefined && Number(from) > Number(to)) {
       throw new ValidationError("from no puede ser mayor que to");
    }

    const resultados = await sql`SELECT o.id_obra, o.titulo, o.ano_publicacion, o.imagen_url
                                 from obra o
                                 WHERE (${q}::text IS NULL OR o.titulo ILIKE '%' || ${q}::text || '%')
                                 AND (${year}::int IS NULL OR o.ano_publicacion = ${year}::int)
                                 AND (${from}::int IS NULL OR o.ano_publicacion >= ${from}::int)
                                 AND (${to}::int IS NULL OR o.ano_publicacion <= ${to}::int)
                                 AND (${genre}::text IS NULL OR EXISTS (
                                         SELECT 1 FROM genero_obra go
                                         JOIN genero g ON g.id_genero = go.id_genero
                                         WHERE go.id_obra = o.id_obra AND g.nombre ILIKE ${genre}::text))
                                 AND (${director}::text IS NULL OR EXISTS (
                                         SELECT 1 FROM persona_obra po
                                         JOIN persona p ON p.id_persona = po.id_persona
                                         WHERE po.id_obra = o.id_obra AND po.tipo = 'director'
                                         AND p.nombre ILIKE '%' || ${director}::text || '%'))
                                 AND (${actor}::text IS NULL OR EXISTS (
                                         SELECT 1 FROM persona_obra po
                                         JOIN persona p ON p.id_persona = po.id_persona
                                         WHERE po.id_obra = o.id_obra AND po.tipo = 'actor'
                                         AND p.nombre ILIKE '%' || ${actor}::text || '%'))
                                 AND (${saga}::text IS NULL OR EXISTS (
                                         SELECT 1 FROM saga_obra so
                                         JOIN saga s ON s.id_saga = so.id_saga
                                         WHERE so.id_obra = o.id_obra
                                         AND s.nombre ILIKE '%' || ${saga}::text || '%'))
                                 ORDER BY o.titulo`;
    return c.json(resultados, 200);
})

movies.get("/movies/:id_obra", async (c) => {
  const id_obra = Number(c.req.param("id_obra"));
  
  if (!Number.isInteger(id_obra) || id_obra <= 0) {
    throw new ValidationError("ID inválido");
  }

  const obra = await movieService.findMovies([id_obra]);
  return c.json(obra, 200);
});