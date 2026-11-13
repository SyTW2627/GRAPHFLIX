import { useState } from "react";
import UserHeader from "../../components/UserHeader/UserHeader";
import SideBar, { type Filters, type Summary } from "../../components/SideBar/SideBar";
import FavoritePanel, { type FavoriteMovie } from "../../components/FavoritePanel/FavoritePanel";
import "./graph-screen.css";

// valores por defecto de los filtros
const INITIAL_FILTERS: Filters = { genre: "Todos", director: "", actores: "", from: "", to: "" };

function GraphScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const [maps, setMaps] = useState<string[]>(["Mapa de clásicos", "Mapa 2", "Mapa 3"]);
  const [activeMap, setActiveMap] = useState(maps[0]);

  // es ejemplo se tienen que usar los datos de la bbdd SOLO PARA VER EL SISEÑO
  //      QUITAR DESPUES
  const favorites: FavoriteMovie[] = [
  {
    id: 1,
    title: "Película de prueba",
    posterUrl: "https://image.tmdb.org/t/p/w342/oixzLjpyaLagLa8UREts1NiHr6F.jpg",
  },
  {
    id: 2,
    title: " prueba2",
    posterUrl: "https://image.tmdb.org/t/p/w342/fHWR3YplPQWciYzxEity2kyDoDn.jpg"
  }
];
  const summary: Summary = { movies: 0, favorites: favorites.length, connections: 0, genres: 0 };
  

  const handleAddMap = () => {
    // solo añade un mapa a la lista 
    const name = `Mapa ${maps.length + 1}`;
    setMaps((prev) => [...prev, name]);
    setActiveMap(name);
  };

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
          maps={maps}
          activeMap={activeMap}
          onSelectMap={setActiveMap}
          onAddMap={handleAddMap}
        />

        <main className="graph-main">
          {/* Para añadirle un titulo arriba*/}
          {/*<h2 className="graph-map-title">{activeMap}</h2>*/}

          <div className="graph-canvas">
            {/* AQUI VA EL GRAFO */}


            <p className="graph-placeholder">Aquí va el grafo ;) </p>
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