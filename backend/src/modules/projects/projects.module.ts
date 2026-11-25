import { Module } from '@nestjs/common';

import { PROJECT_ACCESS_RESOLVER } from '@/common/guards/project-access.interface';

import { UsersModule } from '@/modules/users/users.module';

import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

/**
 * Проекты и участники. Экспортирует `PROJECT_ACCESS_RESOLVER`, чтобы `@ProjectAccess`
 * работал и в модулях доски и задач.
 */
@Module({
  imports: [UsersModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsRepository,
    ProjectsService,
    { provide: PROJECT_ACCESS_RESOLVER, useExisting: ProjectsService },
  ],
  exports: [ProjectsService, PROJECT_ACCESS_RESOLVER],
})
export class ProjectsModule {}
