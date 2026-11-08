import { MovieRepository } from "./MovieRepository";
import { UserRepository } from "../users/UserRepository";
import { UserService } from "../users/UserService";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export class MovieService {
    public constructor(private movieRepository: MovieRepository) {}

    async findFavoriteMovies(id: number) {
        try {
            await userService.getUserById(id);
            return await this.movieRepository.getFavoriteMovies(id);

        }catch(error) {
            throw error;
        }
    }

    async findPopularMovies(limit: number) {
        try {
            if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
                throw new Error ("El límite no cumple el intervalo [0-100]");
            }
            return await this.movieRepository.getPopularMovies(limit);

        }catch(error) {
            throw error;
        }
    }

    async findMovies(moviesId: number[]) {
        try {
           return await this.movieRepository.getMovies(moviesId); 
        } catch(error) {
            throw error;
        }
    }

    async findSimilarityRelations(movieIds: number[]) {
        try {
            if (!movieIds || movieIds.length === 0) return [];
            return await this.movieRepository.getSimilarityRelations(movieIds);

        } catch(error) {
            throw error;
        }
    }

    async insertFavoriteMovies(movieIds: number[], userId: number) {
        try {
            await userService.getUserById(userId);
            await this.movieRepository.getMovies(movieIds); 
            return await this.movieRepository.insertMovies(movieIds, userId);

        } catch(error) {
            throw error;
        }
    }

    async findGenres() {
        try {
            return await this.movieRepository.getGenres();
        } catch(error) {
            throw error;
        }
    }
    
    async findPeople() {
        try {
            return await this.movieRepository.getPeople();
        } catch(error) {
            throw error;
        }
    }

    async findSagas() {
        try {
            return await this.movieRepository.getSagas();
        } catch(error) {
            throw error;
        }
    }  
    
    async findAllIdMovies() {
        try {
            return await this.movieRepository.getAllIdMovies();
        } catch(error) {
            throw error;
        }
    } 
    
    async insertByBatchInSimilitudObra(lote: { obra_origen_id: number, obra_destino_id: number, puntuacion: number }[]) {
        try {
            return await this.movieRepository.insertByBatchInSimilitudObra(lote);
        } catch(error) {
            throw error;
        }
    }
}