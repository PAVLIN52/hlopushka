/** Уровень сообщения журнала. */
export type LogLevel = 'LOG' | 'WARN' | 'ERROR' | 'DEBUG';

/** Куда писать готовые строки журнала (по умолчанию — stdout/stderr). */
export type LogSink = (line: string, level: LogLevel) => void;

/**
 * Журнал приложения. Паттерн «Одиночка» (Singleton, принцип V конституции).
 *
 * Во всём приложении существует ровно один экземпляр: конструктор закрыт,
 * доступ — только через `AppLogger.getInstance()`. NestJS использует его через
 * адаптер `infrastructure/logger/nest-logger.adapter.ts`, поэтому ядро не зависит от NestJS.
 */
export class AppLogger {
  private static instance: AppLogger | null = null;

  private sink: LogSink | null = null;

  private constructor() {}

  /** Единственный экземпляр журнала (создаётся при первом обращении). */
  public static getInstance(): AppLogger {
    if (!AppLogger.instance) AppLogger.instance = new AppLogger();
    return AppLogger.instance;
  }

  /** Подменяет вывод (используется в тестах); `null` — вернуть стандартный. */
  public setSink(sink: LogSink | null): void {
    this.sink = sink;
  }

  /** Информационное сообщение. */
  public log(message: string, context?: string): void {
    this.write('LOG', message, context);
  }

  /** Предупреждение. */
  public warn(message: string, context?: string): void {
    this.write('WARN', message, context);
  }

  /** Ошибка; `trace` (стек) пишется отдельной строкой. */
  public error(message: string, context?: string, trace?: string): void {
    this.write('ERROR', message, context);
    if (trace) this.emit(trace, 'ERROR');
  }

  /** Отладочное сообщение. */
  public debug(message: string, context?: string): void {
    this.write('DEBUG', message, context);
  }

  private write(level: LogLevel, message: string, context?: string): void {
    const prefix = context ? `[${context}] ` : '';
    this.emit(`${new Date().toISOString()} ${level.padEnd(5)} ${prefix}${message}`, level);
  }

  private emit(line: string, level: LogLevel): void {
    if (this.sink) {
      this.sink(line, level);
      return;
    }
    if (level === 'ERROR' || level === 'WARN') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  }
}
