import { sql } from "../../db/db";
import type {Node, UpdateNode, CreateNode} from "./node.model";
import {MapRepository} from "../map/MapRepository";
import {MapService} from "../map/MapService";

const mapRepository = new MapRepository();
const mapService = new MapService(mapRepository);

export class NodeRepository {
    async createNode(node: CreateNode): Promise<Node> {
        const [newNode]= await sql<Node[]>`
            INSERT INTO nodo (id_obra, id_mapa, pos_x, pos_y)
            VALUES (${node.id_obra}, ${node.id_mapa}, ${node.pos_x}, ${node.pos_y})
            RETURNING *
        `;

        if (!newNode) throw new Error("Error al crear el nodo en la base de datos");
        return newNode;
    }

    async updateNode(node: UpdateNode): Promise<void> {
        if (node.pos_x === undefined || node.pos_y === undefined) {
            throw new Error("No se proporcionaron valores para actualizar el nodo");
        }
        await sql`
            UPDATE nodo
            SET pos_x = ${node.pos_x},
                pos_y = ${node.pos_y}
            WHERE id_nodo = ${node.id_nodo}
        `;
    }

    async findNodeById(id_nodo: number){
        const [node] = await sql `
            SELECT *
            FROM nodo
            WHERE id_nodo = ${id_nodo};
        `;
        if (!node) {
            throw new Error(`No se ha encontrado el nodo con id ${id_nodo}`);
        }
        return node;
    }

    async findNodesByMapId(id_mapa: number, id_user: number): Promise<Node[]> {
        const nodes: Node[] = await sql `
            SELECT *
            FROM nodo 
            WHERE id_mapa = ${id_mapa} AND id_usuario = ${id_user}
        `;
        if (!nodes || nodes.length === 0) {
            throw new Error(`No se han encontrado nodos para el mapa con id ${id_mapa}`);
        }
        return nodes;
    }

    async deleteNode(id_nodo: number): Promise<Node | undefined> {
        const [deleted] = await sql<Node[]>`
            DELETE FROM nodo
            WHERE id_nodo = ${id_nodo}
            RETURNING *
        `;
        return deleted;
    }

    async createManyNodes(nodes: CreateNode[]): Promise<Node[]> {
        if (nodes.length === 0) return [];
        return await sql<Node[]>`
            INSERT INTO nodo ${sql(nodes, 'id_obra', 'id_mapa', 'pos_x', 'pos_y')}
            RETURNING *
        `;
    }

}