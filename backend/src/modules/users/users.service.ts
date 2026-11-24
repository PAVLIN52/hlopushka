import { Injectable } from '@nestjs/common';

import { ErrorCodes, NotFoundException } from '@/core/exceptions';

import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

/** Операции с пользователями, нужные другим модулям (auth, projects). */
@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  /** @throws NotFoundException `USER_NOT_FOUND` */
  public async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден', id, ErrorCodes.USER_NOT_FOUND);
    return user;
  }

  /** @throws NotFoundException `USER_NOT_FOUND` */
  public async getByEmail(email: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден — попросите его сначала зарегистрироваться',
        email,
        ErrorCodes.USER_NOT_FOUND,
      );
    }
    return user;
  }
}
