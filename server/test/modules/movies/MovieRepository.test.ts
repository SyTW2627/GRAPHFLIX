import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { MovieRepository } from "../../../src/modules/movies/MovieRepository";
import { UserRepository } from "../../../src/modules/users/UserRepository";
import {
  assertTestDatabase,
  createTestMovie,
  deleteTestMovie,
  uniqueId,
  type TestMovie,
  type TestMovieOptions,
} from "../../helpers/movie.helpers";

// Instancias de los repositorios
const movieRepository = new MovieRepository();
const userRepository = new UserRepository();

// Guardamos lo creado durante las pruebas para limpiarlo después
let createdMovies: TestMovie[] = [];
const createdUserIds: number[] = [];

// Crea una película de prueba y la registra para su limpieza
const addMovie = async (options: TestMovieOptions = {}) => {
  const movie = await createTestMovie(options);
  createdMovies.push(movie);
  return movie;
};

// Crea un usuario de prueba y lo registra para su limpieza
const addUser = async () => {
  const id = uniqueId();

  const user = await userRepository.create({
    nombre_usuario: `test_${id}`,
    correo: `test_${id}@graphflix.com`,
    password: "hash_de_prueba",
  });

  createdUserIds.push(user.id_usuario);
  return user;
};

// Comprobamos que estamos utilizando la base de datos de pruebas
beforeAll(() => {
  assertTestDatabase();
});

// Limpiamos lo creado después de cada test
afterEach(async () => {
  // al borrar el usuario se borran también sus favoritas
  for (const id of createdUserIds) {
    await userRepository.delete(id);
  }
  createdUserIds.length = 0;

  for (const movie of createdMovies) {
    await deleteTestMovie(movie);
  }
  createdMovies = [];
});

