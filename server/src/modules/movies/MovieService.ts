import { MovieRepository } from "./MovieRepository";
import { UserRepository } from "../users/UserRepository";
import { UserService } from "../users/UserService";
import { ValidationError } from "../../errors/AppError";
import type {Pelicula} from "../../services/createGraph/type-model";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export class MovieService {
    public constructor(private movieRepository: MovieRepository) {}

    async findFavoriteMovies(id: number) {
        await userService.getUserById(id);
        return await this.movieRepository.getFavoriteMovies(id);
    }

    async findPopularMovies(limit: number) {
        if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
            throw new ValidationError("El límite no cumple el intervalo [1-100]");
        }
        return await this.movieRepository.getPopularMovies(limit);
    }

    async findMovies(moviesId: number[]) {
        return await this.movieRepository.getMovies(moviesId); 
    }

    async findSimilarityRelations(movieIds: number[]) {
        if (!movieIds || movieIds.length === 0) return [];
        return await this.movieRepository.getSimilarityRelations(movieIds);
    }

    async insertFavoriteMovies(movieIds: number[], userId: number) {
        await userService.getUserById(userId);
        await this.movieRepository.getMovies(movieIds); 
        return await this.movieRepository.insertMovies(movieIds, userId);
    }

    async findGenres() {
        return await this.movieRepository.getGenres();
    }
    
    async findPeople() {
        return await this.movieRepository.getPeople();
    }

    async findSagas() {
        return await this.movieRepository.getSagas();
    }  
    
    async findAllIdMovies() {
        return await this.movieRepository.getAllIdMovies();
    } 
    
    async insertByBatchInSimilitudObra(lote: { obra_origen_id: number, obra_destino_id: number, puntuacion: number }[]) {
        return await this.movieRepository.insertByBatchInSimilitudObra(lote);
    }
}