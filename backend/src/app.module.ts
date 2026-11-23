import { Module } from '@nestjs/common';

import { APP_CONFIG, loadConfig } from '@/config/app.config';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

/** Корневой модуль. Модули предметной области подключаются по мере реализации историй. */
@Module({
  imports: [PrismaModule],
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class AppModule {}
