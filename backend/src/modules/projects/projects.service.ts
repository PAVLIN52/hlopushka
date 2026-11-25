import { Injectable } from '@nestjs/common';

import { ProjectAction, Role } from '@hlopushka/shared';

import { AccessDeniedException, ErrorCodes, NotFoundException } from '@/core/exceptions';

import { IProjectAccessResolver, ProjectMembership } from '@/common/guards/project-access.interface';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectPermissions } from './entities/project-permissions';
import { Project } from './entities/project.entity';
import { ProjectsRepository, ProjectSummary } from './projects.repository';

/**
 * Проекты: создание, список, просмотр, изменение. Также отвечает guard'у на вопрос
 * «кто этот пользователь в проекте и что ему можно» (`IProjectAccessResolver`).
 */
@Injectable()
export class ProjectsService implements IProjectAccessResolver {
  constructor(private readonly projects: ProjectsRepository) {}

  /** Создаёт проект; создатель становится продюсером (FR-006). */
  public async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    return this.projects.create({
      title: dto.title,
      description: dto.description || null,
      dueDate: Project.parseDate(dto.dueDate) ?? null,
      producerId: userId,
    });
  }

  /** Только проекты, где пользователь участник (FR-007). */
  public async listForUser(userId: string): Promise<ProjectSummary[]> {
    return this.projects.findSummariesForUser(userId);
  }

  /** @throws NotFoundException `PROJECT_NOT_FOUND` */
  public async getById(projectId: string): Promise<Project> {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundException('Проект не найден', projectId, ErrorCodes.PROJECT_NOT_FOUND);
    return project;
  }

  /** Изменяет поля проекта; пустое описание сохраняется как отсутствующее. */
  public async update(projectId: string, dto: UpdateProjectDto): Promise<Project> {
    return this.projects.update(projectId, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: Project.parseDate(dto.dueDate) ?? null } : {}),
    });
  }

  public async resolveMembership(projectId: string, userId: string): Promise<ProjectMembership> {
    const member = await this.projects.findMember(projectId, userId);
    if (member) return { projectId, userId, role: member.role };

    await this.getById(projectId); // проекта нет → 404, иначе пользователь просто не участник
    throw new AccessDeniedException('Вы не участник этого проекта', projectId, ErrorCodes.PROJECT_ACCESS_DENIED);
  }

  public can(role: Role, action: ProjectAction): boolean {
    return ProjectPermissions.can(role, action);
  }
}
