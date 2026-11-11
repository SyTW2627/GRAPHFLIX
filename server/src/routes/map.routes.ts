import { Hono } from "hono";
import { MapService } from "../modules/map/MapService";
import { MapRepository } from "../modules/map/MapRepository";
import { authMiddleware } from "../auth/auth.middleware";
import { ValidationError } from "../errors/AppError";

export const map = new Hono<{ Variables: { id_usuario: number } }>();

const mapRepository = new MapRepository();
const mapService = new MapService(mapRepository);

map.post("/maps", authMiddleware, async(c) => {
    const userId = c.get("id_usuario");
    const body = await c.req.json();
    if (!body) {
        throw new ValidationError("El cuerpo de la petición es obligatorio");
    }

    const newMap = await mapService.createMap({
        nombre_mapa: body.nombre_mapa,
        tipo_mapa: body.tipo_mapa,
        id_usuario: userId,
    });
    return c.json(newMap, 201);
})

map.get("/maps", authMiddleware, async(c) => {
    const maps = await mapService.getMapsByUser(c.get("id_usuario"));
    return c.json(maps, 200);
})

map.get("/maps/:id", authMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
      
    if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError("ID inválido");
    }
    const map = await mapService.getMapById(id, c.get("id_usuario"));
    return c.json(map, 200);
});

// actualiza nombre mapa o tipo mapa
map.patch("/maps/:id", authMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError("ID inválido");
    }
    const { nombre_mapa, tipo_mapa } = await c.req.json();

    if (nombre_mapa === undefined && tipo_mapa === undefined) {
      throw new ValidationError("Debes enviar nombre_mapa o tipo_mapa");
    }

    const updated = await mapService.updateMap(id, c.get("id_usuario"), {
      nombre_mapa,
      tipo_mapa,
    });
    return c.json(updated, 200);
});

map.delete("/maps/:id", authMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError("ID inválido");
    }
    await mapService.deleteMap(id, c.get("id_usuario"));
    return c.body(null, 204);
});