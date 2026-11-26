import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapService } from "../../../src/modules/map/MapService";
import type { MapRepository } from "../../../src/modules/map/MapRepository";
import type { Map, NewMap, UpdateMap, Arista } from "../../../src/modules/map/map.model";
import { NotFoundError } from "../../../src/errors/AppError";

describe("MapService", () => {
    let mapService: MapService;

    let mapRepository: {
        createMap: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findByUserId: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        createEdges: ReturnType<typeof vi.fn>;
        getNodesWithInfoByMapId: ReturnType<typeof vi.fn>;
        getEdgesByMapId: ReturnType<typeof vi.fn>;
        countGenresByMapId: ReturnType<typeof vi.fn>;
    };

    const mockMap = {
        id_mapa: 1,
        tipo_mapa: "Películas",
        nombre_mapa: "Mi mapa",
        id_usuario: 5,
    } as Map;

    const newMap = {
        tipo_mapa: "Películas",
        nombre_mapa: "Mi mapa",
        id_usuario: 5,
    } as NewMap;

    const updateMap = {
        tipo_mapa: "Libros",
        nombre_mapa: "Mapa actualizado",
    } as UpdateMap;

    const mockEdge = {
        nodo_origen: 1,
        nodo_destino: 2,
    } as Arista;

    beforeEach(() => {
        mapRepository = {
            createMap: vi.fn(),
            findById: vi.fn(),
            findByUserId: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            createEdges: vi.fn(),
            getNodesWithInfoByMapId: vi.fn(),
            getEdgesByMapId: vi.fn(),
            countGenresByMapId: vi.fn(),
        };

        mapService = new MapService(
            mapRepository as unknown as MapRepository
        );
    });

    describe("createMap()", () => {
        it("debería crear un mapa y devolverlo", async () => {
            mapRepository.createMap.mockResolvedValue(mockMap);

            const result = await mapService.createMap(newMap);

            expect(result).toEqual(mockMap);
            expect(mapRepository.createMap).toHaveBeenCalledWith(newMap);
        });
    });

    describe("getMapsByUser()", () => {
        it("debería devolver todos los mapas de un usuario", async () => {
            const maps = [
                mockMap,
                { ...mockMap, id_mapa: 2, nombre_mapa: "Segundo mapa" },
            ];

            mapRepository.findByUserId.mockResolvedValue(maps);

            const result = await mapService.getMapsByUser(5);

            expect(result).toEqual(maps);
            expect(result).toHaveLength(2);
            expect(mapRepository.findByUserId).toHaveBeenCalledWith(5);
        });

        it("debería devolver un array vacío si el usuario no tiene mapas", async () => {
            mapRepository.findByUserId.mockResolvedValue([]);

            const result = await mapService.getMapsByUser(5);

            expect(result).toEqual([]);
        });
    });

    describe("getMapById()", () => {
        it("debería devolver un mapa si pertenece al usuario", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);

            const result = await mapService.getMapById(1, 5);

            expect(result).toEqual(mockMap);
            expect(mapRepository.findById).toHaveBeenCalledWith(1);
        });

        it("debería lanzar NotFoundError si el mapa no existe", async () => {
            mapRepository.findById.mockResolvedValue(undefined);

            await expect(
                mapService.getMapById(999, 5)
            ).rejects.toThrow(NotFoundError);
        });

        it("debería lanzar NotFoundError si el mapa pertenece a otro usuario", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);

            await expect(
                mapService.getMapById(1, 99)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("updateMap()", () => {
        it("debería actualizar un mapa que pertenece al usuario", async () => {
            const updatedMap = { ...mockMap, ...updateMap };

            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.update.mockResolvedValue(updatedMap);

            const result = await mapService.updateMap(1, 5, updateMap);

            expect(result).toEqual(updatedMap);
            expect(mapRepository.findById).toHaveBeenCalledWith(1);
            expect(mapRepository.update).toHaveBeenCalledWith(1, updateMap);
        });

        it("debería lanzar NotFoundError si el mapa no pertenece al usuario", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);

            await expect(
                mapService.updateMap(1, 99, updateMap)
            ).rejects.toThrow(NotFoundError);

            expect(mapRepository.update).not.toHaveBeenCalled();
        });

        it("debería lanzar un error si no se puede actualizar el mapa", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.update.mockResolvedValue(undefined);

            await expect(
                mapService.updateMap(1, 5, updateMap)
            ).rejects.toThrow("No se pudo actualizar el mapa");
        });
    });

    describe("deleteMap()", () => {
        it("debería eliminar un mapa que pertenece al usuario", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.delete.mockResolvedValue(true);

            const result = await mapService.deleteMap(1, 5);

            expect(result).toBe(true);
            expect(mapRepository.delete).toHaveBeenCalledWith(1);
        });

        it("debería devolver false si el repositorio no elimina el mapa", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.delete.mockResolvedValue(false);

            const result = await mapService.deleteMap(1, 5);

            expect(result).toBe(false);
        });

        it("debería lanzar NotFoundError si el mapa no pertenece al usuario", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);

            await expect(
                mapService.deleteMap(1, 99)
            ).rejects.toThrow(NotFoundError);

            expect(mapRepository.delete).not.toHaveBeenCalled();
        });
    });

    describe("createMapEdges()", () => {
        it("debería crear varias aristas", async () => {
            const edges = [
                { nodo_origen: 1, nodo_destino: 2 },
                { nodo_origen: 2, nodo_destino: 3 },
            ];

            const createdEdges = [
                mockEdge,
                { nodo_origen: 2, nodo_destino: 3 } as Arista,
            ];

            mapRepository.createEdges.mockResolvedValue(createdEdges);

            const result = await mapService.createMapEdges(edges);

            expect(result).toEqual(createdEdges);
            expect(result).toHaveLength(2);
            expect(mapRepository.createEdges).toHaveBeenCalledWith(edges);
        });

        it("debería lanzar un error si no se proporcionan aristas", async () => {
            await expect(
                mapService.createMapEdges([])
            ).rejects.toThrow("No se proporcionaron aristas para crear");

            expect(mapRepository.createEdges).not.toHaveBeenCalled();
        });
    });

    describe("getFullGraph()", () => {
        it("debería devolver el grafo con su nodo central y sus nodos", async () => {
            const nodes = [
                {
                    id_nodo: 1,
                    id_obra: 10,
                    id_mapa: 1,
                    pos_x: 640,
                    pos_y: 400,
                    titulo: "Película 1",
                    ano_publicacion: 2020,
                    descripcion: "Descripción",
                    imagen_url: "imagen.jpg",
                    es_favorita: true,
                    generos: ["Acción"],
                    directores: ["Director"],
                    reparto: ["Actor"],
                },
            ];

            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.getNodesWithInfoByMapId.mockResolvedValue(nodes);
            mapRepository.getEdgesByMapId.mockResolvedValue([]);
            mapRepository.countGenresByMapId.mockResolvedValue(1);

            const result = await mapService.getFullGraph(1, 5);

            expect(result.id_mapa).toBe(1);
            expect(result.isColdStart).toBe(false);
            expect(result.total_generos).toBe(1);
            expect(result.nodes).toHaveLength(2);

            expect(result.nodes[0]).toEqual({
                id_nodo: 0,
                id_obra: null,
                id_mapa: 1,
                nivel: -1,
                pos_x: 500,
                pos_y: 400,
            });

            expect(result.nodes[1]).toMatchObject({
                titulo: "Película 1",
                nivel: 0,
            });
        });

        it("debería conectar el nodo central con los nodos favoritos", async () => {
            const nodes = [
                {
                    id_nodo: 1,
                    id_obra: 10,
                    id_mapa: 1,
                    pos_x: 640,
                    pos_y: 400,
                    es_favorita: true,
                    generos: [],
                    directores: [],
                    reparto: [],
                },
                {
                    id_nodo: 2,
                    id_obra: 11,
                    id_mapa: 1,
                    pos_x: 780,
                    pos_y: 400,
                    es_favorita: false,
                    generos: [],
                    directores: [],
                    reparto: [],
                },
            ];

            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.getNodesWithInfoByMapId.mockResolvedValue(nodes);
            mapRepository.getEdgesByMapId.mockResolvedValue([
                { nodo_origen: 1, nodo_destino: 2 },
            ]);
            mapRepository.countGenresByMapId.mockResolvedValue(2);

            const result = await mapService.getFullGraph(1, 5);

            expect(result.isColdStart).toBe(false);
            expect(result.edges).toEqual([
                { source: 0, destiny: 1 },
                { source: 1, destiny: 2 },
            ]);
        });

        it("debería activar cold start si no hay películas favoritas", async () => {
            const nodes = [
                {
                    id_nodo: 1,
                    id_obra: 10,
                    id_mapa: 1,
                    pos_x: 600,
                    pos_y: 400,
                    es_favorita: false,
                    generos: [],
                    directores: [],
                    reparto: [],
                },
            ];

            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.getNodesWithInfoByMapId.mockResolvedValue(nodes);
            mapRepository.getEdgesByMapId.mockResolvedValue([]);
            mapRepository.countGenresByMapId.mockResolvedValue(1);

            const result = await mapService.getFullGraph(1, 5);

            expect(result.isColdStart).toBe(true);
            expect(result.edges).toEqual([
                { source: 0, destiny: 1 },
            ]);
        });

        it("debería devolver solo el nodo central si el mapa está vacío", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.getNodesWithInfoByMapId.mockResolvedValue([]);
            mapRepository.getEdgesByMapId.mockResolvedValue([]);
            mapRepository.countGenresByMapId.mockResolvedValue(0);

            const result = await mapService.getFullGraph(1, 5);

            expect(result.isColdStart).toBe(true);
            expect(result.nodes).toHaveLength(1);
            expect(result.edges).toEqual([]);
            expect(result.total_generos).toBe(0);
        });

        it("debería lanzar NotFoundError si el mapa no pertenece al usuario", async () => {
            mapRepository.findById.mockResolvedValue(mockMap);

            await expect(
                mapService.getFullGraph(1, 99)
            ).rejects.toThrow(NotFoundError);

            expect(mapRepository.getNodesWithInfoByMapId).not.toHaveBeenCalled();
            expect(mapRepository.getEdgesByMapId).not.toHaveBeenCalled();
        });

        it("debería convertir las posiciones de los nodos a números", async () => {
            const nodes = [
                {
                    id_nodo: "1",
                    id_obra: "10",
                    id_mapa: "1",
                    pos_x: "780",
                    pos_y: "400",
                    es_favorita: false,
                    generos: null,
                    directores: null,
                    reparto: null,
                },
            ];

            mapRepository.findById.mockResolvedValue(mockMap);
            mapRepository.getNodesWithInfoByMapId.mockResolvedValue(nodes);
            mapRepository.getEdgesByMapId.mockResolvedValue([]);
            mapRepository.countGenresByMapId.mockResolvedValue(0);

            const result = await mapService.getFullGraph(1, 5);
            const node = result.nodes[1];

            expect(node!.id_nodo).toBe(1);
            expect(node!.id_obra).toBe(10);
            expect(node!.pos_x).toBe(780);
            expect(node!.pos_y).toBe(400);
            expect(node!.nivel).toBe(1);
        });
    });
});