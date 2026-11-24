import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

import { RegisterDto as RegisterContract } from '@hlopushka/shared';

/**
 * Тело регистрации. Ограничения полей — data-model.md → `User.name`, `User.email`.
 * Сложность пароля (FR-003) проверяет `AuthService`, чтобы вернуть код `AUTH_WEAK_PASSWORD`.
 */
export class RegisterDto implements RegisterContract {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Имя должно быть строкой' })
  @Length(1, 100, { message: 'Имя должно содержать от 1 до 100 символов' })
  public name: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Некорректный email' })
  public email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MaxLength(128, { message: 'Пароль слишком длинный (максимум 128 символов)' })
  public password: string;
}
