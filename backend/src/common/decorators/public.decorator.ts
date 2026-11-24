import { SetMetadata } from '@nestjs/common';

/** Ключ метаданных «эндпоинт доступен без входа». */
export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает эндпоинт как публичный: `JwtAuthGuard` его пропускает. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
