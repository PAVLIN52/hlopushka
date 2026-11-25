import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';

import { CreateProjectDto as CreateProjectContract } from '@hlopushka/shared';

const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

/** Формат даты сдачи: только дата, без времени. */
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Тело создания проекта (data-model.md → `Project.title`, `Project.description`, `Project.dueDate`). */
export class CreateProjectDto implements CreateProjectContract {
  @Transform(trim)
  @IsString({ message: 'Название должно быть строкой' })
  @Length(1, 200, { message: 'Название должно содержать от 1 до 200 символов' })
  public title: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Описание должно быть строкой' })
  public description?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Дата сдачи должна быть в формате ГГГГ-ММ-ДД' })
  @IsDateString({ strict: true }, { message: 'Некорректная дата сдачи' })
  public dueDate?: string;
}
