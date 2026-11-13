import "./FavoritePanel.css";

export interface FavoriteMovie {
  id: number;
  title: string;
  posterUrl?: string;
}

interface FavoritePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  favorites: FavoriteMovie[];
}

function FavoritePanel({ isOpen, onToggle, favorites }: FavoritePanelProps) {
  return (
    <aside className={`favorites ${isOpen ? "" : "favorites--closed"}`}>
      <button
        className="panel-toggle favorites-toggle"
        onClick={onToggle}
        aria-label={isOpen ? "Cerrar favoritos" : "Abrir favoritos"}
        aria-expanded={isOpen}
      >
        {isOpen ? "›" : "❤"}
      </button>

      {isOpen && (
        <div className="favorites-content">
          <h2 className="favorites-title">Favoritos</h2>

          {favorites.length === 0 ? (
            <p className="favorites-empty">
              Aún no tienes favoritas. Dale me gusta a una película del mapa para guardarla aquí.
            </p>
          ) : (
            <ul className="favorites-grid">
              {favorites.map((movie) => (
                <li key={movie.id}>
                  <button
                    className="favorite-card"
                    title={movie.title}
                  >
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt={`Póster de ${movie.title}`} />
                    ) : (
                      <span className="favorite-card-placeholder">{movie.title}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}

export default FavoritePanel;