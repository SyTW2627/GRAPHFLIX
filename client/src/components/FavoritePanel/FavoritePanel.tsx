
import { type Favorite, removeFavorite } from "../../services/favorite.service"; 
import "./FavoritePanel.css";

interface FavoritePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  favorites: Favorite[];
  onRemoveFavorite: () => void;
  onSelectMovie: (id_obra: number) => void;
  userId: number;
}

function FavoritePanel({ isOpen, onToggle, userId, favorites, onRemoveFavorite, onSelectMovie }: FavoritePanelProps) {
  const handleRemoveFavorite = async (e: React.MouseEvent, id_obra: number) => {
    e.stopPropagation(); // Evita que el clic se propague al contenedor del favorito
    try {
      await removeFavorite(userId, id_obra); 
      onRemoveFavorite();
    }
    catch(error) {
      console.error("Error al eliminar de favoritos:", error);
    }
  }
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
                  <div className="favorite-card" 
                        onClick={() => onSelectMovie(movie.id_obra)}
                        title={movie.titulo}
                  >
                    {movie.imagen_url ? (
                      <img src={movie.imagen_url} alt={`Póster de ${movie.titulo}`} />
                    ) : (
                      <span className="favorite-card-placeholder">{movie.titulo}</span>
                    )}

                    <button className="favorite-card-remove" 
                        onClick={(e) => handleRemoveFavorite(e, movie.id_obra)}
                        aria-label={`Quitar ${movie.titulo} de favoritos`}
                        title={`Quitar ${movie.titulo} de favoritos`}
                    >
                      ✕
                    </button>
                  </div>
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