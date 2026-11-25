import { ProjectDto } from '@hlopushka/shared';

/** Данные для создания проекта; `producerId` — создатель, он становится продюсером. */
export interface CreateProjectData {
  title: string;
  description: string | null;
  dueDate: Date | null;
  producerId: string;
}

/** Изменяемые поля проекта (`undefined` — не менять, `null` — очистить). */
export interface UpdateProjectData {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
}

/** Проект видеопродакшна (data-model.md → Project). */
export class Project {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly dueDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /** Дата без времени в формате `YYYY-MM-DD` (в БД хранится как `date`). */
  public static formatDate(date: Date | null): string | null {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  /** Разбирает `YYYY-MM-DD` в дату (полночь UTC). */
  public static parseDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined || value === null) return value;
    return new Date(`${value}T00:00:00.000Z`);
  }

  /** Представление для ответов API. */
  public toDto(): ProjectDto {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      dueDate: Project.formatDate(this.dueDate),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
