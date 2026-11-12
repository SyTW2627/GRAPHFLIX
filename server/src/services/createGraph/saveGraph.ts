import { MapRepository } from "../../modules/map/MapRepository";
import { MapService } from "../../modules/map/MapService";
import { NodeRepository } from "../../modules/node/NodeRepository";
import { NodeService } from "../../modules/node/NodeService";
import type { Node, CreateNode } from "../../modules/node/node.model";
import type { PeliculaPosicion, Relacion } from "./type-model";
import type { Arista } from "../../modules/map/map.model";

const mapRepository = new MapRepository();
const mapService = new MapService(mapRepository);

const nodeRepository = new NodeRepository();
const nodeService = new NodeService(nodeRepository);

export async function guardarGrafo(
    peliculasConPosicion: PeliculaPosicion[],
    relacionesTotales: Relacion[],
    idUsuario: number,
    tipoMapa: string,
    nombreMapa: string
) {
    // 1. Crear mapa
    const mapa = await mapService.createMap({ tipo_mapa: tipoMapa, nombre_mapa: nombreMapa,id_usuario: idUsuario });

    if (!mapa) throw new Error("No se pudo crear el mapa.");

    // 2. Crear nodos
    const filasNodo: CreateNode[] = peliculasConPosicion.map(p => ({
        pos_x: p.pos_x,
        pos_y: p.pos_y,
        id_mapa: Number(mapa.id_mapa),
        id_obra: Number(p.id_obra)
    }));

    const nodos = filasNodo.length > 0 ? await nodeService.createManyNodes(filasNodo) : [];

    // 3. Relacionar películas con sus nodos
    const obraToNodo = new Map<number, number>( nodos.map(n => [Number(n.id_obra), Number(n.id_nodo)]) );

    // 4. Crear aristas únicas y ordenadas (nodo_destino > nodo_origen)
    const aristasUnicas = new Map<string,{ nodo_origen: number; nodo_destino: number }>();

    for (const r of relacionesTotales) {
        const a = obraToNodo.get(Number(r.obra_origen_id));
        const b = obraToNodo.get(Number(r.obra_destino_id));

        if (!a || !b || a === b) continue;

        const nodo_origen = Math.min(a, b);
        const nodo_destino = Math.max(a, b);

        aristasUnicas.set(`${nodo_origen}-${nodo_destino}`, { nodo_origen, nodo_destino });
    }

    // 5. Insertar aristas
    const listaAristas = [...aristasUnicas.values()];
    const aristas: Arista[] = listaAristas.length > 0 ? await mapService.createMapEdges(listaAristas) : [];

    return {
        mapaCreado: mapa,
        nodosGuardados: nodos,
        aristasGuardadas: aristas
    };
}