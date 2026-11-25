import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { CustomExceptionFilter } from '@/common/filters/custom-exception.filter';
import { createValidationPipe } from '@/common/pipes/validation.pipe';

import { AppConfig } from './app.config';

/**
 * Общая настройка HTTP-приложения: одинаковая для `main.ts` и e2e-тестов,
 * чтобы тесты проверяли ровно то, что работает в бою.
 */
export function configureHttpApp(app: INestApplication, config: AppConfig): void {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: config.frontendOrigin, credentials: true });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter());
  // Принцип IV: при SIGTERM/SIGINT вызываются onModuleDestroy/onApplicationShutdown.
  app.enableShutdownHooks();
}
