import { Injectable } from '@nestjs/common';
import { Prisma, User as UserRow } from '@prisma/client';

import { IRepository } from '@/core/collections';
import { ErrorCodes, NotFoundException, ValidationException } from '@/core/exceptions';

import { PrismaService } from '@/infrastructure/prisma/prisma.service';

import { CreateUserData, UpdateUserData, User } from './entities/user.entity';

/** Пользователь вместе с хешем пароля — только для проверки входа. */
export interface UserCredentials {
  user: User;
  passwordHash: string;
}

/** Доступ к пользователям в БД (реализует обобщённый `IRepository<T>`, принцип II). */
@Injectable()
export class UsersRepository implements IRepository<User, CreateUserData, UpdateUserData> {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  /** Поиск по email без учёта регистра. */
  public async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: User.normalizeEmail(email) } });
    return row ? this.toEntity(row) : null;
  }

  /** Пользователь и хеш пароля — используется только при входе. */
  public async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const row = await this.prisma.user.findUnique({ where: { email: User.normalizeEmail(email) } });
    return row ? { user: this.toEntity(row), passwordHash: row.passwordHash } : null;
  }

  /** @throws ValidationException `AUTH_EMAIL_TAKEN`, если email уже занят */
  public async create(data: CreateUserData): Promise<User> {
    try {
      const row = await this.prisma.user.create({
        data: { ...data, email: User.normalizeEmail(data.email) },
      });
      return this.toEntity(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ValidationException('Этот email уже зарегистрирован', data.email, ErrorCodes.AUTH_EMAIL_TAKEN);
      }
      throw error;
    }
  }

  public async update(id: string, data: UpdateUserData): Promise<User> {
    await this.ensureExists(id);
    return this.toEntity(await this.prisma.user.update({ where: { id }, data }));
  }

  public async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.prisma.user.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Пользователь не найден', id, ErrorCodes.USER_NOT_FOUND);
    }
  }

  private toEntity(row: UserRow): User {
    return new User(row.id, row.name, row.email, row.createdAt);
  }
}
