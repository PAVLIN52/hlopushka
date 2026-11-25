import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Role } from '@hlopushka/shared';

import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

import { createTestApp, resetDatabase, signUp, TestUser } from './helpers/test-app';

describe('Проекты и доступ к ним (US2, FR-006, FR-007, FR-011)', () => {
  let app: INestApplication;
  let anya: TestUser;
  let borya: TestUser;

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
  });

  /** Создаёт проект от имени пользователя и возвращает его id. */
  const createProject = async (user: TestUser, body: Record<string, unknown> = { title: 'Клип' }): Promise<string> =>
    (await user.agent.post('/api/projects').send(body).expect(201)).body.id as string;

  /** Аня (продюсер) добавляет участника через API. */
  const addMember = async (projectId: string, user: TestUser, role: Role): Promise<void> => {
    await anya.agent.post(`/api/projects/${projectId}/members`).send({ email: user.email, role }).expect(201);
  };

  describe('без входа', () => {
    it.each([
      ['GET', '/api/projects'],
      ['POST', '/api/projects'],
      ['GET', '/api/projects/11111111-1111-4111-8111-111111111111'],
    ])('%s %s → 401 AUTH_REQUIRED', async (method, url) => {
      const res = await request(app.getHttpServer())[method === 'GET' ? 'get' : 'post'](url).expect(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('создание', () => {
    it('создатель становится продюсером, поля нормализуются', async () => {
      const res = await anya.agent
        .post('/api/projects')
        .send({ title: '  Клип для группы  ', description: 'Съёмка в студии', dueDate: '2026-12-31' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'Клип для группы',
        description: 'Съёмка в студии',
        dueDate: '2026-12-31',
        myRole: Role.PRODUCER,
      });
      const member = await app
        .get(PrismaService)
        .projectMember.findUnique({ where: { projectId_userId: { projectId: res.body.id, userId: anya.id } } });
      expect(member?.role).toBe(Role.PRODUCER);
    });

    it('необязательные поля можно не передавать', async () => {
      const res = await anya.agent.post('/api/projects').send({ title: 'Реклама' }).expect(201);
      expect(res.body).toMatchObject({ description: null, dueDate: null });
    });

    it.each([
      ['пустое название', { title: '   ' }, 'title'],
      ['название длиннее 200 символов', { title: 'я'.repeat(201) }, 'title'],
      ['несуществующая дата', { title: 'X', dueDate: '2026-02-30' }, 'dueDate'],
      ['дата со временем', { title: 'X', dueDate: '2026-12-31T10:00:00Z' }, 'dueDate'],
      ['лишнее поле', { title: 'X', ownerId: 'hack' }, 'ownerId'],
    ])('%s → 400 VALIDATION', async (_, body, field) => {
      const res = await anya.agent.post('/api/projects').send(body).expect(400);
      expect(res.body.code).toBe('VALIDATION');
      expect(res.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
    });
  });

  describe('список', () => {
    it('показывает только проекты, где пользователь участник, с его ролью', async () => {
      const clip = await createProject(anya, { title: 'Клип' });
      await createProject(anya, { title: 'Реклама' });
      await createProject(borya, { title: 'Фильм Бори' });
      await addMember(clip, borya, Role.EDITOR);

      const anyaList = (await anya.agent.get('/api/projects').expect(200)).body as Array<Record<string, unknown>>;
      const boryaList = (await borya.agent.get('/api/projects').expect(200)).body as Array<Record<string, unknown>>;

      expect(anyaList.map((p) => p.title).sort()).toEqual(['Клип', 'Реклама']);
      expect(boryaList.map((p) => p.title).sort()).toEqual(['Клип', 'Фильм Бори']);
      expect(boryaList.find((p) => p.title === 'Клип')).toMatchObject({ myRole: Role.EDITOR, membersCount: 2 });
      expect(anyaList.find((p) => p.title === 'Реклама')).toMatchObject({ myRole: Role.PRODUCER, membersCount: 1 });
    });

    it('новый пользователь видит пустой список', async () => {
      expect((await borya.agent.get('/api/projects').expect(200)).body).toEqual([]);
    });
  });

  describe('просмотр', () => {
    it('участник видит проект и свою роль', async () => {
      const id = await createProject(anya);
      await addMember(id, borya, Role.CLIENT);

      expect((await anya.agent.get(`/api/projects/${id}`).expect(200)).body.myRole).toBe(Role.PRODUCER);
      expect((await borya.agent.get(`/api/projects/${id}`).expect(200)).body.myRole).toBe(Role.CLIENT);
    });

    it('не участник получает 403 PROJECT_ACCESS_DENIED (сценарий US2-6)', async () => {
      const id = await createProject(anya);
      const res = await borya.agent.get(`/api/projects/${id}`).expect(403);
      expect(res.body.code).toBe('PROJECT_ACCESS_DENIED');
    });

    it.each([
      ['несуществующий проект', '11111111-1111-4111-8111-111111111111'],
      ['некорректный id', 'not-a-uuid'],
    ])('%s → 404 PROJECT_NOT_FOUND', async (_, id) => {
      const res = await anya.agent.get(`/api/projects/${id}`).expect(404);
      expect(res.body.code).toBe('PROJECT_NOT_FOUND');
    });
  });

  describe('изменение', () => {
    it('продюсер меняет название, очищает описание и задаёт дату', async () => {
      const id = await createProject(anya, { title: 'Клип', description: 'Черновик' });

      const res = await anya.agent
        .patch(`/api/projects/${id}`)
        .send({ title: 'Клип v2', description: null, dueDate: '2027-01-15' })
        .expect(200);

      expect(res.body).toMatchObject({ title: 'Клип v2', description: null, dueDate: '2027-01-15' });
      expect((await anya.agent.get(`/api/projects/${id}`).expect(200)).body.title).toBe('Клип v2');
    });

    it('пустое тело ничего не меняет', async () => {
      const id = await createProject(anya, { title: 'Клип', dueDate: '2026-12-31' });
      const res = await anya.agent.patch(`/api/projects/${id}`).send({}).expect(200);
      expect(res.body).toMatchObject({ title: 'Клип', dueDate: '2026-12-31' });
    });

    it('название нельзя очистить', async () => {
      const id = await createProject(anya);
      const res = await anya.agent.patch(`/api/projects/${id}`).send({ title: null }).expect(400);
      expect(res.body.code).toBe('VALIDATION');
    });

    it.each([Role.EDITOR, Role.COLORIST, Role.CLIENT])('роль %s получает 403 ROLE_FORBIDDEN', async (role) => {
      const id = await createProject(anya, { title: 'Клип' });
      await addMember(id, borya, role);

      const res = await borya.agent.patch(`/api/projects/${id}`).send({ title: 'Взлом' }).expect(403);
      expect(res.body).toMatchObject({ code: 'ROLE_FORBIDDEN', value: { role, action: 'MANAGE_PROJECT' } });
      expect((await anya.agent.get(`/api/projects/${id}`).expect(200)).body.title).toBe('Клип');
    });

    it('не участник получает 403 PROJECT_ACCESS_DENIED', async () => {
      const id = await createProject(anya);
      const res = await borya.agent.patch(`/api/projects/${id}`).send({ title: 'Взлом' }).expect(403);
      expect(res.body.code).toBe('PROJECT_ACCESS_DENIED');
    });
  });
});
