import 'reflect-metadata';

import { existsSync } from 'node:fs';

import { NestFactory } from '@nestjs/core';

import { AppLogger } from '@/core/patterns/singleton';

import { loadConfig } from '@/config/app.config';
import { configureHttpApp } from '@/config/http-app.config';
import { NestLoggerAdapter } from '@/infrastructure/logger/nest-logger.adapter';

import { AppModule } from './app.module';

/** Точка входа бэкенда «Хлопушки». */
async function bootstrap(): Promise<void> {
  // В режиме разработки подхватываем корневой .env (в Docker переменные задаёт compose).
  if (process.env.NODE_ENV !== 'production' && existsSync('../.env')) process.loadEnvFile('../.env');
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { logger: new NestLoggerAdapter() });

  configureHttpApp(app, config);

  await app.listen(config.port);
  AppLogger.getInstance().log(`Сервер слушает порт ${config.port}`, 'Bootstrap');
}

void bootstrap();
