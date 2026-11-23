import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Глобальный модуль доступа к БД: `PrismaService` доступен всем модулям. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
