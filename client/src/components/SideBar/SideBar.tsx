import { useState } from "react";
import type { MovieResult } from "../../services/movie.service";
import type { FilterOptions, GraphFilters } from "../../utils/filterGraph";
import { hasActiveFilters, INITIAL_FILTERS } from "../../utils/filterGraph";
import "./SideBar.css";

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
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  filterOptions: FilterOptions;
  summary: Summary;
  // buscador
  searchActive: boolean;
  searching: boolean;
  searchResults: MovieResult[];
  favoriteIds: number[];
  pendingFavoriteId: number | null;
  actionError: string;
  onToggleFavorite: (movie: MovieResult) => void;
  onOpenMovie: (idObra: number) => void;
}

type ListKey = "genres" | "directors" | "actors";

interface CheckListProps {
  legend: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
}

// lista de casillas con tic (con buscador opcional para listas largas)
function CheckList({ legend, options, selected, onChange, searchable = false }: CheckListProps) {
  const [query, setQuery] = useState("");

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  return (
    <fieldset className="filter-group">
      <legend className="sidebar-label">
        {legend}
        {selected.length > 0 && <span className="filter-count">{selected.length}</span>}
      </legend>

      {searchable && (
        <input
          type="search"
          className="sidebar-input filter-search"
          placeholder={`Buscar ${legend.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Buscar en ${legend}`}
        />
      )}

      <div className="filter-checklist">
        {options.length === 0 && <p className="search-message">Sin opciones en este mapa.</p>}
        {options.length > 0 && visible.length === 0 && <p className="search-message">Sin resultados.</p>}
        {visible.map((opt) => (
          <label key={opt} className="filter-check">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SideBar({
  isOpen,
  onToggle,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  filterOptions,
  summary,
  searchActive,
  searching,
  searchResults,
  favoriteIds,
  pendingFavoriteId,
  actionError,
  onToggleFavorite,
  onOpenMovie,
}: SideBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  // para cambiar filtro
  const updateList = (key: ListKey, value: string[]) =>
    onFiltersChange({ ...filters, [key]: value });
  const updateYear = (key: "from" | "to", value: string) =>
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
                        <span
                          className="search-item-title search-item-title--link"
                          role="link"
                          tabIndex={0}
                          onClick={() => onOpenMovie(movie.id_obra)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onOpenMovie(movie.id_obra);
                          }}
                        >
                          {movie.titulo}
                        </span>
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
                <CheckList
                  legend="Género"
                  options={filterOptions.genres}
                  selected={filters.genres}
                  onChange={(v) => updateList("genres", v)}
                />
                <CheckList
                  legend="Director"
                  options={filterOptions.directors}
                  selected={filters.directors}
                  onChange={(v) => updateList("directors", v)}
                  searchable
                />
                <CheckList
                  legend="Actores"
                  options={filterOptions.actors}
                  selected={filters.actors}
                  onChange={(v) => updateList("actors", v)}
                  searchable
                />

                <span className="sidebar-label">Periodo</span>
                <div className="sidebar-range">
                  <input
                    type="number"
                    className="sidebar-input"
                    placeholder="desde"
                    aria-label="Año desde"
                    value={filters.from}
                    onChange={(e) => updateYear("from", e.target.value)}
                  />
                  <input
                    type="number"
                    className="sidebar-input"
                    placeholder="hasta"
                    aria-label="Año hasta"
                    value={filters.to}
                    onChange={(e) => updateYear("to", e.target.value)}
                  />
                </div>
                {hasActiveFilters(filters) && (
                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => onFiltersChange(INITIAL_FILTERS)}
                  >
                    Limpiar filtros
                  </button>
                )}
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
        </div>
      )}
    </aside>
  );
}

export default SideBar;