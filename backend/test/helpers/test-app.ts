import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { loadConfig } from '../../src/config/app.config';
import { configureHttpApp } from '../../src/config/http-app.config';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';

/** Приложение для e2e-тестов — с той же настройкой, что и в `main.ts`. */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureHttpApp(app, loadConfig());
  await app.init();
  return app;
}

/** Очищает все таблицы между тестами. */
export async function resetDatabase(app: INestApplication): Promise<void> {
  await app
    .get(PrismaService)
    .$executeRawUnsafe('TRUNCATE "Task", "ProjectMember", "Project", "RefreshSession", "User" CASCADE');
}

/** Зарегистрированный пользователь с «браузером», который хранит его cookie. */
export interface TestUser {
  id: string;
  name: string;
  email: string;
  agent: ReturnType<typeof request.agent>;
}

let counter = 0;

/** Регистрирует пользователя и возвращает агент с его сессией. */
export async function signUp(app: INestApplication, name: string): Promise<TestUser> {
  counter += 1;
  const email = `${name.toLowerCase()}-${counter}@e2e.test`;
  const agent = request.agent(app.getHttpServer());
  const response = await agent
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' })
    .expect(201);
  return { id: response.body.user.id as string, name, email, agent };
}
