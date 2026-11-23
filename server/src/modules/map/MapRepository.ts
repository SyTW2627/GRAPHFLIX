import type { Map, NewMap, UpdateMap } from "./map.model";
import type { Arista } from "./map.model";
import { sql } from "../../db/db";

export class MapRepository {
    async createMap(map: NewMap): Promise<Map> {
        const [newMap] = await sql`
            INSERT INTO mapa (tipo_mapa, nombre_mapa, id_usuario)
            VALUES (${map.tipo_mapa ?? null}, ${map.nombre_mapa ?? null}, ${map.id_usuario})
            RETURNING *`;
        return newMap as Map;
    }

    async findById(id: number): Promise<Map | undefined> {
        const [map] = await sql`
            SELECT *
            FROM mapa
            WHERE id_mapa = ${id}
        `;
        return map as Map;
    }

    async findByUserId(id_usuario: number): Promise<Map[]> {
        const maps = await sql<Map[]>`
            SELECT *
            FROM mapa
            WHERE id_usuario = ${id_usuario}
            ORDER BY id_mapa;
        `;
        return maps;
    }

    async update(id: number, data: UpdateMap): Promise<Map | undefined> {
        const [map] = await sql`
           UPDATE mapa
            SET
                tipo_mapa = COALESCE(${data.tipo_mapa ?? null}, tipo_mapa),
                nombre_mapa = COALESCE(${data.nombre_mapa ?? null}, nombre_mapa)
            WHERE id_mapa = ${id}
            RETURNING *;
        `;
        return map as Map;
    }

    async delete(id: number): Promise<boolean> {
        const result = await sql`
        DELETE FROM mapa
        WHERE id_mapa = ${id}
        RETURNING id_mapa;
        `;
        return result.length > 0;
    } 

    async createEdges(edges: { nodo_origen: number; nodo_destino: number }[]): Promise<Arista[]> {
        if (edges.length === 0) {
            throw new Error("No se proporcionaron aristas para crear");
        }
        const aristas = await sql<Arista[]>`
            INSERT INTO arista ${sql(edges, "nodo_origen", "nodo_destino")}
            RETURNING *;
        `;
        return aristas;
    }

    async getNodesWithInfoByMapId(mapId: number, userId: number) {
        return await sql`
            SELECT 
                n.id_nodo,
                n.id_obra,
                n.id_mapa,
                n.pos_x,
                n.pos_y,
                o.titulo,
                o.ano_publicacion,
                o.descripcion,
                o.imagen_url,
                (f.id_obra IS NOT NULL) AS es_favorita
            FROM nodo n
            JOIN obra o ON n.id_obra = o.id_obra
            LEFT JOIN favorita f ON f.id_obra = n.id_obra AND f.id_usuario = ${userId}
            WHERE n.id_mapa = ${mapId}
            ORDER BY n.id_nodo;
        `;
    }

    async getEdgesByMapId(mapId: number): Promise<Arista[]> {
        return await sql<Arista[]>`
            SELECT DISTINCT a.nodo_origen, a.nodo_destino
            FROM arista a
            JOIN nodo n ON a.nodo_origen = n.id_nodo
            WHERE n.id_mapa = ${mapId};
        `;
    }

    async countGenresByMapId(mapId: number): Promise<number> {
        const [row] = await sql`
            SELECT COUNT(DISTINCT go.id_genero)::int AS total
            FROM nodo n
            JOIN genero_obra go ON go.id_obra = n.id_obra
            WHERE n.id_mapa = ${mapId};
        `;
        return Number(row?.total ?? 0);
    }
}