import { Injectable } from '@nestjs/common';
import { Prisma, Project as ProjectRow, ProjectMember as MemberRow, User as UserRow } from '@prisma/client';

import { Role } from '@hlopushka/shared';

import { IRepository } from '@/core/collections';
import { ErrorCodes, NotFoundException, ValidationException } from '@/core/exceptions';

import { PrismaService } from '@/infrastructure/prisma/prisma.service';

import { MemberUser, ProjectMember } from './entities/project-member.entity';
import { CreateProjectData, Project, UpdateProjectData } from './entities/project.entity';

/** Проект в списке пользователя: роль пользователя и число участников. */
export interface ProjectSummary {
  project: Project;
  myRole: Role;
  membersCount: number;
}

/** Участник вместе с данными пользователя — для списка и ответов API. */
export interface MemberDetails {
  member: ProjectMember;
  user: MemberUser;
}

/**
 * Операции с участниками одного проекта внутри транзакции `changeMembers`. Пока она идёт,
 * другие изменения состава этого проекта ждут, поэтому проверка «последнего продюсера»
 * не ломается при одновременных запросах.
 */
export interface IMembersTransaction {
  findMember(userId: string): Promise<ProjectMember | null>;
  countProducers(): Promise<number>;
  updateRole(userId: string, role: Role): Promise<MemberDetails>;
  /** Удаляет участника и снимает его с задач проекта (поле исполнителя → null). */
  removeMember(userId: string): Promise<void>;
}

const WITH_USER = { user: { select: { id: true, name: true, email: true } } } as const;

/** Доступ к проектам и участникам в БД (реализует обобщённый `IRepository<T>`, принцип II). */
@Injectable()
export class ProjectsRepository implements IRepository<Project, CreateProjectData, UpdateProjectData> {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({ where: { id } });
    return row ? this.toProject(row) : null;
  }

  /** Создаёт проект и в той же транзакции делает создателя продюсером (FR-006). */
  public async create(data: CreateProjectData): Promise<Project> {
    const row = await this.prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        members: { create: { userId: data.producerId, role: Role.PRODUCER } },
      },
    });
    return this.toProject(row);
  }

  public async update(id: string, data: UpdateProjectData): Promise<Project> {
    await this.ensureExists(id);
    return this.toProject(await this.prisma.project.update({ where: { id }, data }));
  }

  public async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.project.delete({ where: { id } });
  }

  /** Проекты, где пользователь участник (FR-007), — сначала недавно изменённые. */
  public async findSummariesForUser(userId: string): Promise<ProjectSummary[]> {
    const rows = await this.prisma.projectMember.findMany({
      where: { userId },
      include: { project: { include: { _count: { select: { members: true } } } } },
      orderBy: { project: { updatedAt: 'desc' } },
    });
    return rows.map((row) => ({
      project: this.toProject(row.project),
      myRole: row.role as Role,
      membersCount: row.project._count.members,
    }));
  }

  /** Участие пользователя в проекте или `null`. */
  public async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return row ? this.toMember(row) : null;
  }

  /** Участники проекта в порядке добавления. */
  public async findMembers(projectId: string): Promise<MemberDetails[]> {
    const rows = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: WITH_USER,
      orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }],
    });
    return rows.map((row) => this.toMemberDetails(row));
  }

  /** @throws ValidationException `MEMBER_ALREADY_EXISTS`, если пара (проект, пользователь) уже есть */
  public async addMember(projectId: string, userId: string, role: Role): Promise<MemberDetails> {
    try {
      const row = await this.prisma.projectMember.create({ data: { projectId, userId, role }, include: WITH_USER });
      return this.toMemberDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ValidationException('Пользователь уже участник проекта', { userId }, ErrorCodes.MEMBER_ALREADY_EXISTS);
      }
      throw error;
    }
  }

  /**
   * Выполняет `work` в транзакции, заблокировав строку проекта (`SELECT … FOR UPDATE`):
   * изменения состава одного проекта идут строго по очереди. Исключение из `work`
   * откатывает транзакцию.
   */
  public async changeMembers<T>(projectId: string, work: (members: IMembersTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId}::uuid FOR UPDATE`;
      const where = (userId: string) => ({ projectId_userId: { projectId, userId } });

      return work({
        findMember: async (userId) => {
          const row = await tx.projectMember.findUnique({ where: where(userId) });
          return row ? this.toMember(row) : null;
        },
        countProducers: () => tx.projectMember.count({ where: { projectId, role: Role.PRODUCER } }),
        updateRole: async (userId, role) =>
          this.toMemberDetails(await tx.projectMember.update({ where: where(userId), data: { role }, include: WITH_USER })),
        removeMember: async (userId) => {
          await tx.task.updateMany({
            where: { projectId, assigneeId: userId },
            data: { assigneeId: null, version: { increment: 1 } },
          });
          await tx.projectMember.delete({ where: where(userId) });
        },
      });
    });
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.prisma.project.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Проект не найден', id, ErrorCodes.PROJECT_NOT_FOUND);
    }
  }

  private toProject(row: ProjectRow): Project {
    return new Project(row.id, row.title, row.description, row.dueDate, row.createdAt, row.updatedAt);
  }

  private toMember(row: MemberRow): ProjectMember {
    return new ProjectMember(row.projectId, row.userId, row.role as Role, row.joinedAt);
  }

  private toMemberDetails(row: MemberRow & { user: Pick<UserRow, 'id' | 'name' | 'email'> }): MemberDetails {
    return { member: this.toMember(row), user: row.user };
  }
}
