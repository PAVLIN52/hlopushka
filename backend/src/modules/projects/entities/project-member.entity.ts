import { MemberDto, Role, UserDto } from '@hlopushka/shared';

import { ErrorCodes, ValidationException } from '@/core/exceptions';

/** Пользователь в карточке участника. */
export type MemberUser = Pick<UserDto, 'id' | 'name' | 'email'>;

/** Участие пользователя в проекте с ровно одной ролью (data-model.md → ProjectMember). */
export class ProjectMember {
  constructor(
    public readonly projectId: string,
    public readonly userId: string,
    public readonly role: Role,
    public readonly joinedAt: Date,
  ) {}

  /** Является ли участник продюсером. */
  public isProducer(): boolean {
    return this.role === Role.PRODUCER;
  }

  /**
   * Проверяет инвариант FR-010 «в проекте всегда есть продюсер» перед тем, как участник
   * перестанет быть продюсером (смена роли или удаление).
   *
   * @param producersCount сколько продюсеров в проекте сейчас, включая этого участника
   * @throws ValidationException `LAST_PRODUCER`, если он последний продюсер
   */
  public ensureCanStopBeingProducer(producersCount: number): void {
    if (this.isProducer() && producersCount <= 1) {
      throw new ValidationException(
        'В проекте должен остаться хотя бы один продюсер — сначала назначьте другого',
        { userId: this.userId },
        ErrorCodes.LAST_PRODUCER,
      );
    }
  }

  /** Представление для ответов API (`Member` из contracts/rest-api.md). */
  public toDto(user: MemberUser): MemberDto {
    return {
      user: { id: user.id, name: user.name, email: user.email },
      role: this.role,
      joinedAt: this.joinedAt.toISOString(),
    };
  }
}
