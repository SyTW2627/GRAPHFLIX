import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import UserHeader from "../../components/UserHeader/UserHeader";
import { getStoreUSer } from "../../services/auth.service";
import { getMovieById, type MovieDetail } from "../../services/movie.service";
import "./MovieScreen.css";

// TMDB sirve la misma portada en más resolución cambiando el tamaño en la URL
const bigPoster = (url: string) => url.replace("/w342/", "/w500/");

function MovieScreen() {
  const { id_obra } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoreUSer()) {
      navigate("/login", { replace: true });
      return;
    }

    const id = Number(id_obra);
    if (!Number.isInteger(id) || id <= 0) {
      setMovie(null);
      setError("Película no válida");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setMovie(null);
    setError("");
    setLoading(true);

    getMovieById(id, controller.signal)
      .then(setMovie)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Error al cargar la película");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id_obra, navigate]);

  // si hay historial vuelve atrás (grafo con su estado); si no, va al grafo
  const handleBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/grafo");
  };

  return (
    <div className="movie-screen">
      <UserHeader />

      <main className="movie-main">
        <button className="movie-back" onClick={handleBack}>
          <ArrowLeft size={18} />
          Volver al grafo
        </button>

        {loading && <p className="movie-message">Cargando película…</p>}
        {!loading && error && <p className="movie-message movie-message--error">{error}</p>}

        {!loading && !error && movie && (
          <>
            <header className="movie-hero">
              <h1 className="movie-title">{movie.titulo}</h1>
            </header>

            <div className="movie-layout">
              <div className="movie-poster-wrap">
                {movie.imagen_url ? (
                  <img
                    className="movie-poster"
                    src={bigPoster(movie.imagen_url)}
                    alt={`Póster de ${movie.titulo}`}
                    onError={(e) => {
                      if (movie.imagen_url && e.currentTarget.src !== movie.imagen_url) {
                        e.currentTarget.src = movie.imagen_url;
                      }
                    }}
                  />
                ) : (
                  <div className="movie-poster movie-poster--empty">{movie.titulo}</div>
                )}
              </div>

              <div className="movie-details-column">
                <section className="movie-card">
                  <h2 className="movie-card-title">Sinopsis</h2>
                  <p className="movie-synopsis">
                    {movie.descripcion ?? "Sin sinopsis disponible."}
                  </p>
                </section>

                <section className="movie-card">
                  <h2 className="movie-card-title">Temas</h2>
                  {movie.generos.length > 0 ? (
                    <ul className="movie-chips">
                      {movie.generos.map((g) => (
                        <li key={g} className="movie-chip">{g}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="movie-empty">No hay temas registrados.</p>
                  )}
                </section>

                <section className="movie-card">
                  <h2 className="movie-card-title">Cast</h2>
                  {movie.reparto.length > 0 ? (
                    <ul className="movie-chips">
                      {movie.reparto.map((a) => (
                        <li key={a} className="movie-chip movie-chip--soft">{a}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="movie-empty">No hay reparto registrado.</p>
                  )}
                </section>

                <section className="movie-card">
                  <h2 className="movie-card-title">Detalles</h2>
                  <dl className="movie-details">
                    <dt>Año</dt>
                    <dd>{movie.ano_publicacion ?? "—"}</dd>

                    <dt>{movie.directores.length > 1 ? "Directores" : "Director"}</dt>
                    <dd>{movie.directores.length > 0 ? movie.directores.join(", ") : "—"}</dd>

                    {movie.sagas.length > 0 && (
                      <>
                        <dt>Saga</dt>
                        <dd>{movie.sagas.join(", ")}</dd>
                      </>
                    )}
                  </dl>
                </section>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MovieScreen;