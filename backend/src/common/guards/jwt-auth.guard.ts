import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { ErrorCodes, UnauthorizedException } from '@/core/exceptions';

import { AuthenticatedRequest } from '@/common/decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { APP_CONFIG, AppConfig } from '@/config/app.config';

import { ACCESS_COOKIE, AccessPayload } from '@/modules/auth/token.types';

/**
 * Глобальная проверка сессии. Пропускает эндпоинты с `@Public()`, остальным нужен
 * действующий access-токен в cookie. Ошибка — только `UnauthorizedException`
 * с кодом `AUTH_REQUIRED` (принцип III), а не исключение NestJS.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (request.cookies as Record<string, string | undefined> | undefined)?.[ACCESS_COOKIE];
    if (!token) throw this.unauthorized();

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, { secret: this.config.jwtAccessSecret });
      if (payload.typ !== 'access') throw this.unauthorized();
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException('Требуется вход в систему', null, ErrorCodes.AUTH_REQUIRED);
  }
}
