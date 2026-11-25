import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ProjectAction, Role } from '@hlopushka/shared';

import { AccessDeniedException, ErrorCodes, NotFoundException } from '@/core/exceptions';

import { ProjectAccessGuard, ProjectRequest } from './project-access.guard';
import { IProjectAccessResolver, ProjectMembership } from './project-access.interface';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

/** Подставной resolver: роль задаётся тестом, права — простой таблицей. */
class FakeResolver implements IProjectAccessResolver {
  constructor(private readonly outcome: Role | Error) {}

  public calls = 0;

  public async resolveMembership(projectId: string, userId: string): Promise<ProjectMembership> {
    this.calls += 1;
    if (this.outcome instanceof Error) throw this.outcome;
    return { projectId, userId, role: this.outcome };
  }

  public can(role: Role, action: ProjectAction): boolean {
    return action === ProjectAction.VIEW || role === Role.PRODUCER;
  }
}

function makeContext(request: Partial<ProjectRequest>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeGuard(resolver: IProjectAccessResolver, action: ProjectAction | undefined): ProjectAccessGuard {
  const reflector = { getAllAndOverride: () => action } as unknown as Reflector;
  return new ProjectAccessGuard(reflector, resolver);
}

describe('ProjectAccessGuard', () => {
  const request = (id = PROJECT_ID): Partial<ProjectRequest> =>
    ({ params: { id }, user: { id: USER_ID } }) as Partial<ProjectRequest>;

  it('пропускает участника с правом на действие и кладёт membership в запрос', async () => {
    const req = request();
    await expect(makeGuard(new FakeResolver(Role.EDITOR), ProjectAction.VIEW).canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.membership).toEqual({ projectId: PROJECT_ID, userId: USER_ID, role: Role.EDITOR });
  });

  it('читает id проекта и из параметра :projectId', async () => {
    const req = { params: { projectId: PROJECT_ID }, user: { id: USER_ID } } as unknown as ProjectRequest;
    await expect(makeGuard(new FakeResolver(Role.CLIENT), ProjectAction.VIEW).canActivate(makeContext(req))).resolves.toBe(true);
  });

  it('роли без права → ROLE_FORBIDDEN', async () => {
    const guard = makeGuard(new FakeResolver(Role.CLIENT), ProjectAction.MANAGE_PROJECT);
    await expect(guard.canActivate(makeContext(request()))).rejects.toMatchObject({
      code: ErrorCodes.ROLE_FORBIDDEN,
      value: { role: Role.CLIENT, action: ProjectAction.MANAGE_PROJECT },
    });
  });

  it('пробрасывает отказ resolver (не участник / нет проекта)', async () => {
    const denied = new AccessDeniedException('нет', PROJECT_ID, ErrorCodes.PROJECT_ACCESS_DENIED);
    await expect(makeGuard(new FakeResolver(denied), ProjectAction.VIEW).canActivate(makeContext(request()))).rejects.toBe(denied);
  });

  it('некорректный id → PROJECT_NOT_FOUND без обращения к БД', async () => {
    const resolver = new FakeResolver(Role.PRODUCER);
    const promise = makeGuard(resolver, ProjectAction.VIEW).canActivate(makeContext(request('not-a-uuid')));
    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toMatchObject({ code: ErrorCodes.PROJECT_NOT_FOUND });
    expect(resolver.calls).toBe(0);
  });

  it('без требуемого действия в метаданных доступ закрыт', async () => {
    await expect(makeGuard(new FakeResolver(Role.PRODUCER), undefined).canActivate(makeContext(request()))).rejects.toMatchObject({
      code: ErrorCodes.PROJECT_ACCESS_DENIED,
    });
  });
});
