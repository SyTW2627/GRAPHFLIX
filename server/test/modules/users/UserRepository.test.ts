import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { UserRepository } from "../../../src/modules/users/UserRepository";

// Instancia del repositorio
const userRepository = new UserRepository();

// Guardamos los IDs de los usuarios creados durante las pruebas
const createdUserIds: number[] = [];

// Datos de prueba
function createTestUser() {
  const uniqueId = `${Date.now()}-${Math.random()}`;

  return {
    nombre_usuario: `test_${uniqueId}`,
    correo: `test_${uniqueId}@graphflix.com`,
    password: "hash_de_prueba"
  };
}

// Comprobamos que estamos utilizando la base de datos de pruebas
beforeAll(() => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definida");
  }

  const databaseName = new URL(databaseUrl).pathname.replace("/", "");

  if (databaseName !== "graphflix_test") {
    throw new Error(
      `Los tests deben ejecutarse sobre graphflix_test. Base de datos actual: ${databaseName}`
    );
  }
});

// Limpiamos los usuarios creados después de cada test
afterEach(async () => {
  for (const id of createdUserIds) {
    await userRepository.delete(id);
  }

  createdUserIds.length = 0;
});

describe("UserRepository", () => {

  describe("create()", () => {
    it("debería crear un usuario correctamente", async () => {
      const userData = createTestUser();

      const user = await userRepository.create(userData);

      createdUserIds.push(user.id_usuario);

      expect(user).toBeDefined();
      expect(user.nombre_usuario).toBe(userData.nombre_usuario);
      expect(user.correo).toBe(userData.correo);
    });
  });

  describe("searchByEmail()", () => {
    it("debería encontrar un usuario por su correo", async () => {
      const userData = createTestUser();

      const createdUser = await userRepository.create(userData);
      createdUserIds.push(createdUser.id_usuario);

      const user = await userRepository.searchByEmail(userData.correo);

      expect(user).toBeDefined();
      expect(user?.id_usuario).toBe(createdUser.id_usuario);
    });

    it("debería devolver undefined si el correo no existe", async () => {
      const user = await userRepository.searchByEmail(
        "correo_inexistente@graphflix.com"
      );

      expect(user).toBeUndefined();
    });
  });

  describe("searchByUsername()", () => {
    it("debería encontrar un usuario por su nombre de usuario", async () => {
      const userData = createTestUser();

      const createdUser = await userRepository.create(userData);
      createdUserIds.push(createdUser.id_usuario);

      const user = await userRepository.searchByUsername(
        userData.nombre_usuario
      );

      expect(user?.id_usuario).toBe(createdUser.id_usuario);
    });
  });

  describe("findById()", () => {
    it("debería encontrar un usuario por su ID", async () => {
      const userData = createTestUser();

      const createdUser = await userRepository.create(userData);
      createdUserIds.push(createdUser.id_usuario);

      const user = await userRepository.findById(createdUser.id_usuario);

      expect(user?.correo).toBe(userData.correo);
    });

    it("debería devolver undefined si el ID no existe", async () => {
      const user = await userRepository.findById(-1);

      expect(user).toBeUndefined();
    });
  });

  describe("findAll()", () => {
    it("debería devolver los usuarios existentes", async () => {
      const userData = createTestUser();

      const createdUser = await userRepository.create(userData);
      createdUserIds.push(createdUser.id_usuario);

      const users = await userRepository.findAll();

      expect(users.length).toBeGreaterThan(0);
      expect(
        users.some((user) => user.id_usuario === createdUser.id_usuario)
      ).toBe(true);
    });
  });

  describe("update()", () => {
    it("debería actualizar los datos de un usuario", async () => {
      const userData = createTestUser();

      const createdUser = await userRepository.create(userData);
      createdUserIds.push(createdUser.id_usuario);

      const updatedUser = await userRepository.update(
        createdUser.id_usuario,
        {
          nombre_usuario: "usuario_actualizado",
          correo: "actualizado@graphflix.com"
        }
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.nombre_usuario).toBe("usuario_actualizado");
      expect(updatedUser?.correo).toBe("actualizado@graphflix.com");
    });
  });

  describe("delete()", () => {
    it("debería eliminar un usuario correctamente", async () => {
      const userData = createTestUser();

      const createdUser = await userRepository.create(userData);
      createdUserIds.push(createdUser.id_usuario);

      const deleted = await userRepository.delete(createdUser.id_usuario);

      expect(deleted).toBe(true);

      const user = await userRepository.findById(createdUser.id_usuario);

      expect(user).toBeUndefined();
    });
  });

});