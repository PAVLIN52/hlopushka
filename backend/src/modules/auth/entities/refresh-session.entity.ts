/**
 * Сессия обновления токенов (data-model.md → RefreshSession).
 * В БД хранится только хеш refresh-токена, сам токен живёт в httpOnly-cookie.
 */
export class RefreshSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
  ) {}

  /** Сессия действует: не отозвана и не истекла. */
  public isActive(now: Date = new Date()): boolean {
    return this.revokedAt === null && this.expiresAt > now;
  }
}
