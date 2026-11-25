import type { Role } from '../enums';

import type { UserDto } from './auth';

/** Тело `POST /projects`. Дата сдачи — в формате `YYYY-MM-DD`. */
export interface CreateProjectDto {
  title: string;
  description?: string;
  dueDate?: string;
}

/** Тело `PATCH /projects/:id`. `null` очищает необязательное поле. */
export interface UpdateProjectDto {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
}

/** Проект в ответах API. */
export interface ProjectDto {
  id: string;
  title: string;
  description: string | null;
  /** Дата сдачи `YYYY-MM-DD` или `null`. */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Проект с ролью текущего пользователя (`GET /projects/:id`). */
export interface ProjectDetailsDto extends ProjectDto {
  myRole: Role;
}

/** Элемент списка `GET /projects`. */
export interface ProjectSummaryDto extends ProjectDetailsDto {
  membersCount: number;
}

/** Участник проекта. */
export interface MemberDto {
  user: Pick<UserDto, 'id' | 'name' | 'email'>;
  role: Role;
  joinedAt: string;
}

/** Тело `POST /projects/:id/members`. */
export interface AddMemberDto {
  email: string;
  role: Role;
}

/** Тело `PATCH /projects/:id/members/:userId`. */
export interface UpdateMemberRoleDto {
  role: Role;
}