describe("MovieRepository", () => {

  describe("getMovieDetails()", () => {
    it("debería devolver todos los datos de una película", async () => {
      const movie = await addMovie({
        generos: ["Drama", "Accion"],
        directores: ["Director"],
        reparto: ["Actor1", "Actor2"],
        saga: "Saga",
      });

      const details = await movieRepository.getMovieDetails(movie.id_obra);

      expect(details).not.toBeNull();
      expect(details?.id_obra).toBe(movie.id_obra);
      expect(details?.titulo).toBe(movie.titulo);
      expect(details?.ano_publicacion).toBe(movie.ano_publicacion);
      expect(details?.descripcion).toBe(movie.descripcion);
      expect(details?.imagen_url).toBe(movie.imagen_url);
      expect([...details!.generos].sort()).toEqual([...movie.generos].sort());
      expect(details?.directores).toEqual(movie.directores);
      expect([...details!.reparto].sort()).toEqual([...movie.reparto].sort());
      expect(details?.sagas).toEqual([movie.saga]);
    });

    it("debería separar los directores del reparto", async () => {
      const movie = await addMovie({
        directores: ["Director"],
        reparto: ["Actor"],
      });

      const details = await movieRepository.getMovieDetails(movie.id_obra);

      expect(details?.directores).toEqual(movie.directores);
      expect(details?.reparto).toEqual(movie.reparto);
      expect(details?.reparto).not.toContain(movie.directores[0]);
      expect(details?.directores).not.toContain(movie.reparto[0]);
    });

    it("debería devolver listas vacías si la película no tiene relaciones", async () => {
      const movie = await addMovie();

      const details = await movieRepository.getMovieDetails(movie.id_obra);

      expect(details?.generos).toEqual([]);
      expect(details?.directores).toEqual([]);
      expect(details?.reparto).toEqual([]);
      expect(details?.sagas).toEqual([]);
    });

    it("debería devolver null en los campos opcionales que no tienen valor", async () => {
      const movie = await addMovie({
        ano_publicacion: null,
        descripcion: null,
        imagen_url: null,
      });

      const details = await movieRepository.getMovieDetails(movie.id_obra);

      expect(details?.ano_publicacion).toBeNull();
      expect(details?.descripcion).toBeNull();
      expect(details?.imagen_url).toBeNull();
    });

    it("debería devolver null si la película no existe", async () => {
      const details = await movieRepository.getMovieDetails(-1);

      expect(details).toBeNull();
    });
  });

  describe("getMovies()", () => {
    it("debería devolver los datos básicos de las películas pedidas", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();

      const movies = await movieRepository.getMovies([movie1.id_obra, movie2.id_obra]);

      expect(movies).toHaveLength(2);
      expect(movies.map((m) => m.id_obra).sort()).toEqual(
        [movie1.id_obra, movie2.id_obra].sort()
      );
      expect(movies[0]).toHaveProperty("titulo");
      expect(movies[0]).toHaveProperty("ano_publicacion");
      expect(movies[0]).toHaveProperty("imagen_url");
    });

    it("debería devolver una lista vacía si los ids no existen", async () => {
      const movies = await movieRepository.getMovies([-1]);

      expect(movies).toEqual([]);
    });
  });

  describe("getAllIdMovies()", () => {
    it("debería incluir las películas existentes", async () => {
      const movie = await addMovie();

      const movies = await movieRepository.getAllIdMovies();

      expect(movies.some((m) => m.id_obra === movie.id_obra)).toBe(true);
    });
  });

  describe("getPopularMovies()", () => {
    it("debería ordenar las películas por número de favoritos", async () => {
      const popular = await addMovie();
      const lessPopular = await addMovie();
      const user1 = await addUser();
      const user2 = await addUser();

      await movieRepository.insertMovies([popular.id_obra, lessPopular.id_obra], user1.id_usuario);
      await movieRepository.insertMovies([popular.id_obra], user2.id_usuario);

      const movies = await movieRepository.getPopularMovies(100);

      const popularIndex = movies.findIndex((m) => m.id_obra === popular.id_obra);
      const lessPopularIndex = movies.findIndex((m) => m.id_obra === lessPopular.id_obra);

      expect(popularIndex).toBeGreaterThanOrEqual(0);
      expect(popularIndex).toBeLessThan(lessPopularIndex);
      expect(movies[popularIndex]?.total_favoritos).toBe(2);
      expect(movies[lessPopularIndex]?.total_favoritos).toBe(1);
    });

    it("no debería incluir las películas sin portada", async () => {
      const withoutPoster = await addMovie({ imagen_url: null });

      const movies = await movieRepository.getPopularMovies(100);

      expect(movies.some((m) => m.id_obra === withoutPoster.id_obra)).toBe(false);
    });

    it("debería respetar el límite indicado", async () => {
      await addMovie();
      await addMovie();

      const movies = await movieRepository.getPopularMovies(1);

      expect(movies).toHaveLength(1);
    });
  });

  describe("insertMovies() y getFavoriteMovies()", () => {
    it("debería guardar las películas como favoritas del usuario", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();
      const user = await addUser();

      const inserted = await movieRepository.insertMovies(
        [movie1.id_obra, movie2.id_obra],
        user.id_usuario
      );
      const favorites = await movieRepository.getFavoriteMovies(user.id_usuario);

      expect(inserted).toHaveLength(2);
      expect(favorites.map((m) => m.id_obra).sort()).toEqual(
        [movie1.id_obra, movie2.id_obra].sort()
      );
    });

    it("no debería duplicar una película que ya es favorita", async () => {
      const movie = await addMovie();
      const user = await addUser();

      await movieRepository.insertMovies([movie.id_obra], user.id_usuario);
      const inserted = await movieRepository.insertMovies([movie.id_obra], user.id_usuario);
      const favorites = await movieRepository.getFavoriteMovies(user.id_usuario);

      expect(inserted).toHaveLength(0);
      expect(favorites).toHaveLength(1);
    });

    it("debería ignorar las películas que no existen", async () => {
      const movie = await addMovie();
      const user = await addUser();

      const inserted = await movieRepository.insertMovies([movie.id_obra, -1], user.id_usuario);

      expect(inserted).toHaveLength(1);
      expect(inserted[0]?.id_obra).toBe(movie.id_obra);
    });

    it("debería devolver una lista vacía si el usuario no tiene favoritas", async () => {
      const user = await addUser();

      const favorites = await movieRepository.getFavoriteMovies(user.id_usuario);

      expect(favorites).toEqual([]);
    });
  });

  describe("similitud entre obras", () => {
    it("debería guardar y recuperar las relaciones de similitud", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();

      await movieRepository.insertByBatchInSimilitudObra([
        { obra_origen_id: movie1.id_obra, obra_destino_id: movie2.id_obra, puntuacion: 0.5 },
      ]);

      const relations = await movieRepository.getSimilarityRelations([movie1.id_obra]);

      expect(relations).toHaveLength(1);
      expect(relations[0]?.obra_origen_id).toBe(movie1.id_obra);
      expect(relations[0]?.obra_destino_id).toBe(movie2.id_obra);
      expect(relations[0]?.puntuacion).toBe(0.5);
    });

    it("debería actualizar la puntuación si la relación ya existe", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();

      await movieRepository.insertByBatchInSimilitudObra([
        { obra_origen_id: movie1.id_obra, obra_destino_id: movie2.id_obra, puntuacion: 0.5 },
      ]);
      await movieRepository.insertByBatchInSimilitudObra([
        { obra_origen_id: movie1.id_obra, obra_destino_id: movie2.id_obra, puntuacion: 0.9 },
      ]);

      const relations = await movieRepository.getSimilarityRelations([movie1.id_obra]);

      expect(relations).toHaveLength(1);
      expect(relations[0]?.puntuacion).toBe(0.9);
    });

    it("debería encontrar la relación también desde la obra destino", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();

      await movieRepository.insertByBatchInSimilitudObra([
        { obra_origen_id: movie1.id_obra, obra_destino_id: movie2.id_obra, puntuacion: 0.3 },
      ]);

      const relations = await movieRepository.getSimilarityRelations([movie2.id_obra]);

      expect(relations).toHaveLength(1);
    });
  });

  describe("características para calcular la similitud", () => {
    it("getGenres() debería devolver los géneros de las películas", async () => {
      const movie = await addMovie({ generos: ["Drama"] });

      const genres = await movieRepository.getGenres();

      expect(genres).toContainEqual({
        id_obra: movie.id_obra,
        feature: `genero_${movie.id_generos[0]}`,
      });
    });

    it("getPeople() debería devolver las personas con su tipo", async () => {
      const movie = await addMovie({ directores: ["Director"], reparto: ["Actor"] });

      const people = await movieRepository.getPeople();

      expect(people).toContainEqual({
        id_obra: movie.id_obra,
        feature: `persona_${movie.id_directores[0]}_director`,
      });
      expect(people).toContainEqual({
        id_obra: movie.id_obra,
        feature: `persona_${movie.id_actores[0]}_actor`,
      });
    });

    it("getSagas() debería devolver las sagas de las películas", async () => {
      const movie = await addMovie({ saga: "Saga" });

      const sagas = await movieRepository.getSagas();

      expect(sagas).toContainEqual({
        id_obra: movie.id_obra,
        feature: `saga_${movie.id_sagas[0]}`,
      });
    });
  });

});