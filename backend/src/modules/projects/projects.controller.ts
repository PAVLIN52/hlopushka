import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ProjectAction, ProjectDetailsDto, ProjectSummaryDto, Role } from '@hlopushka/shared';

import { AuthenticatedUser, CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentMembership, ProjectAccess } from '@/common/decorators/project-access.decorator';
import { ProjectMembership } from '@/common/guards/project-access.interface';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

/** HTTP-эндпоинты проектов (contracts/rest-api.md → Projects). */
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  public async list(@CurrentUser() user: AuthenticatedUser): Promise<ProjectSummaryDto[]> {
    const summaries = await this.projects.listForUser(user.id);
    return summaries.map((s) => ({ ...s.project.toDto(), myRole: s.myRole, membersCount: s.membersCount }));
  }

  @Post()
  public async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto): Promise<ProjectDetailsDto> {
    const project = await this.projects.create(user.id, dto);
    return { ...project.toDto(), myRole: Role.PRODUCER };
  }

  @Get(':id')
  @ProjectAccess(ProjectAction.VIEW)
  public async get(@Param('id') id: string, @CurrentMembership() membership: ProjectMembership): Promise<ProjectDetailsDto> {
    const project = await this.projects.getById(id);
    return { ...project.toDto(), myRole: membership.role };
  }

  @Patch(':id')
  @ProjectAccess(ProjectAction.MANAGE_PROJECT)
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentMembership() membership: ProjectMembership,
  ): Promise<ProjectDetailsDto> {
    const project = await this.projects.update(id, dto);
    return { ...project.toDto(), myRole: membership.role };
  }
}
