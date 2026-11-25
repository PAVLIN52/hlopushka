import { IsEnum } from 'class-validator';

import { Role, UpdateMemberRoleDto as UpdateMemberRoleContract } from '@hlopushka/shared';

/** Тело смены роли участника (data-model.md → `ProjectMember.role`, FR-009). */
export class UpdateMemberRoleDto implements UpdateMemberRoleContract {
  @IsEnum(Role, { message: 'Роль должна быть одной из: PRODUCER, EDITOR, COLORIST, CLIENT' })
  public role: Role;
}
