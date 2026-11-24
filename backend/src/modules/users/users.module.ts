import { Module } from '@nestjs/common';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/** Пользователи. Своих HTTP-эндпоинтов нет — ими пользуются auth и projects. */
@Module({
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
