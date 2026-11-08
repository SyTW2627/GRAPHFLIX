import { sql } from "../../db/db";
import type {Node, UpdateNode} from "./node.model";

export class NodeRepository {
    async createNode(node: Node): Promise<Node> {
        const [newNode] = await sql`
            INSERT INTO nodo (id_obra, id_mapa, pos_x, pos_y)
            VALUES (${node.id_obra}, ${node.id_mapa}, ${node.pos_x}, ${node.pos_y})
        `;
        return newNode;
    }

    async updateNode(node: UpdateNode): Promise<void> {
        await sql`
            UPDATE nodo
            SET pos_x = ${node.pos_x ?? null}, pos_y = ${node.pos_y ?? null}
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

    async findNodesByMapId(id_mapa: number) {
        const nodes = await sql `
            SELECT *
            FROM nodo
            WHERE id_mapa = ${id_mapa};
        `;
        if (!nodes || nodes.length === 0) {
            throw new Error(`No se han encontrado nodos para el mapa con id ${id_mapa}`);
        }
        return nodes;
    }

    async deleteNode(id_nodo: number) {
        await this.findNodeById(id_nodo); // Verifica si el nodo existe antes de intentar eliminarlo
        if (!id_nodo) {
            throw new Error(`No se ha proporcionado un id válido para eliminar el nodo.`);
        }
        await sql `
            DELETE FROM nodo
            WHERE id_nodo = ${id_nodo};
        `;
    }

    async deleteNodesByMapId(id_mapa: number) {
        await this.findNodesByMapId(id_mapa); // Verifica si existen nodos para el mapa antes de intentar eliminarlos
        //Creo que habria que verificar que el mapa exista antes de eliminar los nodos.
        if (!id_mapa) {
            throw new Error(`No se ha proporcionado un id válido para eliminar los nodos del mapa.`);
        }
        await sql `
            DELETE FROM nodo
            WHERE id_mapa = ${id_mapa};
        `;
    }
}