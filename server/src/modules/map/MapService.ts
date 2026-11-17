import type { Map, NewMap, UpdateMap, Arista } from "./map.model"
import type { MapRepository } from "./MapRepository";
import { NotFoundError } from "../../errors/AppError";

export class MapService {
  
  public constructor(private mapRepository: MapRepository) {}

  private async getOwnedMap(id: number, userId: number): Promise<Map> {
    const map = await this.mapRepository.findById(id);
    if (!map || map.id_usuario !== userId) {
      throw new NotFoundError("Mapa");
    }
    return map;
  }

  async createMap(data: NewMap): Promise<Map> {
    return this.mapRepository.createMap(data);
  }

  async getMapsByUser(userId: number): Promise<Map[]> {
    return this.mapRepository.findByUserId(userId);
  }

  async getMapById(id: number, userId: number): Promise<Map> {
    return this.getOwnedMap(id, userId);
  }

  async updateMap(id: number, userId: number, data: UpdateMap): Promise<Map> {
    await this.getOwnedMap(id, userId);

    const updated = await this.mapRepository.update(id, data);
    if (!updated) {
      throw new Error("No se pudo actualizar el mapa");
    }
    return updated;
  }

  async deleteMap(id: number, userId: number): Promise<boolean> {
    await this.getOwnedMap(id, userId);
    return this.mapRepository.delete(id);
  }

  async createMapEdges(edges: { nodo_origen: number; nodo_destino: number }[]): Promise<Arista[]> {
    if (edges.length === 0) {
      throw new Error("No se proporcionaron aristas para crear");
    }
    return await this.mapRepository.createEdges(edges);
  }

  async getFullGraph(mapId: number, userId: number) {
        await this.getOwnedMap(mapId, userId);

        // obtener nodos y aristas
        const nodosBD = await this.mapRepository.getNodesWithInfoByMapId(mapId, userId);
        const aristasBD = await this.mapRepository.getEdgesByMapId(mapId);

        const nodosPeliculas = nodosBD.map((n) => {
            const posX = Number(n.pos_x);
            const posY = Number(n.pos_y);
            
            // Reconstruir el nivel según el radio base (140px) usado en calculatePositions.ts
            const distanciaCentro = Math.hypot(posX - 500, posY - 400);
            const nivel = Math.max(0, Math.round(distanciaCentro / 140) - 1);

            return {
                id_nodo: Number(n.id_nodo),
                id_obra: Number(n.id_obra),
                id_mapa: Number(n.id_mapa),
                titulo: n.titulo,
                ano_publicacion: n.ano_publicacion,
                descripcion: n.descripcion,
                imagen_url: n.imagen_url,
                nivel,
                pos_x: posX,
                pos_y: posY,
            };
        });

        // nodo central
        const nodoCentral = {
            id_nodo: 0,
            id_obra: null,
            id_mapa: mapId,
            nivel: -1,
            pos_x: 500,
            pos_y: 400,
        };

        // construir aristas
        const nodosFavoritos = nodosBD.filter((n) => n.es_favorita);
        let idsRaiz: number[] = [];

        if (nodosFavoritos.length > 0) {
            idsRaiz = nodosFavoritos.map((n) => Number(n.id_nodo));
        } else {
            idsRaiz = nodosPeliculas
                .filter((n) => Math.hypot(n.pos_x - 500, n.pos_y - 400) <= 150)
                .map((n) => n.id_nodo);
        }

        const aristasCentrales = idsRaiz.map((idNodo) => ({
            source: 0,
            destiny: idNodo,
        }));

        const aristasSimilitud = aristasBD.map((a) => ({
            source: Number(a.nodo_origen),
            destiny: Number(a.nodo_destino),
        }));

        return {
            isColdStart: nodosFavoritos.length === 0,
            id_mapa: mapId,
            nodes: [nodoCentral, ...nodosPeliculas],
            edges: [...aristasCentrales, ...aristasSimilitud],
        };
    }

}