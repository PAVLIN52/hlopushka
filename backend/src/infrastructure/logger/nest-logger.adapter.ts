import { LoggerService } from '@nestjs/common';

import { AppLogger } from '@/core/patterns/singleton';

/**
 * Адаптер: подключает Singleton-журнал ядра к NestJS (`app.useLogger(...)`).
 * Ядро про NestJS не знает — зависимость направлена только сюда (принцип I).
 */
export class NestLoggerAdapter implements LoggerService {
  private readonly logger = AppLogger.getInstance();

  public log(message: unknown, context?: string): void {
    this.logger.log(String(message), context);
  }

  public warn(message: unknown, context?: string): void {
    this.logger.warn(String(message), context);
  }

  public error(message: unknown, trace?: string, context?: string): void {
    this.logger.error(String(message), context, trace);
  }

  public debug(message: unknown, context?: string): void {
    this.logger.debug(String(message), context);
  }

  public verbose(message: unknown, context?: string): void {
    this.logger.debug(String(message), context);
  }
}
