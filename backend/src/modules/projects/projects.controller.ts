import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';

import { MemberDto, ProjectAction, ProjectDetailsDto, ProjectSummaryDto, Role } from '@hlopushka/shared';

import { ErrorCodes } from '@/core/exceptions';

import { AuthenticatedUser, CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentMembership, ProjectAccess } from '@/common/decorators/project-access.decorator';
import { ProjectMembership } from '@/common/guards/project-access.interface';
import { UuidPipe } from '@/common/pipes/uuid.pipe';

import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { MemberDetails } from './projects.repository';
import { ProjectsService } from './projects.service';

/** `:userId` в маршрутах участников: не UUID — значит, такого участника нет. */
const MEMBER_ID = new UuidPipe('Участник не найден', ErrorCodes.MEMBER_NOT_FOUND);

const toMemberDto = ({ member, user }: MemberDetails): MemberDto => member.toDto(user);

/** HTTP-эндпоинты проектов и участников (contracts/rest-api.md → Projects, Members). */
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

  @Get(':id/members')
  @ProjectAccess(ProjectAction.VIEW)
  public async listMembers(@Param('id') id: string): Promise<MemberDto[]> {
    return (await this.projects.listMembers(id)).map(toMemberDto);
  }

  @Post(':id/members')
  @ProjectAccess(ProjectAction.MANAGE_PROJECT)
  public async addMember(@Param('id') id: string, @Body() dto: AddMemberDto): Promise<MemberDto> {
    return toMemberDto(await this.projects.addMember(id, dto));
  }

  @Patch(':id/members/:userId')
  @ProjectAccess(ProjectAction.MANAGE_PROJECT)
  public async changeMemberRole(
    @Param('id') id: string,
    @Param('userId', MEMBER_ID) userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<MemberDto> {
    return toMemberDto(await this.projects.changeMemberRole(id, userId, dto.role));
  }

  @Delete(':id/members/:userId')
  @ProjectAccess(ProjectAction.MANAGE_PROJECT)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeMember(@Param('id') id: string, @Param('userId', MEMBER_ID) userId: string): Promise<void> {
    await this.projects.removeMember(id, userId);
  }
}
