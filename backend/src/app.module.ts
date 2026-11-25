import { Module } from '@nestjs/common';

import { ConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

import { AuthModule } from '@/modules/auth/auth.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { UsersModule } from '@/modules/users/users.module';

/** Корневой модуль. Модули предметной области подключаются по мере реализации историй. */
@Module({
  imports: [ConfigModule, PrismaModule, UsersModule, AuthModule, ProjectsModule],
})
export class AppModule {}
