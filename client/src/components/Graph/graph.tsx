import { useEffect, useRef } from "react";
import { Network, type Edge, type Node, type Options } from "vis-network";
import type { GraphEdge, GraphNode } from "../../services/graph.service";
import logo from "../../assets/logo-graphflix.png";
import "./graph.css";

interface GraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectMovie?: (idObra: number) => void;
}

// nodo central
const CENTRAL_ID = 0;

// imagen de respaldo
const PLACEHOLDER = "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
      '<rect width="100" height="100" fill="#e4e1ee"/>' +
      '<text x="50" y="62" font-size="44" text-anchor="middle" fill="#8a85a3">?</text>' +
      "</svg>"
  );

// tamaño de cada nodo
function sizeForLevel(nivel: number): number {
  if (nivel === 0) return 50; // favoritas
  if (nivel === 1) return 30;
  return 22;
}

// Convierte un nodo del servidor en un nodo de vis-network
function toVisNode(n: GraphNode): Node {
  if (n.id_nodo === CENTRAL_ID) {
    return {
      id: CENTRAL_ID,
      shape: "image",
      image: logo,
      brokenImage: PLACEHOLDER,
      size: 40,
      x: n.pos_x,
      y: n.pos_y,
      borderWidth: 0,
      shapeProperties: { useBorderWithImage: false }
    };
  }

  const titulo = n.titulo ?? "Sin título";
  const esFavorita = n.nivel === 0;

  return {
    id: n.id_nodo,
    title: n.ano_publicacion ? `${titulo} (${n.ano_publicacion})` : titulo,
    shape: "image",
    image: n.imagen_url ?? PLACEHOLDER,
    brokenImage: PLACEHOLDER,
    size: sizeForLevel(n.nivel),
    borderWidth: esFavorita ? 2 : 2,
    x: n.pos_x,
    y: n.pos_y,
    color: {
      border: esFavorita ? "#6d3fd9" : "#cac9e6",
      highlight: { border: "#6d3fd9" },
      hover: { border: "#6d3fd9" },
    },
  };
}

// convierte una arista del servidor { source, destiny } en una de vis { from, to }
function toVisEdge(e: GraphEdge, index: number): Edge {
  const desdeCentro = e.source === CENTRAL_ID;
  return {
    id: index,
    from: e.source,
    to: e.destiny,
    width: 6,
    color: { color: desdeCentro ? "#6d3fd9" : "#cfc9e6", highlight: "#6d3fd9" },
  };
}

const OPTIONS: Options = {
  physics: false,
  interaction: { hover: true, tooltipDelay: 150, zoomView: true, dragView: true },
  nodes: {
    font: { size: 12, color: "#1d1b2b" },
    shapeProperties: { useBorderWithImage: true },
  },
  edges: { width: 1, smooth: false },
};

function Graph({ nodes, edges, onSelectMovie }: GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectMovieRef = useRef(onSelectMovie);
  
  useEffect(() => {
    onSelectMovieRef.current = onSelectMovie;
  }, [onSelectMovie]);

  useEffect(() => {
    if (!containerRef.current) return;

    const network = new Network(
      containerRef.current,
      {
        nodes: nodes.map(toVisNode),
        edges: edges.map(toVisEdge),
      },
      OPTIONS
    );

    // lo centra en la pantalla
    network.once("afterDrawing", () => network.fit({ animation: false }));

    network.on("click", (params) => {
      if (params.nodes.length === 0) return;
        const clicked = nodes.find((n) => n.id_nodo === params.nodes[0]);
        if (!clicked || clicked.id_nodo === CENTRAL_ID || clicked.id_obra === null) return;
        onSelectMovieRef.current?.(clicked.id_obra);
    });

    network.on("hoverNode", (params) => {
      if (params.node !== CENTRAL_ID) containerRef.current!.style.cursor = "pointer";
    });
    network.on("blurNode", () => {
      containerRef.current!.style.cursor = "default";
    });

    return () => network.destroy();
  }, [nodes, edges]);

  return <div ref={containerRef} className="graph-vis" />;
}

export default Graph;