import type { GraphEdge, GraphNode, GraphResponse } from "../services/graph.service";

export interface GraphFilters {
  genres: string[];
  directors: string[];
  actors: string[];
  from: string;
  to: string;
}

export interface FilterOptions {
  genres: string[];
  directors: string[];
  actors: string[];
}

export const INITIAL_FILTERS: GraphFilters = {
  genres: [],
  directors: [],
  actors: [],
  from: "",
  to: "",
};

const FILTERS_KEY = "graph-filters";

export function loadFilters(): GraphFilters {
  try {
    const raw = sessionStorage.getItem(FILTERS_KEY);
    if (!raw) return INITIAL_FILTERS;
    const p = JSON.parse(raw);
    return {
      genres: Array.isArray(p.genres) ? p.genres : [],
      directors: Array.isArray(p.directors) ? p.directors : [],
      actors: Array.isArray(p.actors) ? p.actors : [],
      from: typeof p.from === "string" ? p.from : "",
      to: typeof p.to === "string" ? p.to : "",
    };
  } catch {
    return INITIAL_FILTERS;
  }
}

export function saveFilters(f: GraphFilters) {
  sessionStorage.setItem(FILTERS_KEY, JSON.stringify(f));
}

export function clearSavedFilters() {
  sessionStorage.removeItem(FILTERS_KEY);
}

export function hasActiveFilters(f: GraphFilters): boolean {
  return f.genres.length > 0 || f.directors.length > 0 || f.actors.length > 0 || !!f.from || !!f.to;
}

// opciones 
export function getFilterOptions(nodes: GraphNode[]): FilterOptions {
  const genres = new Set<string>();
  const directors = new Set<string>();
  const actors = new Set<string>();

  for (const n of nodes) {
    if (n.id_obra === null) continue; // nodo central
    n.generos?.forEach((g) => genres.add(g));
    n.directores?.forEach((d) => directors.add(d));
    n.reparto?.forEach((a) => actors.add(a));
  }

  const sort = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "es"));
  return { genres: sort(genres), directors: sort(directors), actors: sort(actors) };
}

// dentro de una misma categoría: OR
// entre categorías: AND
function matchesAny(selected: string[], values: string[] | undefined): boolean {
  if (selected.length === 0) return true;
  return !!values && values.some((v) => selected.includes(v));
}

function matchesNode(n: GraphNode, f: GraphFilters): boolean {
  if (!matchesAny(f.genres, n.generos)) return false;
  if (!matchesAny(f.directors, n.directores)) return false;
  if (!matchesAny(f.actors, n.reparto)) return false;

  const from = f.from ? Number(f.from) : null;
  const to = f.to ? Number(f.to) : null;
  if (from !== null || to !== null) {
    const year = n.ano_publicacion;
    if (year == null) return false;
    if (from !== null && year < from) return false;
    if (to !== null && year > to) return false;
  }
  return true;
}

export function filterGraph(graph: GraphResponse, f: GraphFilters): GraphResponse {
  if (!hasActiveFilters(f)) return graph;

  // el nodo central (id_obra null) siempre se mantiene
  const nodes = graph.nodes.filter((n) => n.id_obra === null || matchesNode(n, f));
  const kept = new Set(nodes.map((n) => n.id_nodo));
  const edges: GraphEdge[] = graph.edges.filter((e) => kept.has(e.source) && kept.has(e.destiny));

  return { ...graph, nodes, edges };
}
