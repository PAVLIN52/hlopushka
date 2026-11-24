import { UserDto } from '@hlopushka/shared';

/** Данные для создания пользователя (пароль уже захеширован). */
export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/** Данные для изменения пользователя. */
export type UpdateUserData = Partial<Pick<CreateUserData, 'name'>>;

/**
 * Пользователь системы (data-model.md → User).
 *
 * Хеш пароля в доменный объект не попадает: его читают только через
 * `UsersRepository.findCredentialsByEmail`, поэтому случайно вернуть его в API нельзя.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date,
  ) {}

  /** Нормализация email: хранится и сравнивается в нижнем регистре. */
  public static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Представление для ответов API. */
  public toDto(): UserDto {
    return { id: this.id, name: this.name, email: this.email, createdAt: this.createdAt.toISOString() };
  }
}
