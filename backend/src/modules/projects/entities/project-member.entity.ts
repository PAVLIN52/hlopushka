import { Role } from '@hlopushka/shared';

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
}
