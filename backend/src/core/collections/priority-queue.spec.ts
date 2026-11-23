import { ErrorCodes, ValidationException } from '../exceptions';

import { PriorityQueue } from './priority-queue';

describe('PriorityQueue<T>', () => {
  const byNumber = (a: number, b: number): number => a - b;

  it('dequeue возвращает элементы в порядке компаратора', () => {
    const queue = new PriorityQueue<number>(byNumber);
    [5, 1, 4, 2, 3, 2].forEach((n) => queue.enqueue(n));

    const result: number[] = [];
    while (!queue.isEmpty()) result.push(queue.dequeue());

    expect(result).toEqual([1, 2, 2, 3, 4, 5]);
  });

  it('peek не удаляет элемент', () => {
    const queue = new PriorityQueue<number>(byNumber, [3, 1, 2]);

    expect(queue.peek()).toBe(1);
    expect(queue.size).toBe(3);
  });

  it('работает с объектами и обратным порядком', () => {
    const queue = new PriorityQueue<{ name: string; p: number }>((a, b) => b.p - a.p);
    queue.enqueue({ name: 'низкий', p: 1 });
    queue.enqueue({ name: 'высокий', p: 10 });

    expect(queue.dequeue().name).toBe('высокий');
  });

  it('dequeue и peek на пустой очереди бросают ValidationException', () => {
    const queue = new PriorityQueue<number>(byNumber);

    expect(() => queue.dequeue()).toThrow(ValidationException);
    expect(() => queue.peek()).toThrow(expect.objectContaining({ code: ErrorCodes.QUEUE_EMPTY }));
  });
});
