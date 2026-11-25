import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';

import { ProjectAction } from '@hlopushka/shared';

import { AccessDeniedException, ErrorCodes } from '@/core/exceptions';

import { PROJECT_ACTION_KEY, ProjectAccessGuard, ProjectRequest } from '@/common/guards/project-access.guard';
import { ProjectMembership } from '@/common/guards/project-access.interface';

/**
 * Требует участия в проекте из маршрута и права на действие:
 * `@ProjectAccess(ProjectAction.MANAGE_PROJECT)`.
 */
export const ProjectAccess = (action: ProjectAction): MethodDecorator & ClassDecorator =>
  applyDecorators(SetMetadata(PROJECT_ACTION_KEY, action), UseGuards(ProjectAccessGuard));

/** Участие текущего пользователя в проекте (доступно после `@ProjectAccess`). */
export const CurrentMembership = createParamDecorator((_: unknown, ctx: ExecutionContext): ProjectMembership => {
  const membership = ctx.switchToHttp().getRequest<ProjectRequest>().membership;
  if (!membership) throw new AccessDeniedException('Доступ запрещён', null, ErrorCodes.PROJECT_ACCESS_DENIED);
  return membership;
});
