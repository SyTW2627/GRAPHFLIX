import { sql } from "../../src/db/db";

let counter = 0;

// Identificador único para evitar conflictos entre pruebas.
export const uniqueId = () => `${Date.now()}-${++counter}`;

// Evita ejecutar accidentalmente las pruebas contra la BD de desarrollo.
export function assertTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definida");
  }

  const databaseName = new URL(databaseUrl).pathname.replace("/", "");

  if (databaseName !== "graphflix_test") {
    throw new Error(
      `Los tests deben ejecutarse sobre graphflix_test. Base de datos actual: ${databaseName}`
    );
  }
}

// Datos que se pueden indicar al crear una película de prueba.
// Los nombres de géneros, personas y saga reciben un sufijo único.
export interface TestMovieOptions {
  titulo?: string;
  ano_publicacion?: number | null;
  descripcion?: string | null;
  imagen_url?: string | null;
  generos?: string[];
  directores?: string[];
  reparto?: string[];
  saga?: string;
}

// Película creada, con los nombres tal y como se guardaron en la BD.
export interface TestMovie {
  id_obra: number;
  titulo: string;
  ano_publicacion: number | null;
  descripcion: string | null;
  imagen_url: string | null;
  generos: string[];
  directores: string[];
  reparto: string[];
  saga: string | null;
  // ids creados, para poder limpiarlos después
  id_generos: number[];
  id_directores: number[];
  id_actores: number[];
  id_sagas: number[];
}

// Crea una película con sus géneros, director(es), reparto y saga.
export async function createTestMovie(options: TestMovieOptions = {}): Promise<TestMovie> {
  const id = uniqueId();

  const titulo = options.titulo ?? `TestMovie-${id}`;
  const ano = options.ano_publicacion !== undefined ? options.ano_publicacion : 2000;
  const descripcion = options.descripcion !== undefined ? options.descripcion : "Sinopsis de prueba";
  const imagen = options.imagen_url !== undefined ? options.imagen_url : "https://example.com/poster.jpg";

  const [obra] = await sql`
    INSERT INTO obra (titulo, ano_publicacion, descripcion, imagen_url)
    VALUES (${titulo}, ${ano}, ${descripcion}, ${imagen})
    RETURNING id_obra
  `;
  const id_obra = obra!.id_obra as number;

  const movie: TestMovie = {
    id_obra,
    titulo,
    ano_publicacion: ano,
    descripcion,
    imagen_url: imagen,
    generos: [],
    directores: [],
    reparto: [],
    saga: null,
    id_generos: [],
    id_directores: [],
    id_actores: [],
    id_sagas: [],
  };

  for (const base of options.generos ?? []) {
    const nombre = `${base}-${id}`;
    const [g] = await sql`INSERT INTO genero (nombre) VALUES (${nombre}) RETURNING id_genero`;
    await sql`INSERT INTO genero_obra (id_genero, id_obra) VALUES (${g!.id_genero}, ${id_obra})`;
    movie.generos.push(nombre);
    movie.id_generos.push(g!.id_genero);
  }

  for (const base of options.directores ?? []) {
    const nombre = `${base}-${id}`;
    const [p] = await sql`INSERT INTO persona (nombre) VALUES (${nombre}) RETURNING id_persona`;
    await sql`INSERT INTO persona_obra (id_persona, id_obra, tipo) VALUES (${p!.id_persona}, ${id_obra}, 'director')`;
    movie.directores.push(nombre);
    movie.id_directores.push(p!.id_persona);
  }

  for (const base of options.reparto ?? []) {
    const nombre = `${base}-${id}`;
    const [p] = await sql`INSERT INTO persona (nombre) VALUES (${nombre}) RETURNING id_persona`;
    await sql`INSERT INTO persona_obra (id_persona, id_obra, tipo) VALUES (${p!.id_persona}, ${id_obra}, 'actor')`;
    movie.reparto.push(nombre);
    movie.id_actores.push(p!.id_persona);
  }

  if (options.saga) {
    const nombre = `${options.saga}-${id}`;
    const [s] = await sql`INSERT INTO saga (nombre) VALUES (${nombre}) RETURNING id_saga`;
    await sql`INSERT INTO saga_obra (id_saga, id_obra) VALUES (${s!.id_saga}, ${id_obra})`;
    movie.saga = nombre;
    movie.id_sagas.push(s!.id_saga);
  }

  return movie;
}

// Elimina la película y todo lo que se creó con ella.
// Al borrar la obra se borran en cascada sus relaciones, favoritas y similitudes.
export async function deleteTestMovie(movie: TestMovie) {
  await sql`DELETE FROM obra WHERE id_obra = ${movie.id_obra}`;

  for (const id of movie.id_generos) await sql`DELETE FROM genero WHERE id_genero = ${id}`;
  for (const id of [...movie.id_directores, ...movie.id_actores]) {
    await sql`DELETE FROM persona WHERE id_persona = ${id}`;
  }
  for (const id of movie.id_sagas) await sql`DELETE FROM saga WHERE id_saga = ${id}`;
}