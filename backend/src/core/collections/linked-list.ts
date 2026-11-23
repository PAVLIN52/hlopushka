import { CustomException, ErrorCodes } from '../exceptions';
import { assertCanAdvance } from '../iterators/iterator.errors';
import { IIterator } from '../iterators/iterator.interface';

import { ListNode } from './list-node';

/**
 * Обобщённый двусвязный список (принцип II конституции).
 *
 * Используется в `CommandHistory` для хранения истории команд undo/redo.
 */
export class LinkedList<T> implements Iterable<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private length = 0;

  /** Количество элементов. */
  public get size(): number {
    return this.length;
  }

  /** Первый узел или `null`. */
  public get first(): ListNode<T> | null {
    return this.head;
  }

  /** Последний узел или `null`. */
  public get last(): ListNode<T> | null {
    return this.tail;
  }

  /** Пуст ли список. */
  public isEmpty(): boolean {
    return this.length === 0;
  }

  /** Добавляет значение в конец и возвращает созданный узел. */
  public append(value: T): ListNode<T> {
    const node = new ListNode(value);
    if (this.tail) {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    } else {
      this.head = node;
      this.tail = node;
    }
    this.length += 1;
    return node;
  }

  /**
   * Удаляет первый элемент и возвращает его значение.
   * @throws CustomException `ITERATOR_EMPTY`, если список пуст
   */
  public removeFirst(): T {
    const node = this.head;
    if (!node) {
      throw new CustomException('Список пуст — удалять нечего', null, ErrorCodes.ITERATOR_EMPTY);
    }
    this.remove(node);
    return node.value;
  }

  /** Удаляет конкретный узел этого списка. */
  public remove(node: ListNode<T>): void {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = null;
    node.next = null;
    this.length -= 1;
  }

  /**
   * Удаляет все узлы после `node` (обрезка хвоста).
   * @param node узел-граница; `null` — очистить весь список
   * @returns сколько элементов удалено
   */
  public removeAfter(node: ListNode<T> | null): number {
    let removed = 0;
    let current = node ? node.next : this.head;
    while (current) {
      const next = current.next;
      current.prev = null;
      current.next = null;
      current = next;
      removed += 1;
    }
    if (node) {
      node.next = null;
      this.tail = node;
    } else {
      this.head = null;
      this.tail = null;
    }
    this.length -= removed;
    return removed;
  }

  /** Копия значений в виде массива (от головы к хвосту). */
  public toArray(): T[] {
    return [...this];
  }

  /** Итератор от головы к хвосту (принцип VI). */
  public iterator(): IIterator<T> {
    return new LinkedListIterator(this);
  }

  public [Symbol.iterator](): Iterator<T> {
    let current = this.head;
    return {
      next: (): IteratorResult<T> => {
        if (!current) return { done: true, value: undefined };
        const value = current.value;
        current = current.next;
        return { done: false, value };
      },
    };
  }
}

/** Итератор связного списка: прямой обход от головы к хвосту. */
class LinkedListIterator<T> implements IIterator<T> {
  private current: ListNode<T> | null;

  constructor(private readonly list: LinkedList<T>) {
    this.current = list.first;
  }

  public hasNext(): boolean {
    return this.current !== null;
  }

  public next(): T {
    assertCanAdvance(this.list.size, this.hasNext(), 'LinkedListIterator');
    const node = this.current as ListNode<T>;
    this.current = node.next;
    return node.value;
  }

  public reset(): void {
    this.current = this.list.first;
  }

  public *[Symbol.iterator](): Iterator<T> {
    while (this.hasNext()) yield this.next();
  }
}
