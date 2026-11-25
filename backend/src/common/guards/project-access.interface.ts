import { ProjectAction, Role } from '@hlopushka/shared';

/** Участие текущего пользователя в проекте, которое guard кладёт в запрос. */
export interface ProjectMembership {
  projectId: string;
  userId: string;
  role: Role;
}

/**
 * Откуда `ProjectAccessGuard` узнаёт участие и права (инверсия зависимостей):
 * guard из `common` зависит только от этого интерфейса, а реализует его модуль проектов.
 */
export interface IProjectAccessResolver {
  /**
   * @throws NotFoundException `PROJECT_NOT_FOUND`, если проекта нет
   * @throws AccessDeniedException `PROJECT_ACCESS_DENIED`, если пользователь не участник
   */
  resolveMembership(projectId: string, userId: string): Promise<ProjectMembership>;

  /** Разрешено ли роли действие (FR-011). */
  can(role: Role, action: ProjectAction): boolean;
}

/** Токен внедрения реализации `IProjectAccessResolver`. */
export const PROJECT_ACCESS_RESOLVER = Symbol('PROJECT_ACCESS_RESOLVER');
