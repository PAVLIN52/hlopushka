import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AppLogger } from '@/core/patterns/singleton';

/**
 * Подключение к PostgreSQL через Prisma.
 *
 * Принцип IV (освобождение ресурсов): соединение открывается в `onModuleInit`
 * и гарантированно закрывается в `onModuleDestroy` при остановке приложения.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = AppLogger.getInstance();

  public async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Соединение с БД открыто', 'Prisma');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Соединение с БД закрыто', 'Prisma');
  }
}
