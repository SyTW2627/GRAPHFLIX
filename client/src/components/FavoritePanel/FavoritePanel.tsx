import type { Favorite } from "../../services/favorite.service"; 
import "./FavoritePanel.css";

interface FavoritePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  favorites: Favorite[];
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
                <li key={movie.id_obra}>
                  <button
                    className="favorite-card"
                    title={movie.titulo}
                  >
                    {movie.imagen_url ? (
                      <img src={movie.imagen_url} alt={`Póster de ${movie.titulo}`} />
                    ) : (
                      <span className="favorite-card-placeholder">{movie.titulo}</span>
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