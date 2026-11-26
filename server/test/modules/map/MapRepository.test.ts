import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapRepository } from "../../../src/modules/map/MapRepository";
import { sql } from "../../../src/db/db";
import type { Map, NewMap, UpdateMap, Arista } from "../../../src/modules/map/map.model";

vi.mock("../../../src/db/db", () => ({
    sql: vi.fn(),
}));

const mockedSql = vi.mocked(sql) as unknown as ReturnType<typeof vi.fn>;

describe("MapRepository", () => {
    let mapRepository: MapRepository;

    const mockMap = {
        id_mapa: 1,
        tipo_mapa: "Películas",
        nombre_mapa: "Mi mapa",
        id_usuario: 5,
    } as Map;

    const newMap: NewMap = {
        tipo_mapa: "Películas",
        nombre_mapa: "Mi mapa",
        id_usuario: 5,
    };

    const updateMap: UpdateMap = {
        tipo_mapa: "Libros",
        nombre_mapa: "Mapa actualizado",
    };

    const mockEdge = {
        nodo_origen: 1,
        nodo_destino: 2,
    } as Arista;

    beforeEach(() => {
        mockedSql.mockReset();
        mapRepository = new MapRepository();
    });

    describe("createMap()", () => {
        it("debería crear un mapa y devolverlo", async () => {
            mockedSql.mockResolvedValueOnce([mockMap]);

            const result = await mapRepository.createMap(newMap);

            expect(result).toEqual(mockMap);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });

        it("debería permitir crear un mapa con campos opcionales nulos", async () => {
            const mapWithoutOptionalFields: NewMap = {
                id_usuario: 5,
            } as NewMap;

            mockedSql.mockResolvedValueOnce([mockMap]);

            const result = await mapRepository.createMap(mapWithoutOptionalFields);

            expect(result).toEqual(mockMap);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });
    });

    describe("findById()", () => {
        it("debería devolver un mapa por su id", async () => {
            mockedSql.mockResolvedValueOnce([mockMap]);

            const result = await mapRepository.findById(1);

            expect(result).toEqual(mockMap);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });

        it("debería devolver undefined si no encuentra el mapa", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.findById(999);

            expect(result).toBeUndefined();
        });
    });

    describe("findByUserId()", () => {
        it("debería devolver todos los mapas de un usuario", async () => {
            const maps = [
                mockMap,
                {
                    ...mockMap,
                    id_mapa: 2,
                    nombre_mapa: "Segundo mapa",
                },
            ];

            mockedSql.mockResolvedValueOnce(maps);

            const result = await mapRepository.findByUserId(5);

            expect(result).toEqual(maps);
            expect(result).toHaveLength(2);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });

        it("debería devolver un array vacío si el usuario no tiene mapas", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.findByUserId(5);

            expect(result).toEqual([]);
        });
    });

    describe("update()", () => {
        it("debería actualizar un mapa y devolverlo", async () => {
            const updatedMap = {
                ...mockMap,
                ...updateMap,
            };

            mockedSql.mockResolvedValueOnce([updatedMap]);

            const result = await mapRepository.update(1, updateMap);

            expect(result).toEqual(updatedMap);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });

        it("debería devolver undefined si el mapa no existe", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.update(999, updateMap);

            expect(result).toBeUndefined();
        });
    });

    describe("delete()", () => {
        it("debería devolver true si elimina un mapa", async () => {
            mockedSql.mockResolvedValueOnce([{ id_mapa: 1 }]);

            const result = await mapRepository.delete(1);

            expect(result).toBe(true);
        });

        it("debería devolver false si no encuentra el mapa", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.delete(999);

            expect(result).toBe(false);
        });
    });

    describe("createEdges()", () => {
        it("debería crear varias aristas y devolverlas", async () => {
            const edges = [
                { nodo_origen: 1, nodo_destino: 2 },
                { nodo_origen: 2, nodo_destino: 3 },
            ];

            const createdEdges = [
                mockEdge,
                { nodo_origen: 2, nodo_destino: 3 } as Arista,
            ];

            // Primera llamada: genera el fragmento SQL.
            // Segunda llamada: ejecuta la consulta.
            mockedSql
                .mockImplementationOnce(() => "fragmento SQL")
                .mockResolvedValueOnce(createdEdges);

            const result = await mapRepository.createEdges(edges);

            expect(result).toEqual(createdEdges);
            expect(result).toHaveLength(2);
            expect(mockedSql).toHaveBeenCalledTimes(2);
        });

        it("debería lanzar un error si no se proporcionan aristas", async () => {
            await expect(
                mapRepository.createEdges([])
            ).rejects.toThrow("No se proporcionaron aristas para crear");

            expect(mockedSql).not.toHaveBeenCalled();
        });
    });

    describe("getNodesWithInfoByMapId()", () => {
        it("debería devolver los nodos con toda su información", async () => {
            const nodes = [
                {
                    id_nodo: 1,
                    id_obra: 10,
                    id_mapa: 1,
                    pos_x: 100,
                    pos_y: 200,
                    titulo: "Película de prueba",
                    ano_publicacion: 2020,
                    descripcion: "Descripción de prueba",
                    imagen_url: "imagen.jpg",
                    es_favorita: true,
                    generos: ["Acción", "Aventura"],
                    directores: ["Director de prueba"],
                    reparto: ["Actor de prueba"],
                },
            ];

            mockedSql.mockResolvedValueOnce(nodes);

            const result = await mapRepository.getNodesWithInfoByMapId(1, 5);

            expect(result).toEqual(nodes);
            expect(result).toHaveLength(1);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });

        it("debería devolver un array vacío si el mapa no tiene nodos", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.getNodesWithInfoByMapId(1, 5);

            expect(result).toEqual([]);
        });
    });

    describe("getEdgesByMapId()", () => {
        it("debería devolver las aristas de un mapa", async () => {
            const edges = [
                mockEdge,
                { nodo_origen: 2, nodo_destino: 3 } as Arista,
            ];

            mockedSql.mockResolvedValueOnce(edges);

            const result = await mapRepository.getEdgesByMapId(1);

            expect(result).toEqual(edges);
            expect(result).toHaveLength(2);
            expect(mockedSql).toHaveBeenCalledTimes(1);
        });

        it("debería devolver un array vacío si el mapa no tiene aristas", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.getEdgesByMapId(1);

            expect(result).toEqual([]);
        });
    });

    describe("countGenresByMapId()", () => {
        it("debería devolver el número de géneros distintos del mapa", async () => {
            mockedSql.mockResolvedValueOnce([{ total: 5 }]);

            const result = await mapRepository.countGenresByMapId(1);

            expect(result).toBe(5);
        });

        it("debería devolver 0 si no encuentra géneros", async () => {
            mockedSql.mockResolvedValueOnce([{ total: 0 }]);

            const result = await mapRepository.countGenresByMapId(1);

            expect(result).toBe(0);
        });

        it("debería devolver 0 si la consulta no devuelve ninguna fila", async () => {
            mockedSql.mockResolvedValueOnce([]);

            const result = await mapRepository.countGenresByMapId(1);

            expect(result).toBe(0);
        });

        it("debería convertir el total a número", async () => {
            mockedSql.mockResolvedValueOnce([{ total: "7" }]);

            const result = await mapRepository.countGenresByMapId(1);

            expect(result).toBe(7);
            expect(typeof result).toBe("number");
        });
    });
});