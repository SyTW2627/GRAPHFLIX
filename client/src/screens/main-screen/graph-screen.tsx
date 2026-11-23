import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserHeader from "../../components/UserHeader/UserHeader";
import SideBar, { type Filters, type Summary } from "../../components/SideBar/SideBar";
import FavoritePanel from "../../components/FavoritePanel/FavoritePanel";
import Graph from "../../components/Graph/graph";
import { getStoreUSer } from "../../services/auth.service";
import { getMapGraph, getUserMaps, SessionExpiredError, type GraphResponse } from "../../services/graph.service";
import { addFavorite, getFavorites, removeFavorite, type Favorite } from "../../services/favorite.service";
import { searchMovies, type MovieResult } from "../../services/movie.service";
import "./graph-screen.css";

const INITIAL_FILTERS: Filters = { genre: "Todos", director: "", actores: "", from: "", to: "" };
const EMPTY_GRAPH: GraphResponse = { isColdStart: true, nodes: [], edges: [] };

function GraphScreen() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // buscador
  const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const user = getStoreUSer();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const userMaps = await getUserMaps();
        if (cancelled) return;

        // cada usuario tiene un solo mapa
        const userMap = userMaps[0] ?? null;

        if (userMap) {
          const graphData = await getMapGraph(userMap.id_mapa);
          if (!cancelled) setGraph(graphData);
        } else {
          setGraph(EMPTY_GRAPH);
        }

        const favs = await getFavorites(user!.id_usuario);
        if (!cancelled) setFavorites(favs);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof SessionExpiredError) {
          navigate("/login", { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : "Error al cargar la pantalla");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const filtersActive =
    filters.genre !== "Todos" || !!filters.director || !!filters.actores || !!filters.from || !!filters.to;
  const searchActive = search.trim().length >= 2 || filtersActive;

  // cancela la petición anterior si el usuario sigue escribiendo
  useEffect(() => {
    if (!searchActive) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchMovies(
          {
            q: search,
            genre: filters.genre === "Todos" ? "" : filters.genre,
            director: filters.director,
            actor: filters.actores,
            from: filters.from,
            to: filters.to,
          },
          controller.signal
        );
        setSearchResults(results);
        setActionError("");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchResults([]);
        setActionError(err instanceof Error ? err.message : "Error al buscar películas");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, filters, searchActive]);

  // recargar favoritos y el mapa del usuario
  const refreshAfterFavoriteChange = async (idUsuario: number) => {
    setFavorites(await getFavorites(idUsuario));

    const userMaps = await getUserMaps();
    const userMap = userMaps[0] ?? null;

    if (!userMap) {
      // sin favoritas, el backend borra el mapa
      setGraph(EMPTY_GRAPH);
      return;
    }

    setGraph(await getMapGraph(userMap.id_mapa));
  };

  const handleToggleFavorite = async (movie: MovieResult) => {
    const user = getStoreUSer();
    if (!user || pendingFavoriteId !== null) return;

    const isFavorite = favorites.some((f) => f.id_obra === movie.id_obra);

    setPendingFavoriteId(movie.id_obra);
    setActionError("");

    try {
      if (isFavorite) {
        await removeFavorite(user.id_usuario, movie.id_obra);
      } else {
        await addFavorite(movie.id_obra);
      }
      await refreshAfterFavoriteChange(user.id_usuario);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        navigate("/login", { replace: true });
        return;
      }
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar favoritos");
    } finally {
      setPendingFavoriteId(null);
    }
  };

  const handleOpenMovie = (idObra: number) => navigate(`/pelicula/${idObra}`);

  const summary: Summary = {
    movies: graph ? graph.nodes.filter((n) => n.id_obra !== null).length : 0,
    favorites: favorites.length,
    connections: graph ? graph.edges.filter((e) => e.source !== 0).length : 0,
    genres: graph?.total_generos ?? 0,
  };

  const hayPeliculas = graph !== null && graph.nodes.some((n) => n.id_obra !== null);

  return (
    <div className="graph-screen">
      <UserHeader />

      <div className="graph-layout">
        <SideBar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
          summary={summary}
          searchActive={searchActive}
          searching={searching}
          searchResults={searchResults}
          favoriteIds={favorites.map((f) => f.id_obra)}
          pendingFavoriteId={pendingFavoriteId}
          actionError={actionError}
          onToggleFavorite={handleToggleFavorite}
          onOpenMovie={handleOpenMovie}
        />

        <main className="graph-main">
          <div className="graph-canvas">
            {loading && <p className="graph-placeholder">Cargando grafo…</p>}
            {!loading && error && <p className="graph-placeholder graph-error">{error}</p>}
            {!loading && !error && graph && !hayPeliculas && (
              <p className="graph-placeholder">
                Todavía no hay películas para mostrar. Añade algunas a favoritos.
              </p>
            )}
            {!loading && !error && graph && hayPeliculas && (
              <>
                <Graph nodes={graph.nodes} edges={graph.edges} onSelectMovie={handleOpenMovie} />
                {graph.isColdStart && (
                  <p className="graph-notice">
                    Estas son las películas más populares. Añade favoritas para ver recomendaciones.
                  </p>
                )}
              </>
            )}
          </div>
        </main>

        <FavoritePanel
          isOpen={favoritesOpen}
          onToggle={() => setFavoritesOpen((v) => !v)}
          favorites={favorites}
        />
      </div>
    </div>
  );
}

export default GraphScreen;