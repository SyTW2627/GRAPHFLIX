import { describe, it, expect, beforeAll, afterEach } from "vitest";

import request from "supertest";
import { serve } from "@hono/node-server";

import { app } from "../../src/index";
import { UserRepository } from "../../src/modules/users/UserRepository";
import { MovieRepository } from "../../src/modules/movies/MovieRepository";
import { MapRepository } from "../../src/modules/map/MapRepository";

import {
  assertTestDatabase,
  createTestMovie,
  deleteTestMovie,
  uniqueId,
  type TestMovie,
} from "../helpers/movie.helpers";

// Creamos un servidor HTTP a partir de Hono
const server = serve({
  fetch: app.fetch,
  port: 0
});

// Instanciamos las dependencias reales
const userRepository = new UserRepository();
const movieRepository = new MovieRepository();
const mapRepository = new MapRepository();

// Guardamos lo creado durante cada prueba
let createdMovies: TestMovie[] = [];
let createdUserIds: number[] = [];

// Crea una película de prueba
const addMovie = async (options = {}) => {
  const movie = await createTestMovie(options);
  createdMovies.push(movie);
  return movie;
};

// Crea un usuario directamente en la BD
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

// Registra un usuario con la API, inicia sesión y devuelve el agente
const createAuthenticatedUser = async () => {
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

  createdUserIds.push(registerResponse.body.id_usuario);

  const agent = request.agent(server);

  const loginResponse = await agent
    .post("/users/login")
    .send({ correo: credentials.correo, password: credentials.password });

  if (loginResponse.status !== 200) {
    throw new Error(`Error iniciando sesión: ${JSON.stringify(loginResponse.body)}`);
  }

  return { agent, user: registerResponse.body };
};

