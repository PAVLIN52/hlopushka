import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ProjectAction } from '@hlopushka/shared';

import { AccessDeniedException, ErrorCodes, NotFoundException } from '@/core/exceptions';

import { AuthenticatedRequest } from '@/common/decorators/current-user.decorator';

import { IProjectAccessResolver, PROJECT_ACCESS_RESOLVER, ProjectMembership } from './project-access.interface';

/** Ключ метаданных с требуемым действием. */
export const PROJECT_ACTION_KEY = 'projectAction';

/** Формат UUID: идентификаторы с другим форматом заведомо не существуют. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Запрос после `ProjectAccessGuard`. */
export interface ProjectRequest extends AuthenticatedRequest {
  membership?: ProjectMembership;
}

/**
 * Проверка доступа к проекту из маршрута `/projects/:id/...` (FR-011).
 *
 * 1. Проекта нет или id некорректный → `NotFoundException` `PROJECT_NOT_FOUND` (404).
 * 2. Пользователь не участник → `AccessDeniedException` `PROJECT_ACCESS_DENIED` (403).
 * 3. Роли не разрешено действие → `AccessDeniedException` `ROLE_FORBIDDEN` (403).
 *
 * Права проверяются на сервере для каждого запроса — интерфейс их только отражает.
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PROJECT_ACCESS_RESOLVER) private readonly resolver: IProjectAccessResolver,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<ProjectAction | undefined>(PROJECT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<ProjectRequest>();
    const params = request.params as Record<string, string | undefined>;
    const projectId = params.projectId ?? params.id;
    const userId = request.user?.id;

    if (!action || !projectId || !userId) {
      throw new AccessDeniedException('Доступ запрещён', null, ErrorCodes.PROJECT_ACCESS_DENIED);
    }
    if (!UUID.test(projectId)) {
      throw new NotFoundException('Проект не найден', projectId, ErrorCodes.PROJECT_NOT_FOUND);
    }

    const membership = await this.resolver.resolveMembership(projectId, userId);
    if (!this.resolver.can(membership.role, action)) {
      throw new AccessDeniedException(
        'У вашей роли нет прав на это действие',
        { role: membership.role, action },
        ErrorCodes.ROLE_FORBIDDEN,
      );
    }
    request.membership = membership;
    return true;
  }
}
