import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserHeader from "../../components/UserHeader/UserHeader";
import SideBar, { type Summary } from "../../components/SideBar/SideBar";
import FavoritePanel from "../../components/FavoritePanel/FavoritePanel";
import Graph from "../../components/Graph/graph";
import { getStoreUSer } from "../../services/auth.service";
import { getMapGraph, getUserMaps, SessionExpiredError, type GraphResponse } from "../../services/graph.service";
import { addFavorite, getFavorites, removeFavorite, type Favorite } from "../../services/favorite.service";
import { searchMovies, type MovieResult } from "../../services/movie.service";
import { filterGraph, loadFilters, saveFilters, getFilterOptions, type GraphFilters } from "../../utils/filterGraph";
import "./graph-screen.css";

const EMPTY_GRAPH: GraphResponse = { isColdStart: true, nodes: [], edges: [] };

function GraphScreen() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<GraphFilters>(loadFilters);

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

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

 // los filtros afectan al grafo
  const searchActive = search.trim().length >= 2;

  const filterOptions = useMemo(() => getFilterOptions(graph?.nodes ?? []), [graph]);
  
  const visibleGraph = useMemo(
    () => (graph ? filterGraph(graph, filters) : null),
    [graph, filters]
  );

  const visibleGenres = useMemo(() => {
    if (!visibleGraph) return 0;
    const set = new Set<string>();
    for (const node of visibleGraph.nodes) {
      if (node.id_obra === null) continue; // ignora nodos que no son películas
      node.generos?.forEach((g) => set.add(g));
    }
    return set.size;
  }, [visibleGraph]);

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
          { q: search },
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
  }, [search, searchActive]);

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
    movies: visibleGraph ? visibleGraph.nodes.filter((n) => n.id_obra !== null).length : 0,
    favorites: favorites.length,
    connections: visibleGraph ? visibleGraph.edges.filter((e) => e.source !== 0).length : 0,
    genres: visibleGenres,
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
          filterOptions={filterOptions}
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
            {!loading && !error && graph && visibleGraph && hayPeliculas && summary.movies === 0 && (
              <p className="graph-placeholder">Ninguna película cumple los filtros seleccionados.</p>
            )}
            {!loading && !error && graph && visibleGraph && hayPeliculas && summary.movies > 0 && (
              <>
                <Graph nodes={visibleGraph.nodes} edges={visibleGraph.edges} onSelectMovie={handleOpenMovie} />
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
          userId={getStoreUSer()?.id_usuario!}
          onRemoveFavorite={ async () => {
            const user = getStoreUSer();
            if (!user) return;
            try {
              await refreshAfterFavoriteChange(user.id_usuario);
            }
            catch (error) {
              if (error instanceof SessionExpiredError) {
                navigate("/login", { replace: true });
                return;
              }
              console.error("Error al actualizar después de cambiar favoritos:", error);
            }
          }} 
          onSelectMovie={handleOpenMovie}
        />
      </div>
    </div>
  );
}

export default GraphScreen;