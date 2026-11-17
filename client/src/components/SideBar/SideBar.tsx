import { useState } from "react";
import type { MovieResult } from "../../services/movie.service";
import "./SideBar.css";

export interface Filters {
  genre: string;
  director: string;
  actores: string;
  from: string;
  to: string;
}

export interface Summary {
  movies: number;
  favorites: number;
  connections: number;
  genres: number;
}

interface SideBarProps {
  isOpen: boolean;
  onToggle: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  summary: Summary;
  maps: string[];
  activeMap: string;
  onSelectMap: (name: string) => void;
  onAddMap: () => void;
  // buscador
  searchActive: boolean;
  searching: boolean;
  searchResults: MovieResult[];
  favoriteIds: number[];
  pendingFavoriteId: number | null;
  actionError: string;
  onToggleFavorite: (movie: MovieResult) => void;
}

// esto es de ejemplo hay que usar los que estan en la base de datos
const GENRES = ["Todos", "Drama", "Comedia", "Acción", "Terror", "Ciencia ficción"];

function SideBar({
  isOpen,
  onToggle,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  summary,
  maps,
  activeMap,
  onSelectMap,
  onAddMap,
  searchActive,
  searching,
  searchResults,
  favoriteIds,
  pendingFavoriteId,
  actionError,
  onToggleFavorite,
}: SideBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  // para cambiar filtro
  const updateFilter = (key: keyof Filters, value: string) =>
    onFiltersChange({ ...filters, [key]: value });

  return (
    <aside className={`sidebar ${isOpen ? "" : "sidebar--closed"}`}>
      <button
        className="panel-toggle sidebar-toggle"
        onClick={onToggle}
        aria-label={isOpen ? "Cerrar navegación" : "Abrir navegación"}
        aria-expanded={isOpen}
      >
        {isOpen ? "‹" : "☰"}
      </button>

      {isOpen && (
        <div className="sidebar-content">
          <h2 className="sidebar-title">Navegación</h2>

          <label className="sidebar-label sidebar-label--title" htmlFor="sidebar-search">
            Buscar
          </label>
          <input
            id="sidebar-search"
            type="search"
            className="sidebar-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar película..."
          />

          {/* Resultados de búsqueda */}
          {searchActive && (
            <section className="sidebar-card search-results" aria-live="polite">
              <h3 className="sidebar-card-title">Resultados</h3>

              {actionError && <p className="search-message search-message--error">{actionError}</p>}
              {searching && <p className="search-message">Buscando…</p>}
              {!searching && searchResults.length === 0 && !actionError && (
                <p className="search-message">No se encontraron películas.</p>
              )}

              <ul className="search-list">
                {searchResults.map((movie) => {
                  const isFav = favoriteIds.includes(movie.id_obra);
                  const isPending = pendingFavoriteId === movie.id_obra;
                  return (
                    <li key={movie.id_obra} className="search-item">
                      {movie.imagen_url ? (
                        <img className="search-item-poster" src={movie.imagen_url} alt="" />
                      ) : (
                        <span className="search-item-poster search-item-poster--empty" aria-hidden="true">?</span>
                      )}
                      <div className="search-item-info">
                        <span className="search-item-title">{movie.titulo}</span>
                        {movie.ano_publicacion && (
                          <span className="search-item-year">{movie.ano_publicacion}</span>
                        )}
                      </div>
                      <button
                        className={`fav-btn ${isFav ? "fav-btn--active" : ""}`}
                        onClick={() => onToggleFavorite(movie)}
                        disabled={pendingFavoriteId !== null}
                        aria-pressed={isFav}
                        aria-label={
                          isFav
                            ? `Quitar ${movie.titulo} de favoritos`
                            : `Añadir ${movie.titulo} a favoritos`
                        }
                        title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                      >
                        {isPending ? "…" : isFav ? "♥" : "♡"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Filtros */}
          <section className="sidebar-card">
            <button
              className="sidebar-card-header"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              {/** flecha */}
              <span>Filtros</span>
              <svg
                className={`filter-chevron ${filtersOpen ? "filter-chevron--open" : ""}`} viewBox="0 0 24 24" aria-hidden="true"
              >
                <polyline points="5 15 12 8 19 15" />
              </svg>
            </button>

            {filtersOpen && (
              <div className="sidebar-card-body">
                <label className="sidebar-label" htmlFor="filter-genre">
                  Género
                </label>
                <select
                  id="filter-genre"
                  className="sidebar-input"
                  value={filters.genre}
                  onChange={(e) => updateFilter("genre", e.target.value)}
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <label className="sidebar-label" htmlFor="filter-director">
                  Director
                </label>
                <select
                  id="filter-director"
                  className="sidebar-input"
                  value={filters.director}
                  onChange={(e) => updateFilter("director", e.target.value)}
                >
                  <option value="">Todos</option>
                  {/* FLATA cargar directores */}
                </select>

                <label className="sidebar-label" htmlFor="filter-actores">
                  Actores
                </label>
                <select
                  id="filter-actores"
                  className="sidebar-input"
                  value={filters.actores}
                  onChange={(e) => updateFilter("actores", e.target.value)}
                >
                  <option value="">Todos</option>
                  {/* FALTA cargar actores */}
                </select>

                <span className="sidebar-label">Periodo</span>
                <div className="sidebar-range">
                  <input
                    type="number"
                    className="sidebar-input"
                    placeholder="desde"
                    aria-label="Año desde"
                    value={filters.from}
                    onChange={(e) => updateFilter("from", e.target.value)}
                  />
                  <input
                    type="number"
                    className="sidebar-input"
                    placeholder="hasta"
                    aria-label="Año hasta"
                    value={filters.to}
                    onChange={(e) => updateFilter("to", e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Resumen */}
          <section className="sidebar-card">
            <h3 className="sidebar-card-title">Resumen</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>{summary.movies}</strong>
                <span>Películas</span>
              </div>
              <div className="summary-item">
                <strong>{summary.favorites}</strong>
                <span>Favoritas</span>
              </div>
              <div className="summary-item">
                <strong>{summary.connections}</strong>
                <span>Conexiones</span>
              </div>
              <div className="summary-item">
                <strong>{summary.genres}</strong>
                <span>Géneros</span>
              </div>
            </div>
          </section>

          {/* Mapas */}
          <section className="sidebar-card">
            <div className="sidebar-card-header sidebar-card-header--static">
              <h3 className="sidebar-card-title">Mapas</h3>
              <button className="add-map-btn" onClick={onAddMap} aria-label="Crear mapa nuevo">
                +
              </button>
            </div>
            <ul className="maps-list">
              {maps.map((name) => (
                <li key={name}>
                  <button
                    className={`maps-item ${name === activeMap ? "maps-item--active" : ""}`}
                    onClick={() => onSelectMap(name)}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </aside>
  );
}

export default SideBar;