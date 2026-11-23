import { AppLogger } from './app.logger';

describe('AppLogger (Singleton)', () => {
  it('getInstance всегда возвращает один и тот же объект', () => {
    expect(AppLogger.getInstance()).toBe(AppLogger.getInstance());
  });

  it('пишет сообщения с уровнем и контекстом через переданный вывод', () => {
    const lines: string[] = [];
    const logger = AppLogger.getInstance();
    logger.setSink((line) => lines.push(line));

    logger.log('сервер запущен', 'Bootstrap');
    logger.warn('медленный запрос', 'Prisma');
    logger.error('сбой', 'Filter', 'stack-trace');

    expect(lines[0]).toMatch(/LOG.*\[Bootstrap\] сервер запущен/);
    expect(lines[1]).toMatch(/WARN.*\[Prisma\] медленный запрос/);
    expect(lines[2]).toMatch(/ERROR.*\[Filter\] сбой/);
    expect(lines[3]).toBe('stack-trace');
    logger.setSink(null);
  });

  it('конструктор закрыт: в TypeScript `new AppLogger()` — ошибка компиляции', () => {
    // @ts-expect-error — приватный конструктор (суть паттерна Singleton)
    const create = (): AppLogger => new AppLogger();
    expect(typeof create).toBe('function');
  });
});