describe("Recommendation Routes", () => {

  beforeAll(() => {
    assertTestDatabase();

    if (!process.env.TOKEN_SECRET_KEY) {
      throw new Error("TOKEN_SECRET_KEY no está definida");
    }
  });

  afterEach(async () => {
    // al borrar el usuario se borran también sus favoritas y sus mapas
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
  // AUTENTICACIÓN
  // --------------------------------------------------

  describe("autenticación", () => {

    it("debería rechazar la petición si no hay sesión iniciada", async () => {
      const response = await request(server).get("/recommendations/1");

      expect(response.status).toBe(401);
    });

    it("debería devolver el código UNAUTHORIZED si no hay sesión", async () => {
      const response = await request(server).get("/recommendations/1");

      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("debería rechazar la petición si el token no es válido", async () => {
      const response = await request(server)
        .get("/recommendations/1")
        .set("Cookie", "access_token=token-falso");

      expect(response.status).toBe(401);
    });
  });

  // --------------------------------------------------
  // VALIDACIÓN DEL ID DE USUARIO
  // --------------------------------------------------

  describe("validación del id de usuario", () => {

    it("debería rechazar un id que no es un número", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.get("/recommendations/abc");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar el id 0", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.get("/recommendations/0");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar un id negativo", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.get("/recommendations/-5");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar un id decimal", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.get("/recommendations/1.5");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("debería devolver el mensaje de error del id", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.get("/recommendations/abc");

      expect(response.body.error.message).toBe(
        "id_usuario debe ser un número entero positivo"
      );
    });

    it("debería devolver 404 si el usuario no existe", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.get("/recommendations/2147483647");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  // --------------------------------------------------
  // VALIDACIÓN DEL LÍMITE
  // --------------------------------------------------

  describe("validación del límite", () => {

    it("debería rechazar un límite igual a 0", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar un límite negativo", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: -1 });

      expect(response.status).toBe(400);
    });

    it("debería rechazar un límite mayor que 100", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 101 });

      expect(response.status).toBe(400);
    });

    it("debería rechazar un límite que no es un número", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: "abc" });

      expect(response.status).toBe(400);
    });

    it("debería rechazar un límite decimal", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 1.5 });

      expect(response.status).toBe(400);
    });

    it("debería devolver el mensaje de error del límite", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 0 });

      expect(response.body.error.message).toBe(
        "limit debe ser un entero entre 1 y 100"
      );
    });
  });

  // --------------------------------------------------
  // USUARIO CON FAVORITAS
  // --------------------------------------------------

  describe("usuario con favoritas", () => {

    it("debería devolver 200 y no marcarlo como cold start", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      expect(response.status).toBe(200);
      expect(response.body.isColdStart).toBe(false);
    });

    it("debería devolver el id del mapa, los nodos y las aristas", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      expect(typeof response.body.id_mapa).toBe("number");
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.edges)).toBe(true);
    });

    it("debería incluir el nodo central", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const central = response.body.nodes.find((n: any) => n.id_nodo === 0);

      expect(central).toBeDefined();
      expect(central.id_obra).toBeNull();
      expect(central.nivel).toBe(-1);
    });

    it("debería incluir la película favorita como nodo", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const node = response.body.nodes.find((n: any) => n.id_obra === movie.id_obra);

      expect(node).toBeDefined();
      expect(node.titulo).toBe(movie.titulo);
      expect(node.nivel).toBe(0);
    });

    it("debería conectar el nodo central con la película favorita", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const node = response.body.nodes.find((n: any) => n.id_obra === movie.id_obra);

      expect(response.body.edges).toContainEqual({ source: 0, destiny: node.id_nodo });
    });

    it("debería incluir una película similar como recomendación", async () => {
      const favorite = await addMovie();
      const similar = await addMovie();
      await movieRepository.insertByBatchInSimilitudObra([
        { obra_origen_id: favorite.id_obra, obra_destino_id: similar.id_obra, puntuacion: 0.8 },
      ]);
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([favorite.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const node = response.body.nodes.find((n: any) => n.id_obra === similar.id_obra);

      expect(node).toBeDefined();
      expect(node.nivel).toBe(1);
    });

    it("debería guardar el mapa en la base de datos", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(1);
      expect(maps[0]!.id_mapa).toBe(response.body.id_mapa);
      expect(maps[0]!.nombre_mapa).toBe("Mapa de Recomendaciones");
    });

    it("no debería usar las favoritas de otro usuario", async () => {
      const mine = await addMovie();
      const notMine = await addMovie();
      const other = await addUser();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([mine.id_obra], user.id_usuario);
      await movieRepository.insertMovies([notMine.id_obra], other.id_usuario);

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const ids = response.body.nodes.map((n: any) => n.id_obra);

      expect(ids).toContain(mine.id_obra);
      expect(ids).not.toContain(notMine.id_obra);
    });
  });

  // --------------------------------------------------
  // USUARIO SIN FAVORITAS (COLD START)
  // --------------------------------------------------

  describe("usuario sin favoritas", () => {

    it("debería devolver 200 y marcarlo como cold start", async () => {
      await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      expect(response.status).toBe(200);
      expect(response.body.isColdStart).toBe(true);
    });

    it("debería incluir el nodo central", async () => {
      await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const central = response.body.nodes.find((n: any) => n.id_nodo === 0);

      expect(central).toBeDefined();
    });

    it("debería incluir una película popular", async () => {
      const popular = await addMovie();
      const other = await addUser();
      await movieRepository.insertMovies([popular.id_obra], other.id_usuario);
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 100 });

      const ids = response.body.nodes.map((n: any) => n.id_obra);

      expect(ids).toContain(popular.id_obra);
    });

    it("debería respetar el límite indicado", async () => {
      await addMovie();
      await addMovie();
      await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 2 });

      const seeds = response.body.nodes.filter((n: any) => n.nivel === 0);

      expect(seeds).toHaveLength(2);
    });

    it("debería usar 5 películas por defecto", async () => {
      for (let i = 0; i < 6; i++) {
        await addMovie();
      }
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const seeds = response.body.nodes.filter((n: any) => n.nivel === 0);

      expect(seeds).toHaveLength(5);
    });

    it("no debería incluir películas sin imagen", async () => {
      const withoutImage = await addMovie({ imagen_url: null });
      const other = await addUser();
      await movieRepository.insertMovies([withoutImage.id_obra], other.id_usuario);
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 100 });

      const ids = response.body.nodes.map((n: any) => n.id_obra);

      expect(ids).not.toContain(withoutImage.id_obra);
    });

    it("debería guardar el mapa de populares en la base de datos", async () => {
      await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.get(`/recommendations/${user.id_usuario}`);

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(1);
      expect(maps[0]!.id_mapa).toBe(response.body.id_mapa);
      expect(maps[0]!.nombre_mapa).toBe("Mapa de Películas Populares");
    });

    it("debería conectar el nodo central con las películas populares", async () => {
      const popular = await addMovie();
      const other = await addUser();
      await movieRepository.insertMovies([popular.id_obra], other.id_usuario);
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 100 });

      const node = response.body.nodes.find((n: any) => n.id_obra === popular.id_obra);

      expect(response.body.edges).toContainEqual({ source: 0, destiny: node.id_nodo });
    });

    it("debería poner antes las películas con más favoritos", async () => {
      const popular = await addMovie();
      const lessPopular = await addMovie();
      const notPopular = await addMovie();
      const user1 = await addUser();
      const user2 = await addUser();
      await movieRepository.insertMovies([popular.id_obra, lessPopular.id_obra], user1.id_usuario);
      await movieRepository.insertMovies([popular.id_obra], user2.id_usuario);
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 2 });

      const ids = response.body.nodes.map((n: any) => n.id_obra);

      expect(ids).toContain(popular.id_obra);
      expect(ids).toContain(lessPopular.id_obra);
      expect(ids).not.toContain(notPopular.id_obra);
    });

    it("debería aceptar el límite máximo de 100", async () => {
      await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .get(`/recommendations/${user.id_usuario}`)
        .query({ limit: 100 });

      expect(response.status).toBe(200);
    });
  });
});