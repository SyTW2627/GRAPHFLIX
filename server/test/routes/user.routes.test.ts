import {
    describe,
    it,
    expect,
    beforeAll,
    afterEach
  } from "vitest";
  
import request from "supertest";
import { serve } from "@hono/node-server";
  
import { app } from "../../src/index";
import { UserService } from "../../src/modules/users/UserService";
import { UserRepository } from "../../src/modules/users/UserRepository";
  
// Creamos un servidor HTTP a partir de Hono
const server = serve({
  fetch: app.fetch,
  port: 0
});
  
  // Instanciamos las dependencias reales
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
  
// Guardamos los usuarios creados durante cada prueba
let createdUserIds: number[] = [];

let userCounter = 0;

// Genera datos únicos para evitar conflictos entre pruebas.
const createUserData = () => {
  userCounter++;

  const uniqueId = `${Date.now()}-${userCounter}`;

  return {
    nombre_usuario: `test-${uniqueId}`,
    correo: `test-${uniqueId}@graphflix.com`,
    password: "password123"
  };
};

// Registra un usuario mediante la API y guarda su ID para limpiarlo.
const registerUser = async () => {
  const userData = createUserData();

  const response = await request(server)
    .post("/users/register")
    .send(userData);

  if (response.status !== 201) {
    throw new Error(`Error registrando usuario: ${JSON.stringify(response.body)}`);
  }

  createdUserIds.push(response.body.id_usuario);

  return {
    user: response.body,
    credentials: {
      correo: userData.correo,
      password: userData.password
    }
  };
};

// Crea un agente autenticado mediante el endpoint de login.
const createAuthenticatedAgent = async (credentials: {
  correo: string;
  password: string;
}) => {
  const agent = request.agent(server);

  const response = await agent
    .post("/users/login")
    .send(credentials);

  if (response.status !== 200) {
    throw new Error(`Error iniciando sesión: ${JSON.stringify(response.body)}`);
  }

  return agent;
};

