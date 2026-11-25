import { ProjectAction, Role } from '@hlopushka/shared';

/** Матрица прав FR-011: какие действия разрешены каждой роли. */
const MATRIX: Readonly<Record<Role, ReadonlySet<ProjectAction>>> = {
  [Role.PRODUCER]: new Set([
    ProjectAction.VIEW,
    ProjectAction.EDIT_TASKS,
    ProjectAction.DELETE_TASKS,
    ProjectAction.MANAGE_PROJECT,
  ]),
  [Role.EDITOR]: new Set([ProjectAction.VIEW, ProjectAction.EDIT_TASKS]),
  [Role.COLORIST]: new Set([ProjectAction.VIEW, ProjectAction.EDIT_TASKS]),
  [Role.CLIENT]: new Set([ProjectAction.VIEW]),
};

/**
 * Права ролей в проекте (FR-011). Единственное место, где записана матрица
 * «роль → действие»; её используют guard и сервисы.
 */
export class ProjectPermissions {
  /** Разрешено ли роли действие. */
  public static can(role: Role, action: ProjectAction): boolean {
    return MATRIX[role].has(action);
  }

  /** Все действия, разрешённые роли. */
  public static allowedActions(role: Role): ProjectAction[] {
    return [...MATRIX[role]];
  }
}
