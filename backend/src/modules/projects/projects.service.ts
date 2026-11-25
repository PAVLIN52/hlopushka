import { Injectable } from '@nestjs/common';

import { ProjectAction, Role } from '@hlopushka/shared';

import { AccessDeniedException, ErrorCodes, NotFoundException, ValidationException } from '@/core/exceptions';

import { IProjectAccessResolver, ProjectMembership } from '@/common/guards/project-access.interface';

import { UsersService } from '@/modules/users/users.service';

import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectPermissions } from './entities/project-permissions';
import { Project } from './entities/project.entity';
import { IMembersTransaction, MemberDetails, ProjectsRepository, ProjectSummary } from './projects.repository';

/**
 * Проекты и их участники: создание, список, просмотр, изменение, состав команды. Также отвечает guard'у на вопрос
 * «кто этот пользователь в проекте и что ему можно» (`IProjectAccessResolver`).
 */
@Injectable()
export class ProjectsService implements IProjectAccessResolver {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly users: UsersService,
  ) {}

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

  /** Участники проекта в порядке добавления. */
  public async listMembers(projectId: string): Promise<MemberDetails[]> {
    return this.projects.findMembers(projectId);
  }

  /**
   * Добавляет зарегистрированного пользователя по email с выбранной ролью (FR-008).
   * Роль уже существующего участника здесь не меняется — для этого есть `changeMemberRole`.
   *
   * @throws NotFoundException `USER_NOT_FOUND` — с таким email никто не зарегистрирован
   * @throws ValidationException `MEMBER_ALREADY_EXISTS`
   */
  public async addMember(projectId: string, dto: AddMemberDto): Promise<MemberDetails> {
    const user = await this.users.getByEmail(dto.email);
    if (await this.projects.findMember(projectId, user.id)) {
      throw new ValidationException('Пользователь уже участник проекта', { userId: user.id }, ErrorCodes.MEMBER_ALREADY_EXISTS);
    }
    return this.projects.addMember(projectId, user.id, dto.role);
  }

  /**
   * Меняет роль участника (FR-008, FR-009).
   *
   * @throws NotFoundException `MEMBER_NOT_FOUND`
   * @throws ValidationException `LAST_PRODUCER` — последний продюсер теряет роль (FR-010)
   */
  public async changeMemberRole(projectId: string, userId: string, role: Role): Promise<MemberDetails> {
    return this.projects.changeMembers(projectId, async (members) => {
      const member = await this.requireMember(members, userId);
      if (role !== Role.PRODUCER) member.ensureCanStopBeingProducer(await members.countProducers());
      return members.updateRole(userId, role);
    });
  }

  /**
   * Удаляет участника. Его задачи остаются в проекте без исполнителя.
   *
   * @throws NotFoundException `MEMBER_NOT_FOUND`
   * @throws ValidationException `LAST_PRODUCER` — удаляют последнего продюсера (FR-010)
   */
  public async removeMember(projectId: string, userId: string): Promise<void> {
    await this.projects.changeMembers(projectId, async (members) => {
      const member = await this.requireMember(members, userId);
      member.ensureCanStopBeingProducer(await members.countProducers());
      await members.removeMember(userId);
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

  private async requireMember(members: IMembersTransaction, userId: string): Promise<ProjectMember> {
    const member = await members.findMember(userId);
    if (!member) throw new NotFoundException('Участник не найден', userId, ErrorCodes.MEMBER_NOT_FOUND);
    return member;
  }
}
