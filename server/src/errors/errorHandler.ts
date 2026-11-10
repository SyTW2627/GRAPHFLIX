import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError } from "./AppError";

// errores de PostgreSQL
const PG_ERRORS: Record<string, { status: 400 | 409; code: string; message: string }> = {
  "23505": { status: 409, code: "DUPLICATE", message: "El recurso ya existe" },
  "23503": { status: 409, code: "FK_VIOLATION", message: "Referencia a un recurso inexistente" },
  "23502": { status: 400, code: "MISSING_FIELD", message: "Falta un campo obligatorio" },
  "22P02": { status: 400, code: "INVALID_FORMAT", message: "Formato de dato no válido" },
};

// formato
const body = (code: string, message: string) => ({ error: { code, message } });

export const errorHandler: ErrorHandler = (err, c) => {
  // errores propios
  if (err instanceof AppError) {
    return c.json(body(err.code, err.message), err.statusCode);
  }
 
  // errores de Hono
  if (err instanceof HTTPException) {
    return c.json(body("HTTP_ERROR", err.message), err.status);
  }
 
  // JSON mal formado
  if (err instanceof SyntaxError) {
    return c.json(body("INVALID_JSON", "El cuerpo de la petición no es un JSON válido"), 400);
  }
 
  // errores de la base de datos
  const pg = PG_ERRORS[(err as any)?.code];
  if (pg) {
    return c.json(body(pg.code, pg.message), pg.status);
  }
 
  // error 500 
  console.error(`[${c.req.method}] ${c.req.path}`, err);
  return c.json(body("INTERNAL_ERROR", "Error interno del servidor"), 500);
};
 
export const notFoundHandler: NotFoundHandler = (c) =>
  c.json(body("ROUTE_NOT_FOUND", `Ruta ${c.req.method} ${c.req.path} no encontrada`), 404);
