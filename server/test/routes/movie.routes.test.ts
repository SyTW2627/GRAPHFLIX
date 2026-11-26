import { describe, it, expect, beforeAll, afterEach } from "vitest";

import request from "supertest";
import { serve } from "@hono/node-server";

import { app } from "../../src/index";
import { UserRepository } from "../../src/modules/users/UserRepository";
import { MovieRepository } from "../../src/modules/movies/MovieRepository";

import {
  assertTestDatabase,
  createTestMovie,
  deleteTestMovie,
  uniqueId,
  type TestMovie,
  type TestMovieOptions,
} from "../helpers/movie.helpers";
import { sql } from "../../src/db/db";

// Creamos un servidor HTTP a partir de Hono
const server = serve({
  fetch: app.fetch,
  port: 0
});

// Instanciamos las dependencias reales
const userRepository = new UserRepository();
const movieRepository = new MovieRepository();

// Guardamos lo creado durante cada prueba
let createdMovies: TestMovie[] = [];
let createdUserIds: number[] = [];

// Crea una película de prueba y la registra para su limpieza.
const addMovie = async (options: TestMovieOptions = {}) => {
  const movie = await createTestMovie(options);
  createdMovies.push(movie);
  return movie;
};

// Crea un usuario de prueba y lo registra para su limpieza.
const addUser = async () => {
  const id = uniqueId();

  const user = await userRepository.create({
    nombre_usuario: `test-${id}`,
    correo: `test-${id}@graphflix.com`,
    password: "hash_de_prueba",
  });

  createdUserIds.push(user.id_usuario);
  return user;
};

// Registra un usuario mediante la API, inicia sesión y devuelve un agente
// que conserva la cookie de sesión.
const createAuthenticatedAgent = async () => {
  const id = uniqueId();

  const credentials = {
    nombre_usuario: `test-${id}`,
    correo: `test-${id}@graphflix.com`,
    password: "password123",
  };

  const registerResponse = await request(server)
    .post("/users/register")
    .send(credentials);

  if (registerResponse.status !== 201) {
    throw new Error(`Error registrando usuario: ${JSON.stringify(registerResponse.body)}`);
  }

  // se borrará en el afterEach
  createdUserIds.push(registerResponse.body.id_usuario);

  const agent = request.agent(server);

  const loginResponse = await agent
    .post("/users/login")
    .send({ correo: credentials.correo, password: credentials.password });

  if (loginResponse.status !== 200) {
    throw new Error(`Error iniciando sesión: ${JSON.stringify(loginResponse.body)}`);
  }

  return agent;
};

