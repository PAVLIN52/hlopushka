import { ProjectAction, Role } from '@hlopushka/shared';

import { ProjectPermissions } from './project-permissions';

/** Матрица прав из спецификации (FR-011): строка — роль, значения — разрешённые действия. */
const EXPECTED: Record<Role, ProjectAction[]> = {
  [Role.PRODUCER]: [ProjectAction.VIEW, ProjectAction.EDIT_TASKS, ProjectAction.DELETE_TASKS, ProjectAction.MANAGE_PROJECT],
  [Role.EDITOR]: [ProjectAction.VIEW, ProjectAction.EDIT_TASKS],
  [Role.COLORIST]: [ProjectAction.VIEW, ProjectAction.EDIT_TASKS],
  [Role.CLIENT]: [ProjectAction.VIEW],
};

describe('ProjectPermissions (матрица FR-011)', () => {
  const cases = Object.values(Role).flatMap((role) =>
    Object.values(ProjectAction).map((action) => [role, action, EXPECTED[role].includes(action)] as const),
  );

  it.each(cases)('%s → %s: %s', (role, action, allowed) => {
    expect(ProjectPermissions.can(role, action)).toBe(allowed);
  });

  it('allowedActions возвращает ровно разрешённые действия', () => {
    for (const role of Object.values(Role)) {
      expect([...ProjectPermissions.allowedActions(role)].sort()).toEqual([...EXPECTED[role]].sort());
    }
  });
});
