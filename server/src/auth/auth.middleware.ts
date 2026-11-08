import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

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
    return c.json({
      message: "Autenticación fallida"
    }, 401);
  }

  try {
    // Verificamos la firma y la expiración del JWT
    const payload = await verify(token, Bun.env.TOKEN_SECRET_KEY!, "HS256");

    // Guardamos el ID del usuario en el contexto
    c.set('id_usuario', Number(payload.sub));

    await next();

  } catch (err) {
    return c.json({
      message: 'Token inválido o caducado'
    }, 401)
  }
});