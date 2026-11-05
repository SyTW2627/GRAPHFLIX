import type { CreateUser, UpdateUser, User, PublicUser } from "./user.model";
import type { UserRepository } from "./UserRepository";

/**
 * Servicio encargado de gestionar la lógica de negocio relacionada
 * con los usuarios, delegando las operaciones de persistencia en UserRepository.
 */
export class UserService {
  /**
   * 
   * @param userRepository Repositorio encargado de realizar las 
   * operaciones sobre la tabla de usuarios.
   */
  public constructor(private userRepository: UserRepository) {}

  /**
   * Registra un nuevo usuario, comprobando previamente que su nombre 
   * de usuario y correo electrónico no estén registrados. También genera 
   * el hash de la contraseña antes de almacenarla en la base de datos.
   * 
   * @param user Datos del usuario que se desea registrar.
   * @returns Datos públicos del usuario registrado, sin incluir su contraseña.
   * @throws Error Si el nombre de usuario o el correo electrónico ya están registrados.
   */
  public async userRegister(user: CreateUser) : Promise<PublicUser> {
    const usernameExist = await this.userRepository.searchByUsername(user.nombre_usuario);
    if (usernameExist !== undefined) {
      throw new Error("El nombre de usuario ya está en uso");
    }
    const emailExist = await this.userRepository.searchByEmail(user.correo);
    if (emailExist !== undefined) {
      throw new Error("El correo electrónico ya está registrado");
    }
    const passwordHash = await Bun.password.hash(user.password_hash);

    const userRegistered = await this.userRepository.create({
      ...user,
      password_hash: passwordHash
    });

    const {password_hash, ...publicUser} = userRegistered;

    return publicUser;
  }

  /**
   * Autentica a un usuario comprobando que existe una cuenta 
   * asociada al correoelectrónico proporcionado y verificando su contraseña.
   * 
   * @param email Correo electrónico del usuario.
   * @param password Contraseña introducida en texto plano.
   * @returns Datos públicos del usuario autenticado, sin incluir su contraseña.
   * @throws Error Si el usuario no existe o las credenciales son incorrectas.
   */
  async userLogin(email: string, password: string) : Promise<PublicUser> {
    const user = await this.userRepository.searchByEmail(email);

    if (!user) {
        throw new Error("Credenciales incorrectas");
    }
    const passwordValid = await Bun.password.verify(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      throw new Error("Contraseña incorrecta");
    }

    const { password_hash, ...publicUser } = user;

    return publicUser;
  }

  /**
   * Elimina un usuario de la base de datos después de comprobar que existe.
   * 
   * @param id Identificador del usuario que se desea eliminar.
   * @returns true si el usuario ha sido eliminado correctamente.
   * @throws Error Si no existe ningún usuario con el identificador proporcionado.
   */
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.userRepository.findById(id);

    if (!user) {
        throw new Error("El usuario no existe");
    }

    return this.userRepository.delete(id);
  }

  /**
   * Actualiza los datos de un usuario después de comprobar que existe. Excluye
   * el hash de la contraseña de los datos devueltos.
   * 
   * @param id Identificador del usuario que se desea actualizar.
   * @param data Nuevos datos que se desean establecer.
   * @returns Datos públicos del usuario actualizado.
   * @throws Error Si el usuario no existe o no se puede realizar la actualización.
   */
  async updateUser(id: number, data: UpdateUser): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);

    if (!user) {
        throw new Error("El usuario no existe");
    }

    const updatedUser = await this.userRepository.update(id, data);

    if (!updatedUser) {
        throw new Error("No se pudo actualizar el usuario");
    }

    const {password_hash, ...publicUser} = updatedUser;

    return publicUser;
  }

  /**
   * Busca un usuario mediante su identificador.
   *
   * @param id Identificador del usuario que se desea consultar.
   * @returns Datos públicos del usuario encontrado.
   * @throws Error Si no existe ningún usuario con ese identificador.
   */
  async getUserById(id: number): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("El usuario no existe");
    }

    const { password_hash, ...publicUser } = user;

    return publicUser;
  }

  /**
   * Obtiene todos los usuarios registrados en la base de datos.
   *
   * @returns Lista de usuarios, sin incluir sus hashes de contraseña.
   */
  async getAllUsers(): Promise<PublicUser[]> {
      const users = await this.userRepository.findAll();

      return users.map(({ password_hash, ...publicUser }) => publicUser);
  }
}