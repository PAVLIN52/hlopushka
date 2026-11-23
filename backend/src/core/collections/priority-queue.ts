import { ErrorCodes, ValidationException } from '../exceptions';

/**
 * Функция сравнения: отрицательное число — `a` важнее (выйдет раньше), положительное — `b`.
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Обобщённая очередь с приоритетом на бинарной куче (принцип II конституции).
 *
 * Используется в `DeadlineIterator` для обхода задач от самой просроченной.
 * Вставка и извлечение — O(log n), просмотр минимума — O(1).
 */
export class PriorityQueue<T> {
  private readonly heap: T[] = [];

  /**
   * @param compare правило приоритета
   * @param items начальные элементы
   */
  constructor(
    private readonly compare: Comparator<T>,
    items: Iterable<T> = [],
  ) {
    for (const item of items) this.enqueue(item);
  }

  /** Количество элементов. */
  public get size(): number {
    return this.heap.length;
  }

  /** Пуста ли очередь. */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /** Добавляет элемент. */
  public enqueue(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  /**
   * Извлекает самый приоритетный элемент.
   * @throws ValidationException `QUEUE_EMPTY`, если очередь пуста
   */
  public dequeue(): T {
    const top = this.peek();
    const last = this.heap.pop() as T;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /**
   * Возвращает самый приоритетный элемент, не удаляя его.
   * @throws ValidationException `QUEUE_EMPTY`, если очередь пуста
   */
  public peek(): T {
    if (this.heap.length === 0) {
      throw new ValidationException('Очередь пуста', null, ErrorCodes.QUEUE_EMPTY);
    }
    return this.heap[0] as T;
  }

  private siftUp(index: number): void {
    let child = index;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (this.compare(this.at(child), this.at(parent)) >= 0) break;
      this.swap(child, parent);
      child = parent;
    }
  }

  private siftDown(index: number): void {
    let parent = index;
    const size = this.heap.length;
    for (;;) {
      const left = 2 * parent + 1;
      const right = left + 1;
      let best = parent;
      if (left < size && this.compare(this.at(left), this.at(best)) < 0) best = left;
      if (right < size && this.compare(this.at(right), this.at(best)) < 0) best = right;
      if (best === parent) return;
      this.swap(parent, best);
      parent = best;
    }
  }

  private at(index: number): T {
    return this.heap[index] as T;
  }

  private swap(i: number, j: number): void {
    const tmp = this.at(i);
    this.heap[i] = this.at(j);
    this.heap[j] = tmp;
  }
}
