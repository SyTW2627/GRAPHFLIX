import {NodeRepository} from "./NodeRepository";
import type {Node, UpdateNode, CreateNode} from "./node.model";

export class NodeService {
    constructor(private nodeRepository: NodeRepository) {}

    async createNode(node: CreateNode, id_user: number): Promise<Node> {
        const map = await this.nodeRepository.findNodesByMapId(node.id_mapa, id_user);
        if (!map) {
            throw new Error(`No se ha encontrado un mapa con id ${node.id_mapa} para el usuario con id ${id_user}`);
        }
        return await this.nodeRepository.createNode(node);
    }

    async updateNode(node: UpdateNode): Promise<void> {
        const existingNode = await this.nodeRepository.findNodeById(node.id_nodo);
        if (!existingNode) {
            throw new Error(`No se ha encontrado un nodo con id ${node.id_nodo}`);
        }
        await this.nodeRepository.updateNode(node);
    }

    async findNodeById(id_nodo: number) {
        return await this.nodeRepository.findNodeById(id_nodo);
    }

    async findNodesByMapId(id_mapa: number, id_user: number): Promise<Node[]> {
        const map = await this.nodeRepository.findNodesByMapId(id_mapa, id_user);
        if (!map) {
            throw new Error(`No se ha encontrado un mapa con id ${id_mapa} para el usuario con id ${id_user}`);
        }
        return await this.nodeRepository.findNodesByMapId(id_mapa, id_user);
    }

    async deleteNode(id_nodo: number): Promise<Node | undefined> {
        const existingNode = await this.findNodeById(id_nodo);
        if (!existingNode) {
            throw new Error(`No se ha encontrado un nodo con id ${id_nodo}`);
        }
        return await this.nodeRepository.deleteNode(id_nodo);
    }

    async createManyNodes(nodes: CreateNode[]): Promise<Node[]> {
        if (nodes.length === 0) {
            throw new Error("No se proporcionaron nodos para crear");
        }
        return await this.nodeRepository.createManyNodes(nodes);
    }   
}