import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { UnauthorizedError } from "../errors/AppError";

/**
 * Middleware de autenticación.
 *
 * Comprueba que la petición contiene un JWT válido en la cookie
 * access_token. Si la autenticación es correcta, permite continuar
 * con la ejecución del endpoint. En caso contrario, devuelve un 401.
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  // Obtenemos el token de la cookie
  const token = getCookie(c, "access_token");

  if (!token) {
    throw new UnauthorizedError("Autenticación fallida");
  }
  // Verificamos la firma y la expiración del JWT
  let payload;
  try {
    payload = await verify(token, Bun.env.TOKEN_SECRET_KEY!, "HS256");
  } catch(err) {
    throw new UnauthorizedError("Token inválido o caducado");
  }

  // Guardamos el ID del usuario en el contexto
  c.set('id_usuario', Number(payload.sub));

  await next();
});