import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";

import { getStoreUSer, completeOnboarding } from "../../services/auth.service";
import { getPopularMovies, searchMovies, type MovieResult } from "../../services/movie.service";
import { addManyFavorites, MIN_ONBOARDING_MOVIES } from "../../services/favorite.service";
import { SessionExpiredError } from "../../services/graph.service";

import "./OnboardingScreen.css";

export default function Onboarding() {
    const navigate = useNavigate();

    const [popularMovies, setPopularMovies] = useState<MovieResult[]>([]);
    const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
    const [selectedMovies, setSelectedMovies] = useState<MovieResult[]>([]);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Comprobar sesión y cargar películas populares
    useEffect(() => {
        const user = getStoreUSer();

        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        // Si ya hizo el onboarding no tiene sentido volver a esta pantalla
        if (user.onboarding_completado) {
            navigate("/grafo", { replace: true });
            return;
        }

        //Carga de peliculas favoritas
        const loadPopularMovies = async () => {
            try {
                setLoading(true);
                const movies = await getPopularMovies(12);
                setPopularMovies(movies);
            } catch (err) {
                setError( err instanceof Error ? err.message: "No se pudieron cargar las películas" );
            } finally {
                setLoading(false);
            }
        };

        loadPopularMovies();
    }, [navigate]);

    // Búsqueda con un pequeño retraso para no llamar a la API por cada tecla
    useEffect(() => {
        const query = search.trim();

        if (!query) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        const controller = new AbortController();

        const timeout = window.setTimeout(async () => {
            try {
                setSearching(true);
                const results = await searchMovies({ q: query }, controller.signal );
                setSearchResults(results);

            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") setError(err.message);

            } finally {
                if (!controller.signal.aborted) setSearching(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [search]);

    // Seleccionar o deseleccionar una película
    const toggleMovie = (movie: MovieResult) => {
        setSelectedMovies((current) => {
            const alreadySelected = current.some( (selected) => selected.id_obra === movie.id_obra);

            if (alreadySelected) {
                return current.filter( (selected) => selected.id_obra !== movie.id_obra );
            }

            return [...current, movie];
        });
    };

    const isSelected = (movieId: number) => selectedMovies.some((movie) => movie.id_obra === movieId);

    // Guardar favoritos, marcar el onboarding como completado y continuar
    const canContinue = selectedMovies.length >= MIN_ONBOARDING_MOVIES;

    const handleContinue = async () => {
        if (!canContinue || saving) return;

        try {
            setSaving(true);
            setError("");

            // Una sola petición (el servidor reconstruye el mapa una única vez)
            await addManyFavorites(selectedMovies.map((movie) => movie.id_obra));
            await completeOnboarding();

            navigate("/grafo", { replace: true });
        } catch (err) {
            if (err instanceof SessionExpiredError) {
                navigate("/login", { replace: true });
                return;
            }
            setError(
                err instanceof Error ? err.message : "No se pudieron guardar tus películas favoritas"
            );
        } finally {
            setSaving(false);
        }
    };

    // Saltar el onboarding e ir directamente al grafo
    const handleSkip = async () => {
        if (saving) return;

        try {
            // Se marca como completado para que no vuelva a aparecer en el próximo login
            await completeOnboarding();
        } catch (err) {
            if (err instanceof SessionExpiredError) {
                navigate("/login", { replace: true });
                return;
            }
        }
        navigate("/grafo", { replace: true });
    };

    // Mostrar la tarjeta de una película, con su imagen, título y año de publicación. Se marca si está seleccionada.
    const renderMovie = (movie: MovieResult) => {
        const selected = isSelected(movie.id_obra);

        return (
            <button
                type="button"
                key={movie.id_obra}
                className={`movie-card ${selected ? "selected" : ""}`}
                onClick={() => toggleMovie(movie)}
                aria-pressed={selected}
            >
                <div className="movie-poster">
                    <img src={movie.imagen_url!} alt={movie.titulo} />

                    <span className="movie-check">
                        {selected ? "✓" : "+"}
                    </span>
                </div>

                <div className="movie-info">
                    <h3>{movie.titulo}</h3>
                    <p>{movie.ano_publicacion!}</p>
                </div>
            </button>
        );
    };

    return (
        <div className="onboarding-screen">
            <Header isonboarding={true} />

            <div className="onboarding-layout">
                {/* BARRA LATERAL: BUSCADOR */}
                <aside className="onboarding-sidebar">
                    <div className="sidebar-heading">
                        <h2>Busca películas</h2>
                        <p>
                            Encuentra tus películas favoritas y añádelas
                            a tu selección.
                        </p>
                    </div>

                    <div className="movie-search">
                        <span>⌕</span>
                        <input
                            type="text"
                            placeholder="Buscar una película..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {search && (
                            <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" >
                                ×
                            </button>
                        )}
                    </div>

                    {search.trim() && (
                        <div className="search-results">
                            <h3>Resultados de búsqueda</h3>

                            {searching && (
                                <p className="search-message">
                                    Buscando películas...
                                </p>
                            )}

                            {!searching && searchResults.length === 0 && (
                                <p className="search-message">
                                    No se encontraron películas.
                                </p>
                            )}

                            {searchResults.map((movie) => (
                                <button type="button"
                                    key={movie.id_obra}
                                    className={`search-movie ${
                                        isSelected(movie.id_obra)
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() => toggleMovie(movie)}
                                >
                                    <img src={movie.imagen_url!} alt={movie.titulo} />
        
                                    <span className="search-movie-info">
                                        <strong>{movie.titulo}</strong>
                                        <small>
                                           {movie.ano_publicacion}
                                        </small>
                                    </span>

                                    <span className="search-check">
                                        {isSelected(movie.id_obra) ? "✓" : "+"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* CONTENIDO PRINCIPAL */}
                <main className="onboarding-main">
                    <div className="onboarding-topbar">
                        <button type="button" className="skip-button" onClick={handleSkip} disabled={saving}>
                            Saltar <span>→</span>
                        </button>
                    </div>

                    <div className="onboarding-intro">
                        <h1>
                            ¿Qué películas
                            <br />
                            <span>te gustan?</span>
                        </h1>

                        <p>
                            Selecciona las películas que más te gustan.
                            Utilizaremos tus preferencias para crear
                            recomendaciones y conexiones.
                        </p>
                    </div>

                    <div className="popular-heading">
                        <div>
                            <h2>Películas populares</h2>
                            <p>
                                Las favoritas de la comunidad Graphflix
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="onboarding-error">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="onboarding-loading">
                            Cargando películas...
                        </div>
                    ) : popularMovies.length === 0 ? (
                        <div className="onboarding-empty">
                            No hay películas populares disponibles.
                        </div>
                    ) : (
                        <div className="movies-grid">
                            {popularMovies.map(renderMovie)}
                        </div>
                    )}
                </main>
            </div>

            <div className="onboarding-footer">
                <p>
                    {canContinue
                        ? `Has seleccionado ${selectedMovies.length} películas.`
                        : `Selecciona al menos ${MIN_ONBOARDING_MOVIES} películas para continuar (${selectedMovies.length}/${MIN_ONBOARDING_MOVIES}).`}
                </p>

                <button
                    type="button"
                    className="continue-button"
                    disabled={!canContinue || saving}
                    onClick={handleContinue}
                >
                    {saving ? "Guardando..." : "Continuar"}
                    {!saving && <span>→</span>}
                </button>
            </div>
        </div>
    );
}