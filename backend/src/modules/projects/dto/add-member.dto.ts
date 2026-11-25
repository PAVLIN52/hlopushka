import { Transform } from 'class-transformer';
import { IsEmail, IsEnum } from 'class-validator';

import { AddMemberDto as AddMemberContract, Role } from '@hlopushka/shared';

/** Тело добавления участника по email (data-model.md → `User.email`, `ProjectMember.role`). */
export class AddMemberDto implements AddMemberContract {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Некорректный email' })
  public email: string;

  @IsEnum(Role, { message: 'Роль должна быть одной из: PRODUCER, EDITOR, COLORIST, CLIENT' })
  public role: Role;
}
