/**
 * Обобщённый репозиторий (принцип II конституции — дженерики вместо шаблонов C++).
 *
 * Реализуется репозиториями модулей: `UsersRepository implements IRepository<User, ...>`
 * и т.д. Сервисы работают с данными только через этот интерфейс.
 *
 * @typeParam T доменная сущность
 * @typeParam TCreate данные для создания
 * @typeParam TUpdate данные для изменения
 */
export interface IRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  /** Найти по идентификатору; `null`, если нет. */
  findById(id: string): Promise<T | null>;

  /** Создать сущность. */
  create(data: TCreate): Promise<T>;

  /** Изменить сущность; бросает `NotFoundException`, если её нет. */
  update(id: string, data: TUpdate): Promise<T>;

  /** Удалить сущность; бросает `NotFoundException`, если её нет. */
  delete(id: string): Promise<void>;
}
