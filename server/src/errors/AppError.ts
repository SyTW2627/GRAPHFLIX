import type { ContentfulStatusCode } from "hono/utils/http-status";

// errores personalizados
export class AppError extends Error {
  constructor(
    public readonly statusCode: ContentfulStatusCode,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}
 
// 400
export class ValidationError extends AppError {
  constructor(message = "Datos no válidos") {
    super(400, "VALIDATION_ERROR", message);
  }
}
 
// 401
export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado") {
    super(401, "UNAUTHORIZED", message);
  }
}
 
// 403
export class ForbiddenError extends AppError {
  constructor(message = "No tienes permiso para esta acción") {
    super(403, "FORBIDDEN", message);
  }
}
 
// 404
export class NotFoundError extends AppError {
  constructor(recurso = "Recurso") {
    super(404, "NOT_FOUND", `${recurso} no encontrado`);
  }
}
 
// 409
export class ConflictError extends AppError {
  constructor(message = "Conflicto con el estado actual") {
    super(409, "CONFLICT", message);
  }
}
