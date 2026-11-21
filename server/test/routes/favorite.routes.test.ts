import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { sign } from 'hono/jwt';

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

// Id que no existe en la BD (máximo de un INTEGER de PostgreSQL)
const NON_EXISTENT_ID = 2147483647;

// Guardamos lo creado durante cada prueba para borrarlo después
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

// Genera un JWT válido
const createTokenWithSub = async (sub: string) => {
  return await sign(
    {
      sub,
      exp: Math.floor(Date.now() / 1000) + 3600
    },
    process.env.TOKEN_SECRET_KEY!,
    "HS256"
  );
};

// Devuelve los ids de las favoritas de un usuario leyendo la BD
const getFavoriteIds = async (idUsuario: number) => {
  const favorites = await movieRepository.getFavoriteMovies(idUsuario);
  return favorites.map((f) => f.id_obra);
};

describe("Favorite Routes", () => {

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
  // POST /favorites
  // --------------------------------------------------

  describe("POST /favorites", () => {

    it("debería rechazar la petición si no hay sesión iniciada", async () => {
      const movie = await addMovie();

      const response = await request(server)
        .post("/favorites")
        .send({ id_obra: movie.id_obra });

      expect(response.status).toBe(401);
    });

    it("debería añadir una película a favoritos", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites")
        .send({ id_obra: movie.id_obra });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Se ha añadido a favoritos");
    });

    it("debería guardar la favorita en la base de datos", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      await agent.post("/favorites").send({ id_obra: movie.id_obra });

      const ids = await getFavoriteIds(user.id_usuario);

      expect(ids).toEqual([movie.id_obra]);
    });

    it("debería indicar que ya está en favoritos si se añade dos veces", async () => {
      const movie = await addMovie();
      const { agent } = await createAuthenticatedUser();

      await agent.post("/favorites").send({ id_obra: movie.id_obra });
      const response = await agent.post("/favorites").send({ id_obra: movie.id_obra });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Ya se encuentra en favoritos");
    });

    it("no debería duplicar la favorita si se añade dos veces", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      await agent.post("/favorites").send({ id_obra: movie.id_obra });
      await agent.post("/favorites").send({ id_obra: movie.id_obra });

      const ids = await getFavoriteIds(user.id_usuario);

      expect(ids).toHaveLength(1);
    });

    it("debería rechazar un id_obra igual a 0", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.post("/favorites").send({ id_obra: 0 });

      expect(response.status).toBe(400);
    });

    it("debería rechazar un id_obra negativo", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.post("/favorites").send({ id_obra: -3 });

      expect(response.status).toBe(400);
    });

    it("debería rechazar un id_obra que no es un número", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.post("/favorites").send({ id_obra: "abc" });

      expect(response.status).toBe(400);
    });

    it("debería rechazar la petición si falta id_obra", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.post("/favorites").send({});

      expect(response.status).toBe(400);
    });

    it("debería devolver 404 si la película no existe", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites")
        .send({ id_obra: NON_EXISTENT_ID });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
      expect(response.body.error.message).toBe("Obra no encontrado");
    });

    it("debería devolver 404 si el usuario de la sesión ya no existe", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await userRepository.delete(user.id_usuario);

      const response = await agent
        .post("/favorites")
        .send({ id_obra: movie.id_obra });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Usuario no encontrado");
    });

    it("debería crear el mapa del usuario al añadir su primera favorita", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      await agent.post("/favorites").send({ id_obra: movie.id_obra });

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(1);
      expect(maps[0]!.tipo_mapa).toBe("peliculas");
      expect(maps[0]!.nombre_mapa).toBe("Mapa de Recomendaciones");
    });

    it("debería mantener un solo mapa al añadir más favoritas", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      await agent.post("/favorites").send({ id_obra: movieA.id_obra });
      await agent.post("/favorites").send({ id_obra: movieB.id_obra });

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(1);
    });

    it("debería rechazar la petición si el cuerpo no es un JSON válido", async () => {
      const { agent } = await createAuthenticatedUser();
  
      const response = await agent
          .post("/favorites")
          .set("Content-Type", "application/json")
          .send("esto no es json");
  
      expect(response.status).toBe(400);
    });
  });

  // --------------------------------------------------
  // POST /favorites/batch
  // --------------------------------------------------

  describe("POST /favorites/batch", () => {

    it("debería rechazar la petición si no hay sesión iniciada", async () => {
      const response = await request(server)
        .post("/favorites/batch")
        .send({ ids_obras: [1, 2, 3] });

      expect(response.status).toBe(401);
    });

    it("debería guardar un lote de favoritas", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const movieC = await addMovie();
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, movieC.id_obra] });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Favoritos guardados correctamente");
      expect(response.body.recibidos).toBe(3);
      expect(response.body.validos).toBe(3);
      expect(response.body.insertados).toBe(3);
    });

    it("debería guardar las favoritas del lote en la base de datos", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const movieC = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, movieC.id_obra] });

      const ids = await getFavoriteIds(user.id_usuario);

      expect(ids).toHaveLength(3);
      expect(ids).toContain(movieA.id_obra);
      expect(ids).toContain(movieB.id_obra);
      expect(ids).toContain(movieC.id_obra);
    });

    it("debería crear el mapa del usuario", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const movieC = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, movieC.id_obra] });

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(1);
    });

    it("debería descartar los ids no válidos", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const movieC = await addMovie();
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, movieC.id_obra, "abc", -1] });

      expect(response.status).toBe(200);
      expect(response.body.recibidos).toBe(5);
      expect(response.body.validos).toBe(3);
      expect(response.body.insertados).toBe(3);
    });

    it("debería ignorar las películas que no existen", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, NON_EXISTENT_ID] });

      expect(response.status).toBe(200);
      expect(response.body.validos).toBe(3);
      expect(response.body.insertados).toBe(2);
    });

    it("no debería duplicar las favoritas que el usuario ya tenía", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const movieC = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movieA.id_obra], user.id_usuario);

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, movieC.id_obra] });

      expect(response.body.insertados).toBe(2);
      expect(await getFavoriteIds(user.id_usuario)).toHaveLength(3);
    });

    it("debería rechazar la petición si falta ids_obras", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent.post("/favorites/batch").send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar la petición si ids_obras no es un array", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: "1,2,3" });

      expect(response.status).toBe(400);
    });

    it("debería rechazar la petición si ids_obras está vacío", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [] });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "ids_obras deber ser un array no vacio de IDs"
      );
    });

    it("debería rechazar la petición si ningún id es válido", async () => {
      const { agent } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: ["abc", -1, 0] });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "Ningun id de obra enviado es válido"
      );
    });

    it("debería rechazar la petición si hay menos de 3 ids válidos", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra] });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "Se deben proporcionar al menos 3 obras únicas y validas"
      );
      expect(await getFavoriteIds(user.id_usuario)).toEqual([]);
    });

    it("debería devolver 404 si el usuario de la sesión ya no existe", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const movieC = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await userRepository.delete(user.id_usuario);

      const response = await agent
        .post("/favorites/batch")
        .send({ ids_obras: [movieA.id_obra, movieB.id_obra, movieC.id_obra] });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Usuario no encontrado");
    });
  });

  // --------------------------------------------------
  // GET /favorites/:idUsuario
  // --------------------------------------------------

  describe("GET /favorites/:idUsuario", () => {

    it("debería rechazar la petición si no hay sesión iniciada", async () => {
      const response = await request(server).get("/favorites/1");

      expect(response.status).toBe(401);
    });

    it("debería devolver una lista vacía si no hay favoritas", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.get(`/favorites/${user.id_usuario}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("debería devolver las favoritas del usuario", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/favorites/${user.id_usuario}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id_obra).toBe(movie.id_obra);
      expect(response.body[0].titulo).toBe(movie.titulo);
    });

    it("debería devolver solo los campos básicos de la película", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.get(`/favorites/${user.id_usuario}`);

      expect(response.body[0]).toHaveProperty("id_obra");
      expect(response.body[0]).toHaveProperty("titulo");
      expect(response.body[0]).toHaveProperty("ano_publicacion");
      expect(response.body[0]).toHaveProperty("imagen_url");
      expect(response.body[0]).not.toHaveProperty("descripcion");
    });

    it("debería ordenar las favoritas por título", async () => {
      const zeta = await addMovie({ titulo: `Zeta-${uniqueId()}` });
      const alfa = await addMovie({ titulo: `Alfa-${uniqueId()}` });
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([zeta.id_obra, alfa.id_obra], user.id_usuario);

      const response = await agent.get(`/favorites/${user.id_usuario}`);

      const ids = response.body.map((m: any) => m.id_obra);

      expect(ids).toEqual([alfa.id_obra, zeta.id_obra]);
    });

    it("no debería incluir las favoritas de otros usuarios", async () => {
      const mine = await addMovie();
      const notMine = await addMovie();
      const other = await addUser();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([mine.id_obra], user.id_usuario);
      await movieRepository.insertMovies([notMine.id_obra], other.id_usuario);

      const response = await agent.get(`/favorites/${user.id_usuario}`);

      const ids = response.body.map((m: any) => m.id_obra);

      expect(ids).toEqual([mine.id_obra]);
    });

    it("debería usar el usuario de la sesión aunque la URL tenga otro id", async () => {
      const mine = await addMovie();
      const notMine = await addMovie();
      const other = await addUser();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([mine.id_obra], user.id_usuario);
      await movieRepository.insertMovies([notMine.id_obra], other.id_usuario);

      const response = await agent.get(`/favorites/${other.id_usuario}`);

      const ids = response.body.map((m: any) => m.id_obra);

      expect(ids).toEqual([mine.id_obra]);
    });

    it("debería devolver 404 si el usuario de la sesión ya no existe", async () => {
      const { agent, user } = await createAuthenticatedUser();
      await userRepository.delete(user.id_usuario);

      const response = await agent.get(`/favorites/${user.id_usuario}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Usuario no encontrado");
    });
  });

  // --------------------------------------------------
  // DELETE /favorites/:idUsuario/:idObra
  // --------------------------------------------------

  describe("DELETE /favorites/:idUsuario/:idObra", () => {

    it("debería rechazar la petición si no hay sesión iniciada", async () => {
      const response = await request(server).delete("/favorites/1/1");

      expect(response.status).toBe(401);
    });

    it("debería eliminar una película de favoritos", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      const response = await agent.delete(`/favorites/${user.id_usuario}/${movie.id_obra}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Eliminada de favoritos");
    });

    it("debería borrar la favorita de la base de datos", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);

      await agent.delete(`/favorites/${user.id_usuario}/${movie.id_obra}`);

      expect(await getFavoriteIds(user.id_usuario)).toEqual([]);
    });

    it("no debería borrar las demás favoritas", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movieA.id_obra, movieB.id_obra], user.id_usuario);

      await agent.delete(`/favorites/${user.id_usuario}/${movieA.id_obra}`);

      expect(await getFavoriteIds(user.id_usuario)).toEqual([movieB.id_obra]);
    });

    it("debería rechazar un id de obra que no es un número", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.delete(`/favorites/${user.id_usuario}/abc`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
    

    it("debería rechazar un id de obra igual a 0", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.delete(`/favorites/${user.id_usuario}/0`);

      expect(response.status).toBe(400);
    });

    it("debería rechazar un token cuyo id de usuario es 0", async () => {
      const token = await createTokenWithSub("0");
  
      const response = await request(server)
          .delete("/favorites/1/1")
          .set("Cookie", `access_token=${token}`);
  
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("id usuario debe ser un entero positivo");
    });

    it("debería rechazar un id de obra negativo", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.delete(`/favorites/${user.id_usuario}/-1`);

      expect(response.status).toBe(400);
    });

    it("debería devolver el mensaje de error del id de obra", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.delete(`/favorites/${user.id_usuario}/abc`);

      expect(response.body.error.message).toBe("id obra debe ser un entero positivo");
    });

    it("debería devolver 404 si la película no existe", async () => {
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.delete(`/favorites/${user.id_usuario}/${NON_EXISTENT_ID}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Obra no encontrado");
    });

    it("debería devolver 404 si el usuario de la sesión ya no existe", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await userRepository.delete(user.id_usuario);

      const response = await agent.delete(`/favorites/${user.id_usuario}/${movie.id_obra}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Usuario no encontrado");
    });

    it("debería devolver 404 si la película no estaba en favoritos", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();

      const response = await agent.delete(`/favorites/${user.id_usuario}/${movie.id_obra}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Favorito no encontrado");
    });

    it("no debería poder borrar las favoritas de otro usuario", async () => {
      const movie = await addMovie();
      const other = await addUser();
      const { agent } = await createAuthenticatedUser();
      await movieRepository.insertMovies([movie.id_obra], other.id_usuario);

      const response = await agent.delete(`/favorites/${other.id_usuario}/${movie.id_obra}`);

      expect(response.status).toBe(404);
      expect(await getFavoriteIds(other.id_usuario)).toEqual([movie.id_obra]);
    });

    it("debería eliminar el mapa si se borra la última favorita", async () => {
      const movie = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await agent.post("/favorites").send({ id_obra: movie.id_obra });

      await agent.delete(`/favorites/${user.id_usuario}/${movie.id_obra}`);

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(0);
    });

    it("debería mantener el mapa si todavía quedan favoritas", async () => {
      const movieA = await addMovie();
      const movieB = await addMovie();
      const { agent, user } = await createAuthenticatedUser();
      await agent.post("/favorites").send({ id_obra: movieA.id_obra });
      await agent.post("/favorites").send({ id_obra: movieB.id_obra });

      await agent.delete(`/favorites/${user.id_usuario}/${movieA.id_obra}`);

      const maps = await mapRepository.findByUserId(user.id_usuario);

      expect(maps).toHaveLength(1);
    });
  });
});