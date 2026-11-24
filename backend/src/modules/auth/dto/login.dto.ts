import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

import { LoginDto as LoginContract } from '@hlopushka/shared';

/** Тело входа (data-model.md → `User.email`). */
export class LoginDto implements LoginContract {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Некорректный email' })
  public email: string;

  @IsString({ message: 'Введите пароль' })
  @MaxLength(128, { message: 'Пароль слишком длинный' })
  public password: string;
}
