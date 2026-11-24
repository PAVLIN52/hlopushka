import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { ErrorCodes, UnauthorizedException } from '@/core/exceptions';

/** Пользователь, которого `JwtAuthGuard` извлёк из access-токена. */
export interface AuthenticatedUser {
  id: string;
}

/** Запрос после `JwtAuthGuard`. */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/** Внедряет текущего пользователя в параметр обработчика: `@CurrentUser() user`. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) {
    throw new UnauthorizedException('Требуется вход в систему', null, ErrorCodes.AUTH_REQUIRED);
  }
  return request.user;
});
