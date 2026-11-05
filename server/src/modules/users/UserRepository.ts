import type { CreateUser, UpdateData, User } from "./user.model";
import { sql } from "../../db/db";

/**
 * 
 */
export class UserRepository {
  async searchByEmail(email: string) : Promise<User | undefined> {
    const [user] = await sql<User[]>`
      SELECT *
      FROM usuario
      WHERE correo = ${email};
    `;

    return user;
  }

  async searchByUsername(username: string) {
    const [user] = await sql<User[]>`
      SELECT *
      FROM usuario
      WHERE nombre_usuario = ${username};
    `;

    return user;
  }

  async findById(id: number) : Promise<User | undefined> {
    const [user] = await sql<User[]>`
      SELECT *
      FROM usuario
      WHERE id_usuario = ${id};
    `;

    return user;
  }

  async findAll(): Promise<User[]> {
      const users = await sql<User[]>`
          SELECT *
          FROM usuario;
      `;

      return users;
  }
  

  async create(user: CreateUser) : Promise<User> {
    const [newUser] = await sql`
      INSERT INTO usuario(nombre_usuario,correo,password_hash)
      (${user.nombre_usuario}, ${user.correo}, ${user.password_hash});
    `;

    return newUser;
  }

async update(id: number, data: UpdateData): Promise<User | undefined> {
    const [user] = await sql<User[]>`
        UPDATE usuario
        SET
            correo = COALESCE(${data.correo ?? null}, correo),
            nombre_usuario = COALESCE(${data.nombre_usuario ?? null}, nombre_usuario)
        WHERE id_usuario = ${id};
    `;

    return user;
}

  async delete(id: number): Promise<boolean> {

      const result = await sql`
          DELETE FROM usuario
          WHERE id_usuario = ${id}
          RETURNING id_usuario
      `;

      return result.length > 0;
  }
}