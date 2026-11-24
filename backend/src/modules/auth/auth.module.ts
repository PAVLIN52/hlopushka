import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { UsersModule } from '@/modules/users/users.module';

import { AuthController } from './auth.controller';
import { RefreshSessionsRepository } from './auth.repository';
import { AuthService } from './auth.service';

/** Авторизация. Регистрирует `JwtAuthGuard` глобально: все эндпоинты закрыты, кроме `@Public()`. */
@Module({
  imports: [JwtModule.register({ global: true }), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, RefreshSessionsRepository, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
