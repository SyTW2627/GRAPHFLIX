import type { Map, NewMap, UpdateMap } from "./map.model";
import { sql } from "../../db/db";

export class MapRepository {
    async createMap(map: NewMap): Promise<Map> {
        const [newMap] = await sql`
            INSERT INTO mapa (tipo_mapa, nombre_mapa, id_usuario)
            VALUES (${map.tipo_mapa ?? null}, ${map.nombre_mapa ?? null}, ${map.id_usuario})
            RETURNING *`;
        return newMap;
    }

    async findById(id: number): Promise<Map> {
        const [map] = await sql`
            SELECT *
            FROM mapa
            WHERE id_mapa = ${id}
        `;
        if (!map) throw new Error(`No se ha encontrado el mapa con id ${id}`);
        return map;
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

    async update(data: UpdateMap): Promise<Map> {
        const [map] = await sql`
           UPDATE mapa
            SET tipo_mapa = ${data.tipo_mapa ?? null},
                nombre_mapa = ${data.nombre_mapa ?? null}
            WHERE id_mapa = ${data.id_mapa}
            RETURNING *; 
        `;
        if (!map) throw new Error(`No se ha encontrado el mapa con id ${data.id_mapa}`);
        return map;
    }

    async delete(id: number): Promise<boolean> {
        const result = await sql`
        DELETE FROM mapa
        WHERE id_mapa = ${id}
        RETURNING id_mapa;
        `;
        return result.length > 0;
    } 
}