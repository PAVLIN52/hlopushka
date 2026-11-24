import { Injectable } from '@nestjs/common';
import { RefreshSession as SessionRow } from '@prisma/client';

import { IRepository } from '@/core/collections';
import { ErrorCodes, NotFoundException } from '@/core/exceptions';

import { PrismaService } from '@/infrastructure/prisma/prisma.service';

import { RefreshSession } from './entities/refresh-session.entity';

/** Данные новой сессии (data-model.md → `RefreshSession.tokenHash`, `RefreshSession.expiresAt`). */
export interface CreateSessionData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

/** Изменение сессии — только отзыв (`RefreshSession.revokedAt`). */
export interface UpdateSessionData {
  revokedAt: Date;
}

/** Хранилище refresh-сессий. */
@Injectable()
export class RefreshSessionsRepository
  implements IRepository<RefreshSession, CreateSessionData, UpdateSessionData>
{
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<RefreshSession | null> {
    const row = await this.prisma.refreshSession.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  public async create(data: CreateSessionData): Promise<RefreshSession> {
    return this.toEntity(await this.prisma.refreshSession.create({ data }));
  }

  public async update(id: string, data: UpdateSessionData): Promise<RefreshSession> {
    const row = await this.prisma.refreshSession.update({ where: { id }, data }).catch(() => null);
    if (!row) throw new NotFoundException('Сессия не найдена', id, ErrorCodes.AUTH_REQUIRED);
    return this.toEntity(row);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.refreshSession.delete({ where: { id } }).catch(() => undefined);
  }

  /** Отзывает все активные сессии пользователя (при подозрении на кражу токена). */
  public async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toEntity(row: SessionRow): RefreshSession {
    return new RefreshSession(row.id, row.userId, row.tokenHash, row.expiresAt, row.revokedAt);
  }
}
