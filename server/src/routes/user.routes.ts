import { Hono } from "hono";
import { UserService } from "../modules/users/UserService";
import { UserRepository } from "../modules/users/UserRepository";

export const userRoutes = new Hono();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

/**
 * POST /users
 * Registra un nuevo usuario.
 * Recibe: nombre_usuario, correo y password.
 * Devuelve: el usuario creado (201).
 */
userRoutes.post('/users', async (c) => {
  try {
    const user = await c.req.json();
    if (!user) {
      return c.json({
        message: 'El cuerpo de la petición es obligatorio',
      }, 400);
    }

    if (!user.nombre_usuario || !user.correo || !user.password_hash) {
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

    if (!user.correo || !user.password_hash) {
      return c.json({
        message: 'Faltan campos obligatorios',
      }, 400)
    }

    const userLogged = await userService.userLogin(user.correo, user.password_hash);
    return c.json(userLogged, 200);
  } catch (err) {
    return c.json(err, 500);
  }
});

/**
 * GET /users 
 * Obtiene todos los usuarios registrados. 
 * Devuelve: un array con los usuarios (200).
 */
userRoutes.get('/users', async (c) => {
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
userRoutes.get('/users/:id', async (c) => {
  const id = Number(c.req.param("id"));
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
userRoutes.patch('/users/:id', async (c) => {
  const id = Number(c.req.param("id"));
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
userRoutes.delete('/users/:id', async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await userService.deleteUser(id);
    return c.body(null, 204);

    } catch (err) {
      return c.json(err, 500);
    }
});