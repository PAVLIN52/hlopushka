import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppLogger } from '@/core/patterns/singleton';

import { CustomExceptionFilter } from '@/common/filters/custom-exception.filter';
import { createValidationPipe } from '@/common/pipes/validation.pipe';
import { loadConfig } from '@/config/app.config';
import { NestLoggerAdapter } from '@/infrastructure/logger/nest-logger.adapter';

import { AppModule } from './app.module';

/** Точка входа бэкенда «Хлопушки». */
async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { logger: new NestLoggerAdapter() });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: config.frontendOrigin, credentials: true });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter());
  // Принцип IV: при SIGTERM/SIGINT вызываются onModuleDestroy/onApplicationShutdown.
  app.enableShutdownHooks();

  await app.listen(config.port);
  AppLogger.getInstance().log(`Сервер слушает порт ${config.port}`, 'Bootstrap');
}

void bootstrap();
