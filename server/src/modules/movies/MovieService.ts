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
}