
import type { MovieResult } from "../../services/movie.service";
import "./OnboardingSidebar.css";

interface OnboardingSidebarProps {
    search: string;
    onSearchChange: (value: string) => void;
    results: MovieResult[];
    searching: boolean;
    searchActive: boolean;
    selectedIds: number[];
    onSelectMovie: (movie: MovieResult) => void;
}

function OnboardingSidebar({
    search,
    onSearchChange,
    results,
    searching,
    searchActive,
    selectedIds,
    onSelectMovie,
}: OnboardingSidebarProps) {

    return (
        <aside className="onboarding-sidebar">
            <div className="onboarding-sidebar-content">

                <h2>Encuentra tus películas</h2>

                <p>
                    Busca y añade las películas que más te gustan.
                </p>

                <label htmlFor="onboarding-search">
                    Buscar películas
                </label>

                <input
                    id="onboarding-search"
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Ej. Interstellar..."
                />

                {searchActive && (
                    <section className="onboarding-search-results">
                        <h3>Resultados</h3>

                        {searching && <p>Buscando...</p>}

                        {!searching && results.length === 0 && (
                            <p>No se encontraron películas.</p>
                        )}

                        {results.map((movie) => {
                            const selected = selectedIds.includes(
                                movie.id_obra
                            );

                            return (
                                <div
                                    className="onboarding-result"
                                    key={movie.id_obra}
                                >
                                    {movie.imagen_url ? (
                                        <img
                                            src={movie.imagen_url}
                                            alt={movie.titulo}
                                        />
                                    ) : (
                                        <div className="onboarding-result-empty">
                                            Sin imagen
                                        </div>
                                    )}

                                    <div className="onboarding-result-info">
                                        <strong>{movie.titulo}</strong>
                                        <span>
                                            {movie.ano_publicacion}
                                        </span>
                                    </div>

                                    <button
                                        className={selected ? "active" : ""}
                                        onClick={() => onSelectMovie(movie)}
                                        aria-label="Seleccionar película"
                                    >
                                        {selected ? "✓" : "+"}
                                    </button>
                                </div>
                            );
                        })}
                    </section>
                )}

            </div>
        </aside>
    );
}

export default OnboardingSidebar;
