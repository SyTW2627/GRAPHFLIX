import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { MovieService } from "../../../src/modules/movies/MovieService";
import { MovieRepository } from "../../../src/modules/movies/MovieRepository";
import { UserRepository } from "../../../src/modules/users/UserRepository";
import { sql } from "../../../src/db/db";

import { NotFoundError, ValidationError } from "../../../src/errors/AppError";

import {
  assertTestDatabase,
  createTestMovie,
  deleteTestMovie,
  uniqueId,
  type TestMovie,
  type TestMovieOptions,
} from "../../helpers/movie.helpers";

describe("MovieService", () => {
  let movieService: MovieService;
  let userRepository: UserRepository;

  let createdMovies: TestMovie[] = [];
  let createdUserIds: number[] = [];

  beforeAll(() => {
    assertTestDatabase();

    userRepository = new UserRepository();
    movieService = new MovieService(new MovieRepository());
  });

  afterEach(async () => {
    // al borrar el usuario se borran también sus favoritas
    for (const id_usuario of createdUserIds) {
      await userRepository.delete(id_usuario);
    }
    createdUserIds = [];

    for (const movie of createdMovies) {
      await deleteTestMovie(movie);
    }
    createdMovies = [];
  });

  afterAll(async () => {
    await sql.end();
  });

  // Crea una película y guarda sus ids para limpiarla después.
  const addMovie = async (options: TestMovieOptions = {}) => {
    const movie = await createTestMovie(options);
    createdMovies.push(movie);
    return movie;
  };

  // Crea un usuario y guarda su id para limpiarlo después.
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

  // --------------------------------------------------
  // findMovieDetails()
  // --------------------------------------------------

  describe("findMovieDetails()", () => {
    it("debería devolver los detalles de una película existente", async () => {
      const movie = await addMovie({
        generos: ["Drama"],
        directores: ["Director"],
        reparto: ["Actor"],
        saga: "Saga",
      });

      const result = await movieService.findMovieDetails(movie.id_obra);

      expect(result?.id_obra).toBe(movie.id_obra);
      expect(result?.titulo).toBe(movie.titulo);
      expect(result?.descripcion).toBe(movie.descripcion);
      expect(result?.generos).toEqual(movie.generos);
      expect(result?.directores).toEqual(movie.directores);
      expect(result?.reparto).toEqual(movie.reparto);
      expect(result?.sagas).toEqual([movie.saga]);
    });

    it("debería devolver null si la película no existe", async () => {
      const result = await movieService.findMovieDetails(-999);

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------
  // findPopularMovies()
  // --------------------------------------------------

  describe("findPopularMovies()", () => {
    it("debería devolver las películas populares", async () => {
      const user = await addUser();
      const movie = await addMovie();
      await sql`INSERT INTO favorita (id_usuario, id_obra) VALUES (${user.id_usuario}, ${movie.id_obra})`;

      const result = await movieService.findPopularMovies(100);

      expect(result.some((m) => m.id_obra === movie.id_obra)).toBe(true);
    });
    
    it("debería respetar el límite indicado", async () => {
      await addMovie();
      await addMovie();

      const result = await movieService.findPopularMovies(1);

      expect(result).toHaveLength(1);
    });

    it.each([0, -1, 101, 1.5, NaN])(
      "debería lanzar ValidationError si el límite es %s",
      async (limit) => {
        await expect(movieService.findPopularMovies(limit)).rejects.toThrow(ValidationError);
      }
    );
  });

  // --------------------------------------------------
  // findMovies()
  // --------------------------------------------------

  describe("findMovies()", () => {
    it("debería devolver las películas pedidas", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();

      const result = await movieService.findMovies([movie1.id_obra, movie2.id_obra]);

      expect(result).toHaveLength(2);
    });
  });

  // --------------------------------------------------
  // findAllIdMovies()
  // --------------------------------------------------

  describe("findAllIdMovies()", () => {
    it("debería incluir las películas existentes", async () => {
      const movie = await addMovie();

      const result = await movieService.findAllIdMovies();

      expect(result.some((m) => m.id_obra === movie.id_obra)).toBe(true);
    });
  });

  // --------------------------------------------------
  // favoritas
  // --------------------------------------------------

  describe("insertFavoriteMovies()", () => {
    it("debería guardar las películas como favoritas del usuario", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();
      const user = await addUser();

      const result = await movieService.insertFavoriteMovies(
        [movie1.id_obra, movie2.id_obra],
        user.id_usuario
      );

      expect(result).toHaveLength(2);

      const favorites = await movieService.findFavoriteMovies(user.id_usuario);
      expect(favorites).toHaveLength(2);
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      const movie = await addMovie();

      await expect(
        movieService.insertFavoriteMovies([movie.id_obra], -999)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("findFavoriteMovies()", () => {
    it("debería devolver las favoritas del usuario", async () => {
      const movie = await addMovie();
      const user = await addUser();

      await movieService.insertFavoriteMovies([movie.id_obra], user.id_usuario);

      const result = await movieService.findFavoriteMovies(user.id_usuario);

      expect(result).toHaveLength(1);
      expect(result[0]?.id_obra).toBe(movie.id_obra);
    });

    it("debería devolver una lista vacía si el usuario no tiene favoritas", async () => {
      const user = await addUser();

      const result = await movieService.findFavoriteMovies(user.id_usuario);

      expect(result).toEqual([]);
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      await expect(movieService.findFavoriteMovies(-999)).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------
  // similitud
  // --------------------------------------------------

  describe("findSimilarityRelations()", () => {
    it("debería devolver una lista vacía si no se indican películas", async () => {
      const result = await movieService.findSimilarityRelations([]);

      expect(result).toEqual([]);
    });

    it("debería devolver las relaciones guardadas", async () => {
      const movie1 = await addMovie();
      const movie2 = await addMovie();

      await movieService.insertByBatchInSimilitudObra([
        { obra_origen_id: movie1.id_obra, obra_destino_id: movie2.id_obra, puntuacion: 0.7 },
      ]);

      const result = await movieService.findSimilarityRelations([movie1.id_obra]);

      expect(result).toHaveLength(1);
      expect(result[0]?.obra_destino_id).toBe(movie2.id_obra);
      expect(result[0]?.puntuacion).toBe(0.7);
    });
  });

  // --------------------------------------------------
  // géneros, personas y sagas
  // --------------------------------------------------

  describe("findGenres(), findPeople() y findSagas()", () => {
    it("debería devolver las características de las películas", async () => {
      const movie = await addMovie({
        generos: ["Drama"],
        directores: ["Director"],
        saga: "Saga",
      });

      const genres = await movieService.findGenres();
      const people = await movieService.findPeople();
      const sagas = await movieService.findSagas();

      expect(genres).toContainEqual({
        id_obra: movie.id_obra,
        feature: `genero_${movie.id_generos[0]}`,
      });
      expect(people).toContainEqual({
        id_obra: movie.id_obra,
        feature: `persona_${movie.id_directores[0]}_director`,
      });
      expect(sagas).toContainEqual({
        id_obra: movie.id_obra,
        feature: `saga_${movie.id_sagas[0]}`,
      });
    });
  });

});