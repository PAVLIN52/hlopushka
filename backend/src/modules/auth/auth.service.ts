import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { AccessDeniedException, ErrorCodes, UnauthorizedException, ValidationException } from '@/core/exceptions';

import { APP_CONFIG, AppConfig } from '@/config/app.config';

import { User } from '@/modules/users/entities/user.entity';
import { UsersRepository } from '@/modules/users/users.repository';
import { UsersService } from '@/modules/users/users.service';

import { RefreshSessionsRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ACCESS_TTL_SECONDS,
  AccessPayload,
  REFRESH_TTL_SECONDS,
  RefreshPayload,
  TokenPair,
} from './token.types';

/** Правило пароля FR-003: не короче 8 символов, хотя бы одна буква и одна цифра. */
const PASSWORD_RULE = /^(?=.*\p{L})(?=.*\d).{8,}$/u;

/** Результат регистрации, входа или обновления сессии. */
export interface AuthResult {
  user: User;
  tokens: TokenPair;
}

/**
 * Регистрация, вход, обновление и завершение сессии (research.md R2).
 *
 * - пароль хешируется argon2id;
 * - access-токен живёт 15 минут, refresh-токен — 7 дней;
 * - refresh-токен одноразовый: при обновлении старая сессия отзывается и выдаётся новая;
 * - повторное использование отозванного токена считается кражей: отзываются все сессии.
 */
@Injectable()
export class AuthService {
  /** Хеш-«пустышка»: проверяется, когда email не найден, чтобы время ответа не выдавало это. */
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly users: UsersRepository,
    private readonly usersService: UsersService,
    private readonly sessions: RefreshSessionsRepository,
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * @throws ValidationException `AUTH_WEAK_PASSWORD`, `AUTH_EMAIL_TAKEN`
   */
  public async register(dto: RegisterDto): Promise<AuthResult> {
    if (!PASSWORD_RULE.test(dto.password)) {
      throw new ValidationException(
        'Пароль должен быть не короче 8 символов и содержать букву и цифру',
        null,
        ErrorCodes.AUTH_WEAK_PASSWORD,
      );
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.users.create({ name: dto.name, email: dto.email, passwordHash });
    return { user, tokens: await this.issueTokens(user.id) };
  }

  /**
   * @throws AccessDeniedException `AUTH_INVALID_CREDENTIALS` — без уточнения, что именно неверно (FR-004)
   */
  public async login(dto: LoginDto): Promise<AuthResult> {
    const credentials = await this.users.findCredentialsByEmail(dto.email);
    const hash = credentials?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, dto.password).catch(() => false);
    if (!credentials || !valid) {
      throw new AccessDeniedException('Неверный email или пароль', null, ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }
    return { user: credentials.user, tokens: await this.issueTokens(credentials.user.id) };
  }

  /**
   * Обменивает refresh-токен на новую пару токенов (ротация).
   * @throws UnauthorizedException `AUTH_REQUIRED`
   */
  public async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    const payload = await this.verifyRefresh(refreshToken);
    const session = await this.sessions.findById(payload.sid);
    if (!session || session.userId !== payload.sub) throw this.unauthorized();

    if (!session.isActive() || !this.sameHash(session.tokenHash, this.hashToken(refreshToken as string))) {
      // Отозванный токен предъявлен повторно — вероятно, он украден.
      if (session.revokedAt) await this.sessions.revokeAllForUser(session.userId);
      throw this.unauthorized();
    }

    await this.sessions.update(session.id, { revokedAt: new Date() });
    const user = await this.usersService.getById(session.userId).catch(() => {
      throw this.unauthorized();
    });
    return { user, tokens: await this.issueTokens(user.id) };
  }

  /** Отзывает сессию, к которой относится refresh-токен. Ошибки игнорируются. */
  public async logout(refreshToken: string | undefined): Promise<void> {
    const payload = await this.verifyRefresh(refreshToken).catch(() => null);
    if (payload) await this.sessions.update(payload.sid, { revokedAt: new Date() }).catch(() => undefined);
  }

  /** @throws UnauthorizedException `AUTH_REQUIRED`, если пользователь удалён */
  public async me(userId: string): Promise<User> {
    return this.usersService.getById(userId).catch(() => {
      throw this.unauthorized();
    });
  }

  private async issueTokens(userId: string): Promise<TokenPair> {
    const sid = randomUUID();
    const refreshPayload: RefreshPayload = { sub: userId, sid, typ: 'refresh' };
    const accessPayload: AccessPayload = { sub: userId, typ: 'access' };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: REFRESH_TTL_SECONDS,
    });
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: ACCESS_TTL_SECONDS,
    });
    await this.sessions.create({
      id: sid,
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    });
    return { accessToken, refreshToken };
  }

  private async verifyRefresh(token: string | undefined): Promise<RefreshPayload> {
    if (!token) throw this.unauthorized();
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, { secret: this.config.jwtRefreshSecret });
      if (payload.typ !== 'refresh') throw this.unauthorized();
      return payload;
    } catch {
      throw this.unauthorized();
    }
  }

  /** Refresh-токен случайный и длинный, поэтому достаточно быстрого SHA-256. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sameHash(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash(randomUUID(), { type: argon2.argon2id });
    return this.dummyHash;
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException('Сессия истекла — войдите снова', null, ErrorCodes.AUTH_REQUIRED);
  }
}
