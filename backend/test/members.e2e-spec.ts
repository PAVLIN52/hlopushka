import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Role, Stage, TaskType } from '@hlopushka/shared';

import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

import { createTestApp, resetDatabase, signUp, TestUser } from './helpers/test-app';

const MISSING_ID = '11111111-1111-4111-8111-111111111111';

describe('Участники проекта (US2, FR-008, FR-009, FR-010, FR-011)', () => {
  let app: INestApplication;
  let anya: TestUser;
  let borya: TestUser;
  let vika: TestUser;
  let projectId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    anya = await signUp(app, 'Anya');
    borya = await signUp(app, 'Borya');
    vika = await signUp(app, 'Vika');
    projectId = (await anya.agent.post('/api/projects').send({ title: 'Клип' }).expect(201)).body.id as string;
  });

  const membersUrl = (userId?: string): string => `/api/projects/${projectId}/members${userId ? `/${userId}` : ''}`;

  /** Аня (продюсер) добавляет участника и проверяет ответ 201. */
  const add = async (user: TestUser, role: Role): Promise<void> => {
    await anya.agent.post(membersUrl()).send({ email: user.email, role }).expect(201);
  };

  const roleOf = async (user: TestUser): Promise<Role | undefined> => {
    const members = (await anya.agent.get(membersUrl()).expect(200)).body as Array<{ user: { id: string }; role: Role }>;
    return members.find((m) => m.user.id === user.id)?.role;
  };

  describe('список', () => {
    it('создатель — единственный участник-продюсер', async () => {
      const res = await anya.agent.get(membersUrl()).expect(200);

      expect(res.body).toEqual([
        { user: { id: anya.id, name: 'Anya', email: anya.email }, role: Role.PRODUCER, joinedAt: expect.any(String) },
      ]);
    });

    it('любой участник, включая заказчика, видит состав в порядке добавления', async () => {
      await add(borya, Role.EDITOR);
      await add(vika, Role.CLIENT);

      const res = await vika.agent.get(membersUrl()).expect(200);

      expect(res.body.map((m: { user: { id: string }; role: Role }) => [m.user.id, m.role])).toEqual([
        [anya.id, Role.PRODUCER],
        [borya.id, Role.EDITOR],
        [vika.id, Role.CLIENT],
      ]);
    });

    it('не участник получает 403 PROJECT_ACCESS_DENIED', async () => {
      expect((await borya.agent.get(membersUrl()).expect(403)).body.code).toBe('PROJECT_ACCESS_DENIED');
    });
  });

  describe('добавление по email (сценарий quickstart №4)', () => {
    it('участник сразу видит проект со своей ролью', async () => {
      const res = await anya.agent
        .post(membersUrl())
        .send({ email: `  ${borya.email.toUpperCase()} `, role: Role.EDITOR })
        .expect(201);

      expect(res.body).toMatchObject({ user: { id: borya.id, email: borya.email }, role: Role.EDITOR });
      const list = (await borya.agent.get('/api/projects').expect(200)).body as Array<Record<string, unknown>>;
      expect(list).toEqual([expect.objectContaining({ id: projectId, myRole: Role.EDITOR, membersCount: 2 })]);
    });

    it('незарегистрированный email → 404 USER_NOT_FOUND с подсказкой', async () => {
      const res = await anya.agent.post(membersUrl()).send({ email: 'nobody@x.ru', role: Role.EDITOR }).expect(404);

      expect(res.body).toMatchObject({
        code: 'USER_NOT_FOUND',
        message: 'Пользователь не найден — попросите его сначала зарегистрироваться',
      });
    });

    it('повторное добавление → 400 MEMBER_ALREADY_EXISTS, роль не меняется', async () => {
      await add(borya, Role.EDITOR);

      const res = await anya.agent.post(membersUrl()).send({ email: borya.email, role: Role.CLIENT }).expect(400);

      expect(res.body.code).toBe('MEMBER_ALREADY_EXISTS');
      expect(await roleOf(borya)).toBe(Role.EDITOR);
    });

    it.each([
      ['некорректный email', { email: 'not-an-email', role: Role.EDITOR }, 'email'],
      ['неизвестная роль', { email: 'b@x.ru', role: 'DIRECTOR' }, 'role'],
      ['нет роли', { email: 'b@x.ru' }, 'role'],
    ])('%s → 400 VALIDATION', async (_, body, field) => {
      const res = await anya.agent.post(membersUrl()).send(body).expect(400);

      expect(res.body.code).toBe('VALIDATION');
      expect(res.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
    });
  });

  describe('смена роли', () => {
    it('продюсер меняет роль участника, изменение сразу действует', async () => {
      await add(borya, Role.EDITOR);

      const res = await anya.agent.patch(membersUrl(borya.id)).send({ role: Role.CLIENT }).expect(200);

      expect(res.body).toMatchObject({ user: { id: borya.id }, role: Role.CLIENT });
      expect((await borya.agent.get(`/api/projects/${projectId}`).expect(200)).body.myRole).toBe(Role.CLIENT);
    });

    it('единственный продюсер не может снять с себя роль → 400 LAST_PRODUCER (сценарий quickstart №5)', async () => {
      const res = await anya.agent.patch(membersUrl(anya.id)).send({ role: Role.EDITOR }).expect(400);

      expect(res.body.code).toBe('LAST_PRODUCER');
      expect(await roleOf(anya)).toBe(Role.PRODUCER);
    });

    it('при втором продюсере первый может сменить свою роль', async () => {
      await add(borya, Role.PRODUCER);

      await anya.agent.patch(membersUrl(anya.id)).send({ role: Role.EDITOR }).expect(200);

      expect(await roleOf(anya)).toBe(Role.EDITOR);
      // Теперь Аня не продюсер и управлять участниками больше не может.
      const res = await anya.agent.patch(membersUrl(borya.id)).send({ role: Role.EDITOR }).expect(403);
      expect(res.body.code).toBe('ROLE_FORBIDDEN');
    });

    it('два продюсера одновременно снимают друг с друга роль — один продюсер остаётся', async () => {
      await add(borya, Role.PRODUCER);

      const results = await Promise.all([
        anya.agent.patch(membersUrl(borya.id)).send({ role: Role.EDITOR }),
        borya.agent.patch(membersUrl(anya.id)).send({ role: Role.EDITOR }),
      ]);

      const producers = await app.get(PrismaService).projectMember.count({ where: { projectId, role: Role.PRODUCER } });
      expect(producers).toBe(1);
      // Второй запрос упирается в LAST_PRODUCER (или, если пришёл позже, уже в проверку роли).
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    });

    it.each([
      ['не участник проекта', () => vika.id, 404, 'MEMBER_NOT_FOUND'],
      ['несуществующий id', () => MISSING_ID, 404, 'MEMBER_NOT_FOUND'],
      ['некорректный id', () => 'not-a-uuid', 404, 'MEMBER_NOT_FOUND'],
    ])('%s → %i %s', async (_, userId, status, code) => {
      const res = await anya.agent.patch(membersUrl(userId())).send({ role: Role.EDITOR }).expect(status);
      expect(res.body.code).toBe(code);
    });

    it('некорректная роль → 400 VALIDATION', async () => {
      await add(borya, Role.EDITOR);
      const res = await anya.agent.patch(membersUrl(borya.id)).send({ role: 'OWNER' }).expect(400);
      expect(res.body.code).toBe('VALIDATION');
    });
  });

  describe('удаление', () => {
    it('участник теряет доступ, его задачи остаются без исполнителя (сценарий quickstart №16)', async () => {
      await add(borya, Role.EDITOR);
      const prisma = app.get(PrismaService);
      const task = await prisma.task.create({
        data: {
          projectId,
          title: 'Снять интервью',
          type: TaskType.SHOOTING,
          stage: Stage.PREPRODUCTION,
          rank: 'a0',
          assigneeId: borya.id,
          authorId: anya.id,
        },
      });

      await anya.agent.delete(membersUrl(borya.id)).expect(204);

      expect((await borya.agent.get(`/api/projects/${projectId}`).expect(403)).body.code).toBe('PROJECT_ACCESS_DENIED');
      expect((await borya.agent.get('/api/projects').expect(200)).body).toEqual([]);
      const after = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
      expect(after).toMatchObject({ assigneeId: null, version: task.version + 1 });
    });

    it('единственного продюсера удалить нельзя → 400 LAST_PRODUCER', async () => {
      const res = await anya.agent.delete(membersUrl(anya.id)).expect(400);

      expect(res.body.code).toBe('LAST_PRODUCER');
      expect(await roleOf(anya)).toBe(Role.PRODUCER);
    });

    it('продюсер может покинуть проект, если есть другой продюсер', async () => {
      await add(borya, Role.PRODUCER);

      await anya.agent.delete(membersUrl(anya.id)).expect(204);

      expect((await anya.agent.get('/api/projects').expect(200)).body).toEqual([]);
    });

    it('не участник проекта → 404 MEMBER_NOT_FOUND', async () => {
      expect((await anya.agent.delete(membersUrl(vika.id)).expect(404)).body.code).toBe('MEMBER_NOT_FOUND');
    });
  });

  describe('права (FR-011, сценарий US2-5)', () => {
    it.each([Role.EDITOR, Role.COLORIST, Role.CLIENT])('роль %s не может управлять участниками → 403 ROLE_FORBIDDEN', async (role) => {
      await add(borya, role);
      await add(vika, Role.EDITOR);

      const attempts = await Promise.all([
        borya.agent.post(membersUrl()).send({ email: 'someone@x.ru', role: Role.EDITOR }),
        borya.agent.patch(membersUrl(vika.id)).send({ role: Role.CLIENT }),
        borya.agent.delete(membersUrl(vika.id)),
      ]);

      for (const res of attempts) {
        expect(res.status).toBe(403);
        expect(res.body).toMatchObject({ code: 'ROLE_FORBIDDEN', value: { role, action: 'MANAGE_PROJECT' } });
      }
      expect(await roleOf(vika)).toBe(Role.EDITOR);
    });

    it('не участник не может добавлять → 403 PROJECT_ACCESS_DENIED', async () => {
      const res = await borya.agent.post(membersUrl()).send({ email: borya.email, role: Role.PRODUCER }).expect(403);
      expect(res.body.code).toBe('PROJECT_ACCESS_DENIED');
    });

    it('без входа → 401 AUTH_REQUIRED', async () => {
      const res = await request(app.getHttpServer()).get(membersUrl()).expect(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
    });

    it('несуществующий проект → 404 PROJECT_NOT_FOUND', async () => {
      const res = await anya.agent.get(`/api/projects/${MISSING_ID}/members`).expect(404);
      expect(res.body.code).toBe('PROJECT_NOT_FOUND');
    });
  });
});
