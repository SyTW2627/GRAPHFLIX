import { Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { UserService } from "../modules/users/UserService";
import { UserRepository } from "../modules/users/UserRepository";
import { authMiddleware } from "../auth/auth.middleware";

export const userRoutes = new Hono();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

/**
 * POST /users
 * Registra un nuevo usuario.
 * Recibe: nombre_usuario, correo y password.
 * Devuelve: el usuario creado (201).
 */
userRoutes.post('/users/register', async (c) => {
  try {
    const user = await c.req.json();
    if (!user) {
      return c.json({
        message: 'El cuerpo de la petición es obligatorio',
      }, 400);
    }

    if (!user.nombre_usuario || !user.correo || !user.password) {
      return c.json({
        message: 'Faltan campos obligatorios',
      }, 400)
    }

    const newUser = await userService.userRegister(user);
    return c.json(newUser, 201);
  } catch (err) {
    return c.json(err, 500)
  }
});

/**
 * POST /users/login 
 * Inicia sesión con las credenciales del usuario. 
 * Recibe: correo y password. 
 * Devuelve: los datos del usuario autenticado (200).
 */
userRoutes.post('/users/login', async (c) => {
  try {
    const user = await c.req.json();
    if (!user) {
      return c.json({
        message: 'El cuerpo de la petición es obligatorio',
      }, 400);
    }

    if (!user.correo || !user.password) {
      return c.json({
        message: 'Faltan campos obligatorios',
      }, 400)
    }

    const userLogged = await userService.userLogin(
      user.correo,
      user.password
    );

    const token = await sign(
      {
        sub: String(userLogged.id_usuario),
        exp: Math.floor(Date.now() / 1000) + 3600
      },
      Bun.env.TOKEN_SECRET_KEY!,
      "HS256"
    );

    setCookie(c, "access_token", token, {
      httpOnly: true, //Impide que JavaScript del navegador pueda leer la cookie mediante document.cookie. Ayuda a proteger el token frente a ciertos ataques XSS.
      secure: Bun.env.NODE_ENV === "production", //	Hace que el navegador solo envíe la cookie mediante HTTPS
      sameSite: "Lax", //Controla cuándo se envía la cookie en peticiones entre sitios.
      path: "/", //Define para qué rutas del servidor se envía la cookie. / significa todas las rutas.
      maxAge: 3600 //Tiempo de vida de la cookie en segundos. 3600 equivale a una hora.
    });

    return c.json(userLogged, 200);
  } catch (err) {
    return c.json(err, 500);
  }
});

/**
 * POST /users/logout
 *
 * Cierra la sesión del usuario eliminando la cookie que almacena el JWT.
 * No requiere cuerpo en la petición.
 * Devuelve un mensaje de confirmación (200).
 */
userRoutes.post("/users/logout", authMiddleware, (c) => {
  deleteCookie(c, "access_token", {
    path: "/",
  });

  return c.json({
    message: "Sesión cerrada correctamente",
  }, 200);
});

/**
 * GET /users 
 * Obtiene todos los usuarios registrados. 
 * Devuelve: un array con los usuarios (200).
 */
userRoutes.get('/users', authMiddleware, async (c) => {
  try {
    const users = await userService.getAllUsers();
    return c.json(users, 200);
  } catch (err) {
    return c.json(err, 500);
  }
});

/**
 * GET /users/:id 
 * Obtiene un usuario concreto mediante su ID. 
 * Recibe: el ID del usuario como parámetro de la URL. 
 * Devuelve: el usuario encontrado (200).
 */
userRoutes.get('/users/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: "ID inválido" }, 400);
  }
  try {
    const user = await userService.getUserById(id);
    return c.json(user, 200);
  } catch (err) {
    return c.json(err, 500);
  }
});

/**
 * PATCH /users/:id 
 * Actualiza parcialmente los datos de un usuario. 
 * Recibe: el ID en la URL y los campos que se quieren modificar. 
 * Solo permite actualizar nombre_usuario y correo. 
 * Devuelve: el usuario actualizado (200).
 */
userRoutes.patch('/users/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: "ID inválido" }, 400);
  }
  try {
    const data = await c.req.json();
    if (!data) {
      return c.json({
        message: 'El cuerpo de la petición es obligatorio',
      }, 400);
    }

    const allowedUpdates = ['nombre_usuario', 'correo'];
    const actualUpdates = Object.keys(data);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return c.json({
        message: 'Actualización no permitida',
      }, 400);
    }

    const updatedUser = await userService.updateUser(id, data);
    return c.json(updatedUser, 200);

  } catch (err) {
    return c.json(err, 500);
  }
});

/**
 * DELETE /users/:id 
 * Elimina un usuario mediante su ID. 
 * Recibe: el ID del usuario como parámetro de la URL. 
 * Devuelve: 204 si se elimina correctamente (sin cuerpo).
 */
userRoutes.delete('/users/:id', authMiddleware, async (c) => {
  try {
    const id = Number(c.req.param("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ message: "ID inválido" }, 400);
    }

    await userService.deleteUser(id);
    return c.body(null, 204);

    } catch (err) {
      return c.json(err, 500);
    }
});