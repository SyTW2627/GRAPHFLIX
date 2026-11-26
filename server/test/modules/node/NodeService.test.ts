import { beforeEach, describe, expect, it, vi } from "vitest";
import { NodeService } from "../../../src/modules/node/NodeService";
import { NodeRepository } from "../../../src/modules/node/NodeRepository";
import type { Node, CreateNode, UpdateNode } from "../../../src/modules/node/node.model";

describe("NodeService", () => {
  let nodeService: NodeService;
  let nodeRepository: {
    createNode: ReturnType<typeof vi.fn>;
    updateNode: ReturnType<typeof vi.fn>;
    findNodeById: ReturnType<typeof vi.fn>;
    findNodesByMapId: ReturnType<typeof vi.fn>;
    deleteNode: ReturnType<typeof vi.fn>;
    createManyNodes: ReturnType<typeof vi.fn>;
  };

  const mockNode: Node = {
    id_nodo: 1,
    id_obra: 10,
    id_mapa: 20,
    pos_x: 100,
    pos_y: 200,
  };

  const createNodeData: CreateNode = {
    id_obra: 10,
    id_mapa: 20,
    pos_x: 100,
    pos_y: 200,
  };

  const updateNodeData: UpdateNode = {
    id_nodo: 1,
    pos_x: 300,
    pos_y: 400,
  };

  beforeEach(() => {
    nodeRepository = {
      createNode: vi.fn(),
      updateNode: vi.fn(),
      findNodeById: vi.fn(),
      findNodesByMapId: vi.fn(),
      deleteNode: vi.fn(),
      createManyNodes: vi.fn(),
    };

    nodeService = new NodeService(
      nodeRepository as unknown as NodeRepository
    );
  });

  describe("createNode()", () => {
    it("debería crear un nodo si el mapa pertenece al usuario", async () => {
      nodeRepository.findNodesByMapId.mockResolvedValue([mockNode]);
      nodeRepository.createNode.mockResolvedValue(mockNode);

      const result = await nodeService.createNode(createNodeData, 5);

      expect(result).toEqual(mockNode);
      expect(nodeRepository.findNodesByMapId).toHaveBeenCalledWith(20, 5);
      expect(nodeRepository.createNode).toHaveBeenCalledWith(createNodeData);
    });

    it("debería lanzar un error si el repositorio no encuentra el mapa", async () => {
      const error = new Error("Mapa no encontrado");
      nodeRepository.findNodesByMapId.mockRejectedValue(error);

      await expect(
        nodeService.createNode(createNodeData, 5)
      ).rejects.toThrow("Mapa no encontrado");

      expect(nodeRepository.createNode).not.toHaveBeenCalled();
    });
  });

  describe("updateNode()", () => {
    it("debería actualizar un nodo existente", async () => {
      nodeRepository.findNodeById.mockResolvedValue(mockNode);
      nodeRepository.updateNode.mockResolvedValue(undefined);

      await expect(
        nodeService.updateNode(updateNodeData)
      ).resolves.toBeUndefined();

      expect(nodeRepository.findNodeById).toHaveBeenCalledWith(1);
      expect(nodeRepository.updateNode).toHaveBeenCalledWith(updateNodeData);
    });

    it("debería lanzar un error si el nodo no existe", async () => {
      nodeRepository.findNodeById.mockRejectedValue(
        new Error("No se ha encontrado el nodo con id 1")
      );

      await expect(
        nodeService.updateNode(updateNodeData)
      ).rejects.toThrow("No se ha encontrado el nodo con id 1");

      expect(nodeRepository.updateNode).not.toHaveBeenCalled();
    });
  });

  describe("findNodeById()", () => {
    it("debería devolver un nodo por su id", async () => {
      nodeRepository.findNodeById.mockResolvedValue(mockNode);

      const result = await nodeService.findNodeById(1);

      expect(result).toEqual(mockNode);
      expect(nodeRepository.findNodeById).toHaveBeenCalledWith(1);
    });

    it("debería propagar el error si el nodo no existe", async () => {
      nodeRepository.findNodeById.mockRejectedValue(
        new Error("No se ha encontrado el nodo con id 1")
      );

      await expect(
        nodeService.findNodeById(1)
      ).rejects.toThrow("No se ha encontrado el nodo con id 1");
    });
  });

  describe("findNodesByMapId()", () => {
    it("debería devolver los nodos de un mapa", async () => {
      nodeRepository.findNodesByMapId.mockResolvedValue([mockNode]);

      const result = await nodeService.findNodesByMapId(20, 5);

      expect(result).toEqual([mockNode]);
      expect(nodeRepository.findNodesByMapId).toHaveBeenCalledTimes(2);
      expect(nodeRepository.findNodesByMapId).toHaveBeenCalledWith(20, 5);
    });

    it("debería propagar el error si no se encuentran nodos", async () => {
      nodeRepository.findNodesByMapId.mockRejectedValue(
        new Error("No se han encontrado nodos para el mapa con id 20")
      );

      await expect(
        nodeService.findNodesByMapId(20, 5)
      ).rejects.toThrow("No se han encontrado nodos para el mapa con id 20");
    });
  });

  describe("deleteNode()", () => {
    it("debería eliminar un nodo existente", async () => {
      nodeRepository.findNodeById.mockResolvedValue(mockNode);
      nodeRepository.deleteNode.mockResolvedValue(mockNode);

      const result = await nodeService.deleteNode(1);

      expect(result).toEqual(mockNode);
      expect(nodeRepository.findNodeById).toHaveBeenCalledWith(1);
      expect(nodeRepository.deleteNode).toHaveBeenCalledWith(1);
    });

    it("debería lanzar un error si el nodo no existe", async () => {
      nodeRepository.findNodeById.mockRejectedValue(
        new Error("No se ha encontrado el nodo con id 1")
      );

      await expect(
        nodeService.deleteNode(1)
      ).rejects.toThrow("No se ha encontrado el nodo con id 1");

      expect(nodeRepository.deleteNode).not.toHaveBeenCalled();
    });
  });

  describe("createManyNodes()", () => {
    it("debería crear varios nodos", async () => {
      const nodes: CreateNode[] = [
        createNodeData,
        {
          id_obra: 11,
          id_mapa: 20,
          pos_x: 300,
          pos_y: 400,
        },
      ];

      const createdNodes: Node[] = [
        mockNode,
        {
          id_nodo: 2,
          id_obra: 11,
          id_mapa: 20,
          pos_x: 300,
          pos_y: 400,
        },
      ];

      nodeRepository.createManyNodes.mockResolvedValue(createdNodes);

      const result = await nodeService.createManyNodes(nodes);

      expect(result).toEqual(createdNodes);
      expect(nodeRepository.createManyNodes).toHaveBeenCalledWith(nodes);
    });

    it("debería lanzar un error si la lista está vacía", async () => {
      await expect(
        nodeService.createManyNodes([])
      ).rejects.toThrow("No se proporcionaron nodos para crear");

      expect(nodeRepository.createManyNodes).not.toHaveBeenCalled();
    });
  });
});