import type { CreateUser, UpdateUser, User } from "./user.model";
import { sql } from "../../db/db";

/**
 * Repositorio encargado de gestionar el acceso a los datos
 * de los usuarios en la base de datos PostgreSQL.
 */
export class UserRepository {
  /**
   * Busca un usuario mediante su correo electrónico.
   * 
   * @param email Correo electrónico que se desea buscar.
   * @returns El usuario encontrado o undefined si no existe.
   */
  async searchByEmail(email: string) : Promise<User | undefined> {
    const [user] = await sql<User[]>`
      SELECT *
      FROM usuario
      WHERE correo = ${email};
    `;

    return user;
  }

  /**
   * Busca un usuario mediante su nombre de usuario.
   * 
   * @param username Nombre de usuario que se desea buscar.
   * @returns El usuario encontrado o undefined si no existe.
   */
  async searchByUsername(username: string) {
    const [user] = await sql<User[]>`
      SELECT *
      FROM usuario
      WHERE nombre_usuario = ${username};
    `;

    return user;
  }

  /**
   * Busca un usuario mediante su identificador.
   * 
   * @param id Identificador del usuario.
   * @returns El usuario encontrado o undefined si no existe.
   */
  async findById(id: number) : Promise<User | undefined> {
    const [user] = await sql<User[]>`
      SELECT *
      FROM usuario
      WHERE id_usuario = ${id};
    `;

    return user;
  }

  /**
   * Recupera todos los usuarios registrados.
   * 
   * @returns Array con todos los usuarios encontrados.
   */
  async findAll(): Promise<User[]> {
      const users = await sql<User[]>`
          SELECT *
          FROM usuario;
      `;

      return users;
  }
  
  /**
   * Inserta un nuevo usuario en la base de datos.
   * 
   * @param user Datos necesarios para crear el usuario.
   * @returns El usuario creado, incluyendo su identificador.
   */
  async create(user: CreateUser) : Promise<User> {
    const [newUser] = await sql`
      INSERT INTO usuario(nombre_usuario,correo,password_hash)
      VALUES (${user.nombre_usuario}, ${user.correo}, ${user.password});
    `;

    return newUser;
  }


  /**
   * Actualiza el correo y/o el nombre de usuario de un usuario.
   * Los campos que no se proporcionen conservarán su valor actual.
   * 
   * @param id Identificador del usuario que se desea modificar.
   * @param data Datos que se desean actualizar.
   * @returns El usuario actualizado o undefined si no existe.
   */
  async update(id: number, data: UpdateUser): Promise<User | undefined> {
      const [user] = await sql<User[]>`
          UPDATE usuario
          SET
              correo = COALESCE(${data.correo ?? null}, correo),
              nombre_usuario = COALESCE(${data.nombre_usuario ?? null}, nombre_usuario)
          WHERE id_usuario = ${id};
      `;

      return user;
  }

  /**
   * Elimina un usuario mediante su identificador.
   * 
   * @param id Identificador del usuario que se desea eliminar.
   * @returns true si se ha eliminado un usuario, false si no existía.
   */
  async delete(id: number): Promise<boolean> {
      const result = await sql`
          DELETE FROM usuario
          WHERE id_usuario = ${id}
          RETURNING id_usuario
      `;

      return result.length > 0;
  }
}