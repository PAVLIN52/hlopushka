import { Injectable } from '@nestjs/common';
import { Project as ProjectRow, ProjectMember as MemberRow } from '@prisma/client';

import { Role } from '@hlopushka/shared';

import { IRepository } from '@/core/collections';
import { ErrorCodes, NotFoundException } from '@/core/exceptions';

import { PrismaService } from '@/infrastructure/prisma/prisma.service';

import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectData, Project, UpdateProjectData } from './entities/project.entity';

/** Проект в списке пользователя: роль пользователя и число участников. */
export interface ProjectSummary {
  project: Project;
  myRole: Role;
  membersCount: number;
}

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
}
