import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';

import { AuthResponse } from '@hlopushka/shared';

import { AuthenticatedUser, CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { APP_CONFIG, AppConfig } from '@/config/app.config';

import { AuthResult, AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ACCESS_COOKIE, ACCESS_TTL_SECONDS, REFRESH_COOKIE, REFRESH_TTL_SECONDS } from './token.types';

/** HTTP-эндпоинты авторизации (contracts/rest-api.md → Auth). */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Post('register')
  public async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.respond(await this.auth.register(dto), res);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.respond(await this.auth.login(dto), res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  public async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    try {
      return this.respond(await this.auth.refresh(this.readRefresh(req)), res);
    } catch (error) {
      this.clearCookies(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(this.readRefresh(req));
    this.clearCookies(res);
  }

  @Get('me')
  public async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponse> {
    return { user: (await this.auth.me(user.id)).toDto() };
  }

  private respond(result: AuthResult, res: Response): AuthResponse {
    res.cookie(ACCESS_COOKIE, result.tokens.accessToken, this.cookieOptions(ACCESS_TTL_SECONDS));
    res.cookie(REFRESH_COOKIE, result.tokens.refreshToken, this.cookieOptions(REFRESH_TTL_SECONDS));
    return { user: result.user.toDto() };
  }

  private clearCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions());
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  /** httpOnly — токены недоступны JavaScript страницы; `Secure` — только в production. */
  private cookieOptions(maxAgeSeconds?: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.isProduction,
      path: '/',
      ...(maxAgeSeconds ? { maxAge: maxAgeSeconds * 1000 } : {}),
    };
  }

  private readRefresh(req: Request): string | undefined {
    return (req.cookies as Record<string, string | undefined> | undefined)?.[REFRESH_COOKIE];
  }
}
