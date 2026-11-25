import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

import { UpdateProjectDto as UpdateProjectContract } from '@hlopushka/shared';

import { DATE_ONLY } from './create-project.dto';

const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

/**
 * Тело изменения проекта. Поле не передано — не меняется; `null` очищает необязательное поле
 * (data-model.md → `Project.description`, `Project.dueDate`). Название очистить нельзя
 * (`Project.title` обязательно).
 */
export class UpdateProjectDto implements UpdateProjectContract {
  @ValidateIf((dto: UpdateProjectDto) => dto.title !== undefined)
  @Transform(trim)
  @IsString({ message: 'Название должно быть строкой' })
  @Length(1, 200, { message: 'Название должно содержать от 1 до 200 символов' })
  public title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Описание должно быть строкой' })
  public description?: string | null;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Дата сдачи должна быть в формате ГГГГ-ММ-ДД' })
  @IsDateString({ strict: true }, { message: 'Некорректная дата сдачи' })
  public dueDate?: string | null;
}
