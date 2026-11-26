import { beforeEach, describe, expect, it, vi } from "vitest";

import { NodeRepository } from "../../../src/modules/node/NodeRepository";
import { sql } from "../../../src/db/db";

import type { Node, CreateNode, UpdateNode } from "../../../src/modules/node/node.model";

// Simulamos PostgreSQL para que estas pruebas sean unitarias.
vi.mock("../../../src/db/db", () => ({
  sql: vi.fn(),
}));

const mockedSql = vi.mocked(sql) as unknown as ReturnType<typeof vi.fn>;

describe("NodeRepository", () => {
  let nodeRepository: NodeRepository;

  const createNodeData: CreateNode = {
    id_obra: 10,
    id_mapa: 20,
    pos_x: 100,
    pos_y: 200,
  };

  const mockNode = {
    id_nodo: 1,
    id_obra: 10,
    id_mapa: 20,
    pos_x: 100,
    pos_y: 200,
  } as Node;

  beforeEach(() => {
    mockedSql.mockReset();
    nodeRepository = new NodeRepository();
  });

  // --------------------------------------------------
  // createNode()
  // --------------------------------------------------

  describe("createNode()", () => {
    it("debería crear y devolver un nodo", async () => {
      mockedSql.mockResolvedValueOnce([mockNode]);

      const result = await nodeRepository.createNode(createNodeData);

      expect(result).toEqual(mockNode);
      expect(mockedSql).toHaveBeenCalledTimes(1);
    });

    it("debería lanzar un error si la BD no devuelve el nodo creado", async () => {
      mockedSql.mockResolvedValueOnce([]);

      await expect(
        nodeRepository.createNode(createNodeData)
      ).rejects.toThrow("Error al crear el nodo en la base de datos");

      expect(mockedSql).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------
  // updateNode()
  // --------------------------------------------------

  describe("updateNode()", () => {
    it("debería actualizar las coordenadas del nodo", async () => {
      const updateData: UpdateNode = {
        id_nodo: 1,
        pos_x: 300,
        pos_y: 400,
      };

      mockedSql.mockResolvedValueOnce([]);

      await expect(
        nodeRepository.updateNode(updateData)
      ).resolves.toBeUndefined();

      expect(mockedSql).toHaveBeenCalledTimes(1);
    });

    it("debería lanzar un error si falta la coordenada X", async () => {
      const updateData = {
        id_nodo: 1,
        pos_y: 400,
      } as UpdateNode;

      await expect(
        nodeRepository.updateNode(updateData)
      ).rejects.toThrow(
        "No se proporcionaron valores para actualizar el nodo"
      );

      expect(mockedSql).not.toHaveBeenCalled();
    });

    it("debería lanzar un error si falta la coordenada Y", async () => {
      const updateData = {
        id_nodo: 1,
        pos_x: 300,
      } as UpdateNode;

      await expect(
        nodeRepository.updateNode(updateData)
      ).rejects.toThrow(
        "No se proporcionaron valores para actualizar el nodo"
      );

      expect(mockedSql).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // findNodeById()
  // --------------------------------------------------

  describe("findNodeById()", () => {
    it("debería devolver un nodo existente", async () => {
      mockedSql.mockResolvedValueOnce([mockNode]);

      const result = await nodeRepository.findNodeById(1);

      expect(result).toEqual(mockNode);
      expect(mockedSql).toHaveBeenCalledTimes(1);
    });

    it("debería lanzar un error si el nodo no existe", async () => {
      mockedSql.mockResolvedValueOnce([]);

      await expect(
        nodeRepository.findNodeById(-999)
      ).rejects.toThrow("No se ha encontrado el nodo con id -999");

      expect(mockedSql).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------
  // findNodesByMapId()
  // --------------------------------------------------

  describe("findNodesByMapId()", () => {
    it("debería devolver los nodos de un mapa pertenecientes al usuario", async () => {
      const nodes = [
        mockNode,
        {
          ...mockNode,
          id_nodo: 2,
          id_obra: 11,
        },
      ];

      mockedSql.mockResolvedValueOnce(nodes);

      const result = await nodeRepository.findNodesByMapId(20, 5);

      expect(result).toEqual(nodes);
      expect(result).toHaveLength(2);
      expect(mockedSql).toHaveBeenCalledTimes(1);
    });

    it("debería lanzar un error si el mapa no tiene nodos", async () => {
      mockedSql.mockResolvedValueOnce([]);

      await expect(
        nodeRepository.findNodesByMapId(20, 5)
      ).rejects.toThrow(
        "No se han encontrado nodos para el mapa con id 20"
      );

      expect(mockedSql).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------
  // deleteNode()
  // --------------------------------------------------

  describe("deleteNode()", () => {
    it("debería devolver el nodo eliminado", async () => {
      mockedSql.mockResolvedValueOnce([mockNode]);

      const result = await nodeRepository.deleteNode(1);

      expect(result).toEqual(mockNode);
      expect(mockedSql).toHaveBeenCalledTimes(1);
    });

    it("debería devolver undefined si el nodo no existe", async () => {
      mockedSql.mockResolvedValueOnce([]);

      const result = await nodeRepository.deleteNode(-999);

      expect(result).toBeUndefined();
      expect(mockedSql).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------
  // createManyNodes()
  // --------------------------------------------------

  describe("createManyNodes()", () => {
    it("debería devolver una lista vacía si no se proporcionan nodos", async () => {
      const result = await nodeRepository.createManyNodes([]);

      expect(result).toEqual([]);
      expect(mockedSql).not.toHaveBeenCalled();
    });

    it("debería crear varios nodos y devolverlos", async () => {
      const nodesToCreate: CreateNode[] = [
        {
          id_obra: 10,
          id_mapa: 20,
          pos_x: 100,
          pos_y: 200,
        },
        {
          id_obra: 11,
          id_mapa: 20,
          pos_x: 300,
          pos_y: 400,
        },
      ];

      const createdNodes = [
        mockNode,
        {
          ...mockNode,
          id_nodo: 2,
          id_obra: 11,
          pos_x: 300,
          pos_y: 400,
        },
      ];

      mockedSql
      .mockImplementationOnce(() => "fragmento SQL")
      .mockResolvedValueOnce(createdNodes);

      const result = await nodeRepository.createManyNodes(nodesToCreate);

      expect(result).toEqual(createdNodes);
      expect(result).toHaveLength(2);
      expect(mockedSql).toHaveBeenCalledTimes(2);
    });
  });
});