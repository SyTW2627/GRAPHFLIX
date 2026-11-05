import type { UserRepository } from "./UserRepository";

export class UserService {
  public constructor(private userRepository: UserRepository) {}
}