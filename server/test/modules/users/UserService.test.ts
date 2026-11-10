import { describe, it, expect, beforeAll, afterAll, afterEach,} from "vitest";

import { UserService } from "../../../src/modules/users/UserService";
import { UserRepository } from "../../../src/modules/users/UserRepository";
import { sql } from "../../../src/db/db";

import { ConflictError, UnauthorizedError, NotFoundError} from "../../../src/errors/AppError";

import type { CreateUser } from "../../../src/modules/users/user.model";

describe("UserService", () => {
  let userService: UserService;
  let createdUserIds: number[] = [];

  beforeAll(() => {
    const userRepository = new UserRepository();
    userService = new UserService(userRepository);
  });

  afterEach(async () => {
    for (const id_usuario of createdUserIds) {
      await userService.deleteUser(id_usuario);
    }

    createdUserIds = [];
  });

  afterAll(async () => {
    await sql.end();
  });

  // Crea un usuario y guarda su id_usuario para limpiarlo después.
  const registerTestUser = async (userData: CreateUser) => {
    const user = await userService.userRegister(userData);
    createdUserIds.push(user.id_usuario);
    return user;
  };

  // Genera datos únicos para evitar conflictos entre pruebas.
  const createUserData = (): CreateUser => {
    const uniqueId = `${Date.now()}-${Math.random()}`;

    return {
      nombre_usuario: `test-${uniqueId}`,
      correo: `test-${uniqueId}@graphflix.com`,
      password: "password123",
    };
  };

  // --------------------------------------------------
  // userRegister()
  // --------------------------------------------------

  describe("userRegister()", () => {
    it("debería registrar un usuario correctamente", async () => {
      const userData = createUserData();

      const result = await registerTestUser(userData);

      expect(result.id_usuario).toBeDefined();
      expect(result.nombre_usuario).toBe(userData.nombre_usuario);
      expect(result.correo).toBe(userData.correo);
      expect(result).not.toHaveProperty("password_hash");
    });

    it("debería lanzar ConflictError si el nombre de usuario ya existe", async () => {
      const userData = createUserData();

      await registerTestUser(userData);

      await expect(
        userService.userRegister({
          ...userData,
          correo: `otro-${Date.now()}@graphflix.com`,
        })
      ).rejects.toThrow(ConflictError);
    });

    it("debería lanzar ConflictError si el correo ya existe", async () => {
      const userData = createUserData();

      await registerTestUser(userData);

      await expect(
        userService.userRegister({
          ...userData,
          nombre_usuario: `otro-${Date.now()}`,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  // --------------------------------------------------
  // userLogin()
  // --------------------------------------------------

  describe("userLogin()", () => {
    it("debería autenticar un usuario correctamente", async () => {
      const userData = createUserData();

      await registerTestUser(userData);

      const result = await userService.userLogin(
        userData.correo,
        userData.password
      );

      expect(result.nombre_usuario).toBe(userData.nombre_usuario);
      expect(result.correo).toBe(userData.correo);
      expect(result).not.toHaveProperty("password_hash");
    });

    it("debería lanzar UnauthorizedError si el usuario no existe", async () => {
      await expect(
        userService.userLogin(
          `inexistente-${Date.now()}@graphflix.com`,
          "password123"
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    it("debería lanzar UnauthorizedError si la contraseña es incorrecta", async () => {
      const userData = createUserData();

      await registerTestUser(userData);

      await expect(
        userService.userLogin(userData.correo, "incorrecta")
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  // --------------------------------------------------
  // deleteUser()
  // --------------------------------------------------

  describe("deleteUser()", () => {
    it("debería eliminar un usuario existente", async () => {
      const user = await registerTestUser(createUserData());

      const result = await userService.deleteUser(user.id_usuario);

      expect(result).toBe(true);

      // Ya se ha eliminado manualmente, por lo que no debe
      // volver a intentarse su eliminación en afterEach.
      createdUserIds = createdUserIds.filter((id_usuario) => id_usuario !== user.id_usuario);

      await expect(
        userService.getUserById(user.id_usuario)
      ).rejects.toThrow(NotFoundError);
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      await expect(
        userService.deleteUser(-999)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------
  // updateUser()
  // --------------------------------------------------

  describe("updateUser()", () => {
    it("debería actualizar un usuario correctamente", async () => {
      const userData = createUserData();
      const user = await registerTestUser(userData);

      const result = await userService.updateUser(user.id_usuario, {
        nombre_usuario: `nuevo-${Date.now()}`,
      });

      expect(result.nombre_usuario).not.toBe(userData.nombre_usuario);
      expect(result.correo).toBe(userData.correo);
      expect(result).not.toHaveProperty("password_hash");
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      await expect(
        userService.updateUser(-999, {
          nombre_usuario: "nuevo_nombre",
        })
      ).rejects.toThrow(NotFoundError);
    });

  });

  // --------------------------------------------------
  // getUserById()
  // --------------------------------------------------

  describe("getUserById()", () => {
    it("debería devolver un usuario existente", async () => {
      const userData = createUserData();
      const user = await registerTestUser(userData);

      const result = await userService.getUserById(user.id_usuario);

      expect(result.id_usuario).toBe(user.id_usuario);
      expect(result.nombre_usuario).toBe(userData.nombre_usuario);
      expect(result).not.toHaveProperty("password_hash");
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      await expect(
        userService.getUserById(-999)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------
  // getAllUsers()
  // --------------------------------------------------

  describe("getAllUsers()", () => {
    it("debería devolver todos los usuarios sin sus contraseñas", async () => {
      const user1 = await registerTestUser(createUserData());
      const user2 = await registerTestUser(createUserData());

      const result = await userService.getAllUsers();

      const registeredUsers = result.filter(
        (user) => user.id_usuario === user1.id_usuario || user.id_usuario === user2.id_usuario
      );

      expect(registeredUsers).toHaveLength(2);

      registeredUsers.forEach((user) => {
        expect(user).not.toHaveProperty("password_hash");
      });
    });
  });
});