describe("Movie Routes", () => {

  beforeAll(() => {
    assertTestDatabase();

    if (!process.env.TOKEN_SECRET_KEY) {
      throw new Error("TOKEN_SECRET_KEY no está definida");
    }
  });

  afterEach(async () => {
    // al borrar el usuario se borran también sus favoritas
    for (const id of createdUserIds) {
      await userRepository.delete(id);
    }
    createdUserIds = [];

    for (const movie of createdMovies) {
      await deleteTestMovie(movie);
    }
    createdMovies = [];
  });

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  describe("GET /movies/search", () => {

    it("debería encontrar una película por su título", async () => {
      const movie = await addMovie();

      const response = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id_obra).toBe(movie.id_obra);
      expect(response.body[0].titulo).toBe(movie.titulo);
    });

    it("debería devolver solo los campos básicos de la película", async () => {
      const movie = await addMovie();

      const response = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo });

      expect(response.body[0]).toHaveProperty("id_obra");
      expect(response.body[0]).toHaveProperty("titulo");
      expect(response.body[0]).toHaveProperty("ano_publicacion");
      expect(response.body[0]).toHaveProperty("imagen_url");
      expect(response.body[0]).not.toHaveProperty("descripcion");
    });

    it("debería devolver una lista vacía si no hay coincidencias", async () => {
      const response = await request(server)
        .get("/movies/search")
        .query({ q: `inexistente-${uniqueId()}` });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("debería filtrar por año", async () => {
      const movie = await addMovie({ ano_publicacion: 1985 });

      const found = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo, year: 1985 });
      const notFound = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo, year: 1986 });

      expect(found.body).toHaveLength(1);
      expect(notFound.body).toHaveLength(0);
    });

    it("debería filtrar por rango de años", async () => {
      const movie = await addMovie({ ano_publicacion: 1990 });

      const inRange = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo, from: 1980, to: 2000 });
      const outOfRange = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo, from: 2001 });

      expect(inRange.body).toHaveLength(1);
      expect(outOfRange.body).toHaveLength(0);
    });

    it("debería filtrar por género", async () => {
      const movie = await addMovie({ generos: ["Drama"] });
      const other = await addMovie({ generos: ["Comedia"] });

      const response = await request(server)
        .get("/movies/search")
        .query({ q: "TestMovie-", genre: movie.generos[0] });

      const ids = response.body.map((m: { id_obra: number }) => m.id_obra);

      expect(ids).toContain(movie.id_obra);
      expect(ids).not.toContain(other.id_obra);
    });

    it("debería filtrar por director", async () => {
      const movie = await addMovie({ directores: ["Director"] });
      const other = await addMovie({ directores: ["Otro"] });

      const response = await request(server)
        .get("/movies/search")
        .query({ q: "TestMovie-", director: movie.directores[0] });

      const ids = response.body.map((m: { id_obra: number }) => m.id_obra);

      expect(ids).toContain(movie.id_obra);
      expect(ids).not.toContain(other.id_obra);
    });

    it("debería filtrar por actor", async () => {
      const movie = await addMovie({ reparto: ["Actor"] });
      const other = await addMovie({ reparto: ["Otro"] });

      const response = await request(server)
        .get("/movies/search")
        .query({ q: "TestMovie-", actor: movie.reparto[0] });

      const ids = response.body.map((m: { id_obra: number }) => m.id_obra);

      expect(ids).toContain(movie.id_obra);
      expect(ids).not.toContain(other.id_obra);
    });

    it("no debería confundir un actor con un director", async () => {
      const movie = await addMovie({ directores: ["Persona"] });

      const response = await request(server)
        .get("/movies/search")
        .query({ q: movie.titulo, actor: movie.directores[0] });

      expect(response.body).toHaveLength(0);
    });

    it("debería filtrar por saga", async () => {
      const movie = await addMovie({ saga: "Saga" });
      const other = await addMovie({ saga: "Otra" });

      const response = await request(server)
        .get("/movies/search")
        .query({ q: "TestMovie-", saga: movie.saga });

      const ids = response.body.map((m: { id_obra: number }) => m.id_obra);

      expect(ids).toContain(movie.id_obra);
      expect(ids).not.toContain(other.id_obra);
    });

    it.each([
      ["year", "abc"],
      ["year", "0"],
      ["from", "-1"],
      ["to", "1.5"],
    ])("debería rechazar %s con el valor %s", async (param, value) => {
      const response = await request(server)
        .get("/movies/search")
        .query({ [param]: value });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toBe(`${param} debe ser un entero positivo`);
    });

    it("debería rechazar un rango donde from es mayor que to", async () => {
      const response = await request(server)
        .get("/movies/search")
        .query({ from: 2000, to: 1990 });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("from no puede ser mayor que to");
    });
  });

  // --------------------------------------------------
  // POPULAR
  // --------------------------------------------------

  describe("GET /movies/popular", () => {
    it("debería devolver 200 aunque no haya sesión iniciada", async () => {
      const response = await request(server).get("/movies/popular");

      expect(response.status).toBe(200);
    });

    it("debería devolver las películas populares", async () => {
      const user = await addUser();
      const movie = await addMovie();
      await sql`INSERT INTO favorita (id_usuario, id_obra) VALUES (${user.id_usuario}, ${movie.id_obra})`;

      const response = await request(server).get("/movies/popular?limit=100");

      expect(response.status).toBe(200);
      expect(
        response.body.some((m: { id_obra: number }) => m.id_obra === movie.id_obra)
      ).toBe(true);
    });

    it("debería poner antes las películas con más favoritos", async () => {
      const user1 = await addUser();
      const user2 = await addUser();
      const lessPopular = await addMovie();
      const popular = await addMovie();

      await sql`INSERT INTO favorita (id_usuario, id_obra) VALUES (${user1.id_usuario}, ${lessPopular.id_obra})`;
      await sql`INSERT INTO favorita (id_usuario, id_obra) VALUES (${user1.id_usuario}, ${popular.id_obra}), (${user2.id_usuario}, ${popular.id_obra})`;

      const response = await request(server).get("/movies/popular?limit=100");
      const ids = response.body.map((m: { id_obra: number }) => m.id_obra);

      expect(ids.indexOf(popular.id_obra)).not.toBe(-1);
      expect(ids.indexOf(lessPopular.id_obra)).not.toBe(-1);
      expect(ids.indexOf(popular.id_obra)).toBeLessThan(ids.indexOf(lessPopular.id_obra));
    });
  });

  // --------------------------------------------------
  // DETALLE DE UNA PELÍCULA
  // --------------------------------------------------

  describe("GET /movies/:id_obra", () => {

    it("debería devolver los detalles de la película", async () => {
      const movie = await addMovie({
        generos: ["Drama", "Accion"],
        directores: ["Director"],
        reparto: ["Actor1", "Actor2"],
        saga: "Saga",
      });

      const response = await request(server).get(`/movies/${movie.id_obra}`);

      expect(response.status).toBe(200);
      expect(response.body.id_obra).toBe(movie.id_obra);
      expect(response.body.titulo).toBe(movie.titulo);
      expect(response.body.ano_publicacion).toBe(movie.ano_publicacion);
      expect(response.body.descripcion).toBe(movie.descripcion);
      expect(response.body.imagen_url).toBe(movie.imagen_url);
      expect([...response.body.generos].sort()).toEqual([...movie.generos].sort());
      expect(response.body.directores).toEqual(movie.directores);
      expect([...response.body.reparto].sort()).toEqual([...movie.reparto].sort());
      expect(response.body.sagas).toEqual([movie.saga]);
    });

    it("debería devolver listas vacías si la película no tiene relaciones", async () => {
      const movie = await addMovie();

      const response = await request(server).get(`/movies/${movie.id_obra}`);

      expect(response.status).toBe(200);
      expect(response.body.generos).toEqual([]);
      expect(response.body.directores).toEqual([]);
      expect(response.body.reparto).toEqual([]);
      expect(response.body.sagas).toEqual([]);
    });

    it.each(["abc", "0", "-5", "1.5"])(
      "debería rechazar un ID no válido (%s)",
      async (id) => {
        const response = await request(server).get(`/movies/${id}`);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(response.body.error.message).toBe("ID inválido");
      }
    );

    it("debería devolver 404 si la película no existe", async () => {
      const response = await request(server).get("/movies/2147483647");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

});