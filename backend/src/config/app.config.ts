import { ErrorCodes, ValidationException } from '@/core/exceptions';

/** Проверенная конфигурация приложения. */
export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  frontendOrigin: string;
  isProduction: boolean;
}

const MIN_SECRET_LENGTH = 32;

/**
 * Читает и проверяет переменные окружения. Без обязательных значений
 * приложение не стартует — ошибка видна сразу, а не при первом запросе.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const required = (name: string): string => {
    const value = env[name];
    if (!value) {
      throw new ValidationException(`Не задана переменная окружения ${name}`, name, ErrorCodes.VALIDATION);
    }
    return value;
  };
  const secret = (name: string): string => {
    const value = required(name);
    if (value.length < MIN_SECRET_LENGTH) {
      throw new ValidationException(
        `${name} должен быть не короче ${MIN_SECRET_LENGTH} символов`,
        name,
        ErrorCodes.VALIDATION,
      );
    }
    return value;
  };

  return {
    port: Number(env.PORT ?? 4000),
    databaseUrl: required('DATABASE_URL'),
    jwtAccessSecret: secret('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: secret('JWT_REFRESH_SECRET'),
    frontendOrigin: env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    isProduction: env.NODE_ENV === 'production',
  };
}

/** Токен для внедрения конфигурации через DI NestJS. */
export const APP_CONFIG = Symbol('APP_CONFIG');