describe("User Routes", () => {

  beforeAll(() => {
    // Evita ejecutar accidentalmente las pruebas contra la BD de desarrollo.
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL no está definida");
    }

    const databaseName = new URL(databaseUrl).pathname.slice(1);

    if (databaseName !== "graphflix_test") {
      throw new Error(
        `Las pruebas deben ejecutarse contra graphflix_test. BD actual: ${databaseName}`
      );
    }

    if (!process.env.TOKEN_SECRET_KEY) {
      throw new Error("TOKEN_SECRET_KEY no está definida");
    }
  });

  afterEach(async () => {
    // Eliminamos únicamente los usuarios creados por este archivo.
    for (const id of createdUserIds) {
      await userService.deleteUser(id);
    }

    createdUserIds = [];
  });

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  describe("POST /users/register", () => {

    it("debería registrar un usuario correctamente", async () => {
      const userData = createUserData();

      const response = await request(server)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty("id_usuario");
      expect(response.body.nombre_usuario).toBe(userData.nombre_usuario);
      expect(response.body.correo).toBe(userData.correo);

      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("password_hash");

      createdUserIds.push(response.body.id_usuario);
    });

    it("debería rechazar un cuerpo vacío al registrar", async () => {
      const response = await request(server)
        .post("/users/register")
        .set("Content-Type", "application/json")
        .send("null");
      
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "El cuerpo de la petición es obligatorio"
      );
    });

    it("debería rechazar un registro con campos obligatorios ausentes", async () => {
      const response = await request(server)
          .post("/users/register")
          .send({
          nombre_usuario: "test"
      });
      
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Faltan campos obligatorios");
    });
  });

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  describe("POST /users/login", () => {

    it("debería iniciar sesión con credenciales correctas", async () => {
      const { credentials, user } = await registerUser();

      const response = await request(server)
        .post("/users/login")
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.id_usuario).toBe(user.id_usuario);

      // Comprueba que se haya enviado la cookie JWT.
      expect(response.headers["set-cookie"]).toBeDefined();

      const cookies = response.headers["set-cookie"]!;

      expect(cookies).toContain("access_token=");
      expect(cookies.toLowerCase()).toContain("httponly");
    });

    it("debería rechazar un cuerpo vacío al iniciar sesión", async () => {
      const response = await request(server)
        .post("/users/login")
        .set("Content-Type", "application/json")
        .send("null");
      
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "El cuerpo de la petición es obligatorio"
      );
    });

    it("debería rechazar un login sin todos los campos obligatorios", async () => {
      const response = await request(server)
        .post("/users/login")
        .send({
          correo: "test@graphflix.com"
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Faltan campos obligatorios");
    });
  });

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  describe("POST /users/logout", () => {

    it("debería cerrar la sesión y eliminar la cookie", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .post("/users/logout");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Sesión cerrada correctamente");

      // Después del logout, la cookie ya no debería permitir autenticarse.
      const protectedResponse = await agent
        .get("/users");

      expect(protectedResponse.status).toBe(401);
    });

  });

  // --------------------------------------------------
  // GET /users
  // --------------------------------------------------

  describe("GET /users", () => {

    it("debería obtener los usuarios cuando está autenticado", async () => {
      const { credentials, user } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .get("/users");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const foundUser = response.body.find(
        (item: { id_usuario: number }) =>
          item.id_usuario === user.id_usuario
      );

      expect(foundUser).toBeDefined();
    });

    it("no debería permitir obtener los usuarios sin autenticación", async () => {
      const response = await request(server)
        .get("/users");

      expect(response.status).toBe(401);
    });

  });

  // --------------------------------------------------
  // GET /users/:id
  // --------------------------------------------------

  describe("GET /users/:id", () => {

    it("debería obtener un usuario por su ID", async () => {
      const { credentials, user } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .get(`/users/${user.id_usuario}`);

      expect(response.status).toBe(200);
      expect(response.body.id_usuario).toBe(user.id_usuario);
      expect(response.body.correo).toBe(user.correo);
    });

    it("no debería permitir consultar un usuario sin autenticación", async () => {
      const response = await request(server)
        .get("/users/1");

      expect(response.status).toBe(401);
    });

    it("debería rechazar un ID inválido al consultar un usuario", async () => {
      const { credentials, user } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);
      
      const response = await agent.get("/users/abc");
      
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("ID inválido");
    });
  });

  // --------------------------------------------------
  // PATCH /users/me
  // --------------------------------------------------

  describe("PATCH /users/me", () => {

    it("debería actualizar parcialmente los datos del usuario", async () => {
      const { credentials, user } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const newUsername = `updated-${Date.now()}`;

      const response = await agent
        .patch("/users/me")
        .send({
          nombre_usuario: newUsername
        });

      expect(response.status).toBe(200);
      expect(response.body.nombre_usuario).toBe(newUsername);
      expect(response.body.correo).toBe(user.correo);

      // El hash nunca debe llegar al cliente.
      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("password_hash");
    });

    it("debería actualizar el correo del usuario", async () => {
      const { credentials, user } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const newEmail = `updated-${Date.now()}@graphflix.com`;

      const response = await agent
        .patch("/users/me")
        .send({
          correo: newEmail
        });

      expect(response.status).toBe(200);
      expect(response.body.correo).toBe(newEmail);
      expect(response.body.nombre_usuario).toBe(user.nombre_usuario);
    });

    it("no debería permitir actualizar campos no autorizados", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      // "password" ya no está permitido: hay que usar password_actual y password_nueva.
      const response = await agent
        .patch("/users/me")
        .send({
          password: "newPassword123"
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Actualización no permitida");
    });

    it("no debería permitir modificar usuarios sin autenticación", async () => {
      const response = await request(server)
        .patch("/users/me")
        .send({
          nombre_usuario: "sin-sesion"
        });

      expect(response.status).toBe(401);
    });

    it("debería rechazar un cuerpo vacío al actualizar", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .patch("/users/me")
        .set("Content-Type", "application/json")
        .send("null");

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "El cuerpo de la petición es obligatorio"
      );
    });

    it("debería rechazar una actualización sin datos", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .patch("/users/me")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("No hay datos para actualizar");
    });

    // ------------------------------------------------
    // Cambio de contraseña
    // ------------------------------------------------

    it("debería cambiar la contraseña con la contraseña actual correcta", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const newPassword = "newPassword123";

      const response = await agent
        .patch("/users/me")
        .send({
          password_actual: credentials.password,
          password_nueva: newPassword
        });

      expect(response.status).toBe(200);

      // Con la contraseña nueva se puede iniciar sesión...
      const loginWithNew = await request(server)
        .post("/users/login")
        .send({
          correo: credentials.correo,
          password: newPassword
        });

      expect(loginWithNew.status).toBe(200);

      // ...y con la antigua ya no.
      const loginWithOld = await request(server)
        .post("/users/login")
        .send(credentials);

      expect(loginWithOld.status).not.toBe(200);
    });

    it("debería actualizar a la vez el nombre y la contraseña", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const newUsername = `updated-${Date.now()}`;
      const newPassword = "newPassword123";

      const response = await agent
        .patch("/users/me")
        .send({
          nombre_usuario: newUsername,
          password_actual: credentials.password,
          password_nueva: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.nombre_usuario).toBe(newUsername);

      const loginWithNew = await request(server)
        .post("/users/login")
        .send({
          correo: credentials.correo,
          password: newPassword
        });

      expect(loginWithNew.status).toBe(200);
    });

    it("debería rechazar el cambio si la contraseña actual es incorrecta", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .patch("/users/me")
        .send({
          password_actual: "incorrecta123",
          password_nueva: "newPassword123"
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "La contraseña actual no es correcta"
      );

      // La contraseña original sigue funcionando.
      const login = await request(server)
        .post("/users/login")
        .send(credentials);

      expect(login.status).toBe(200);
    });

    it("debería rechazar el cambio si falta uno de los dos campos de contraseña", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .patch("/users/me")
        .send({
          password_nueva: "newPassword123"
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "Debes indicar la contraseña actual y la nueva"
      );
    });

    it("debería rechazar una nueva contraseña demasiado corta", async () => {
      const { credentials } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .patch("/users/me")
        .send({
          password_actual: credentials.password,
          password_nueva: "corta"
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "La nueva contraseña debe tener al menos 8 caracteres"
      );
    });

  });

  // --------------------------------------------------
  // DELETE /users/:id
  // --------------------------------------------------

  describe("DELETE /users/:id", () => {

    it("debería eliminar un usuario correctamente", async () => {
      const { credentials, user } = await registerUser();

      const agent = await createAuthenticatedAgent(credentials);

      const response = await agent
        .delete(`/users/${user.id_usuario}`);

      expect(response.status).toBe(204);
      expect(response.text).toBe("");

      // El usuario ya ha sido eliminado: evitamos intentar borrarlo
      // nuevamente en afterEach.
      createdUserIds = createdUserIds.filter(
        (id) => id !== user.id_usuario
      );

      // Comprobamos que ya no existe.
      const deletedUser = await userService.getUserById(user.id_usuario)
        .catch(() => undefined);

      expect(deletedUser).toBeUndefined();
    });

    it("no debería permitir eliminar usuarios sin autenticación", async () => {
      const response = await request(server)
        .delete("/users/1");

      expect(response.status).toBe(401);
    });
  });

});