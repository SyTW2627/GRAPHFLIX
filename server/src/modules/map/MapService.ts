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

}