import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { errorHandler } from "../../src/errors/errorHandler";
import { map } from "../../src/routes/map.routes";

const mocks = vi.hoisted(() => ({
    repository: {
        createMap: vi.fn(),
        findById: vi.fn(),
        findByUserId: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        createEdges: vi.fn(),
        getNodesWithInfoByMapId: vi.fn(),
        getEdgesByMapId: vi.fn(),
        countGenresByMapId: vi.fn(),
    },
}));

vi.mock("../../src/auth/auth.middleware", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("id_usuario", 5);
        await next();
    },
}));

vi.mock("../../src/modules/map/MapRepository", () => ({
    MapRepository: class {
        constructor() {
            return mocks.repository;
        }
    },
}));

describe("Map Routes", () => {
    let app: Hono;

    const mockMap = {
        id_mapa: 1,
        tipo_mapa: "Películas",
        nombre_mapa: "Mi mapa",
        id_usuario: 5,
    };

    beforeEach(() => {
        vi.resetAllMocks();

        app = new Hono();

        app.onError(errorHandler);

        app.route("/", map);
    });

    describe("POST /maps", () => {
        it("debería crear un mapa y devolver código 201", async () => {
            mocks.repository.createMap.mockResolvedValue(mockMap);

            const response = await app.request("/maps", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_mapa: "Mi mapa",
                    tipo_mapa: "Películas",
                }),
            });

            expect(response.status).toBe(201);
            expect(await response.json()).toEqual(mockMap);

            expect(mocks.repository.createMap).toHaveBeenCalledWith({
                nombre_mapa: "Mi mapa",
                tipo_mapa: "Películas",
                id_usuario: 5,
            });
        });

        it("debería rechazar un cuerpo de petición nulo", async () => {
            const response = await app.request("/maps", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: "null",
            });

            expect(response.status).toBe(400);
            expect(mocks.repository.createMap).not.toHaveBeenCalled();
        });
    });

    describe("GET /maps", () => {
        it("debería devolver los mapas del usuario autenticado", async () => {
            const maps = [
                mockMap,
                {
                    ...mockMap,
                    id_mapa: 2,
                    nombre_mapa: "Segundo mapa",
                },
            ];

            mocks.repository.findByUserId.mockResolvedValue(maps);

            const response = await app.request("/maps");

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(maps);

            expect(mocks.repository.findByUserId).toHaveBeenCalledWith(5);
        });

        it("debería devolver un array vacío si el usuario no tiene mapas", async () => {
            mocks.repository.findByUserId.mockResolvedValue([]);

            const response = await app.request("/maps");

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual([]);
        });
    });

    describe("GET /maps/:id", () => {
        it("debería devolver un mapa por su identificador", async () => {
            mocks.repository.findById.mockResolvedValue(mockMap);

            const response = await app.request("/maps/1");

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(mockMap);

            expect(mocks.repository.findById).toHaveBeenCalledWith(1);
        });

        it("debería rechazar un identificador no numérico", async () => {
            const response = await app.request("/maps/abc");

            expect(response.status).toBe(400);
            expect(mocks.repository.findById).not.toHaveBeenCalled();
        });

        it("debería rechazar un identificador igual a cero", async () => {
            const response = await app.request("/maps/0");

            expect(response.status).toBe(400);
            expect(mocks.repository.findById).not.toHaveBeenCalled();
        });

        it("debería rechazar un identificador negativo", async () => {
            const response = await app.request("/maps/-1");

            expect(response.status).toBe(400);
            expect(mocks.repository.findById).not.toHaveBeenCalled();
        });

        it("debería devolver error si el mapa no pertenece al usuario", async () => {
            mocks.repository.findById.mockResolvedValue({
                ...mockMap,
                id_usuario: 99,
            });

            const response = await app.request("/maps/1");

            expect(response.status).toBe(404);
        });

        it("debería devolver error si el mapa no existe", async () => {
            mocks.repository.findById.mockResolvedValue(undefined);

            const response = await app.request("/maps/999");

            expect(response.status).toBe(404);
        });
    });

    describe("PATCH /maps/:id", () => {
        it("debería actualizar el nombre del mapa", async () => {
            const updatedMap = {
                ...mockMap,
                nombre_mapa: "Nombre actualizado",
            };

            mocks.repository.findById.mockResolvedValue(mockMap);
            mocks.repository.update.mockResolvedValue(updatedMap);

            const response = await app.request("/maps/1", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_mapa: "Nombre actualizado",
                }),
            });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(updatedMap);

            expect(mocks.repository.update).toHaveBeenCalledWith(1, {
                nombre_mapa: "Nombre actualizado",
                tipo_mapa: undefined,
            });
        });

        it("debería actualizar el tipo de mapa", async () => {
            const updatedMap = {
                ...mockMap,
                tipo_mapa: "Libros",
            };

            mocks.repository.findById.mockResolvedValue(mockMap);
            mocks.repository.update.mockResolvedValue(updatedMap);

            const response = await app.request("/maps/1", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tipo_mapa: "Libros",
                }),
            });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(updatedMap);
        });

        it("debería rechazar una petición sin campos que actualizar", async () => {
            const response = await app.request("/maps/1", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });

            expect(response.status).toBe(400);
            expect(mocks.repository.update).not.toHaveBeenCalled();
        });

        it("debería rechazar un identificador inválido", async () => {
            const response = await app.request("/maps/abc", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_mapa: "Nuevo nombre",
                }),
            });

            expect(response.status).toBe(400);
            expect(mocks.repository.update).not.toHaveBeenCalled();
        });

        it("debería rechazar la actualización si el mapa no pertenece al usuario", async () => {
            mocks.repository.findById.mockResolvedValue({
                ...mockMap,
                id_usuario: 99,
            });

            const response = await app.request("/maps/1", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_mapa: "Nuevo nombre",
                }),
            });

            expect(response.status).toBe(404);
            expect(mocks.repository.update).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /maps/:id", () => {
        it("debería eliminar un mapa y devolver código 204", async () => {
            mocks.repository.findById.mockResolvedValue(mockMap);
            mocks.repository.delete.mockResolvedValue(true);

            const response = await app.request("/maps/1", {
                method: "DELETE",
            });

            expect(response.status).toBe(204);
            expect(mocks.repository.delete).toHaveBeenCalledWith(1);
        });

        it("debería rechazar un identificador inválido", async () => {
            const response = await app.request("/maps/abc", {
                method: "DELETE",
            });

            expect(response.status).toBe(400);
            expect(mocks.repository.delete).not.toHaveBeenCalled();
        });

        it("debería rechazar la eliminación si el mapa no pertenece al usuario", async () => {
            mocks.repository.findById.mockResolvedValue({
                ...mockMap,
                id_usuario: 99,
            });

            const response = await app.request("/maps/1", {
                method: "DELETE",
            });

            expect(response.status).toBe(404);
            expect(mocks.repository.delete).not.toHaveBeenCalled();
        });
    });

    describe("GET /maps/:id/graph", () => {
        it("debería devolver el grafo completo del mapa", async () => {
            const nodes = [
                {
                    id_nodo: 1,
                    id_obra: 10,
                    id_mapa: 1,
                    pos_x: 640,
                    pos_y: 400,
                    titulo: "Película de prueba",
                    ano_publicacion: 2020,
                    descripcion: "Descripción",
                    imagen_url: "imagen.jpg",
                    es_favorita: true,
                    generos: ["Acción"],
                    directores: ["Director"],
                    reparto: ["Actor"],
                },
            ];

            const edges = [
                {
                    nodo_origen: 1,
                    nodo_destino: 2,
                },
            ];

            mocks.repository.findById.mockResolvedValue(mockMap);
            mocks.repository.getNodesWithInfoByMapId.mockResolvedValue(nodes);
            mocks.repository.getEdgesByMapId.mockResolvedValue(edges);
            mocks.repository.countGenresByMapId.mockResolvedValue(3);

            const response = await app.request("/maps/1/graph");

            expect(response.status).toBe(200);

            expect(mocks.repository.getNodesWithInfoByMapId)
                .toHaveBeenCalledWith(1, 5);

            expect(mocks.repository.getEdgesByMapId)
                .toHaveBeenCalledWith(1);

            expect(mocks.repository.countGenresByMapId)
                .toHaveBeenCalledWith(1);
        });

        it("debería rechazar un identificador inválido", async () => {
            const response = await app.request("/maps/abc/graph");

            expect(response.status).toBe(400);
            expect(mocks.repository.getNodesWithInfoByMapId).not.toHaveBeenCalled();
        });

        it("debería rechazar el acceso si el mapa no pertenece al usuario", async () => {
            mocks.repository.findById.mockResolvedValue({
                ...mockMap,
                id_usuario: 99,
            });

            const response = await app.request("/maps/1/graph");

            expect(response.status).toBe(404);
            expect(mocks.repository.getNodesWithInfoByMapId).not.toHaveBeenCalled();
        });
    });
});