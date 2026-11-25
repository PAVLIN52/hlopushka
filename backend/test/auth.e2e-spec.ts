import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp, resetDatabase } from './helpers/test-app';

describe('Регистрация и вход (US1, FR-001…FR-005)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  const register = (agent: ReturnType<typeof request.agent>, body: Record<string, unknown>) =>
    agent.post('/api/auth/register').send(body);

  it('регистрация входит в систему, email приводится к нижнему регистру', async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await register(agent, { name: 'Аня', email: '  ANYA@Example.TEST ', password: 'secret123' }).expect(201);

    expect(res.body.user).toMatchObject({ name: 'Аня', email: 'anya@example.test' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^access_token=.*HttpOnly/), expect.stringMatching(/^refresh_token=.*HttpOnly/)]),
    );
    expect((await agent.get('/api/auth/me').expect(200)).body.user.email).toBe('anya@example.test');
  });

  it('занятый email → 400 AUTH_EMAIL_TAKEN', async () => {
    await register(request.agent(app.getHttpServer()), { name: 'A', email: 'a@e.test', password: 'secret123' }).expect(201);
    const res = await register(request.agent(app.getHttpServer()), { name: 'B', email: 'A@E.test', password: 'secret123' }).expect(400);
    expect(res.body.code).toBe('AUTH_EMAIL_TAKEN');
  });

  it.each(['short1', 'onlyletters', '12345678'])('слабый пароль «%s» → 400 AUTH_WEAK_PASSWORD', async (password) => {
    const res = await register(request.agent(app.getHttpServer()), { name: 'A', email: 'a@e.test', password }).expect(400);
    expect(res.body.code).toBe('AUTH_WEAK_PASSWORD');
  });

  it('неверный пароль и неизвестный email дают одинаковый ответ (FR-004)', async () => {
    await register(request.agent(app.getHttpServer()), { name: 'A', email: 'a@e.test', password: 'secret123' }).expect(201);
    const wrongPassword = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'a@e.test', password: 'wrong1234' }).expect(403);
    const unknownEmail = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'x@e.test', password: 'wrong1234' }).expect(403);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('refresh-токен одноразовый: повторное использование отзывает все сессии', async () => {
    const agent = request.agent(app.getHttpServer());
    const reg = await register(agent, { name: 'A', email: 'a@e.test', password: 'secret123' }).expect(201);
    const oldCookies = reg.headers['set-cookie'] as unknown as string[];

    await agent.post('/api/auth/refresh').expect(200);
    await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', oldCookies).expect(401);
    await agent.post('/api/auth/refresh').expect(401);
  });

  it('после выхода сессия недействительна', async () => {
    const agent = request.agent(app.getHttpServer());
    const reg = await register(agent, { name: 'A', email: 'a@e.test', password: 'secret123' }).expect(201);
    const cookies = reg.headers['set-cookie'] as unknown as string[];

    await agent.post('/api/auth/logout').expect(204);
    await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookies).expect(401);
    const me = await agent.get('/api/auth/me').expect(401);
    expect(me.body.code).toBe('AUTH_REQUIRED');
  });
});
