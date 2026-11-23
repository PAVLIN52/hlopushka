import { CustomException, ErrorCodes } from '../exceptions';

import { LinkedList } from './linked-list';

describe('LinkedList<T>', () => {
  const fill = (...values: number[]): LinkedList<number> => {
    const list = new LinkedList<number>();
    values.forEach((v) => list.append(v));
    return list;
  };

  it('append добавляет в конец, size и first/last корректны', () => {
    const list = fill(1, 2, 3);

    expect(list.size).toBe(3);
    expect(list.first?.value).toBe(1);
    expect(list.last?.value).toBe(3);
    expect(list.toArray()).toEqual([1, 2, 3]);
    expect(list.isEmpty()).toBe(false);
  });

  it('removeFirst удаляет голову и возвращает значение', () => {
    const list = fill(1, 2);

    expect(list.removeFirst()).toBe(1);
    expect(list.toArray()).toEqual([2]);
    expect(list.removeFirst()).toBe(2);
    expect(list.isEmpty()).toBe(true);
    expect(list.first).toBeNull();
    expect(list.last).toBeNull();
  });

  it('removeFirst на пустом списке бросает ITERATOR_EMPTY', () => {
    expect(() => new LinkedList<number>().removeFirst()).toThrow(CustomException);
  });

  it('removeAfter обрезает хвост после узла', () => {
    const list = fill(1, 2, 3, 4);
    const second = list.first!.next!;

    expect(list.removeAfter(second)).toBe(2);
    expect(list.toArray()).toEqual([1, 2]);
    expect(list.last?.value).toBe(2);
  });

  it('removeAfter(null) очищает весь список', () => {
    const list = fill(1, 2, 3);

    expect(list.removeAfter(null)).toBe(3);
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it('remove удаляет узел из середины и поддерживает связи', () => {
    const list = fill(1, 2, 3);
    list.remove(list.first!.next!);

    expect(list.toArray()).toEqual([1, 3]);
    expect(list.first!.next!.prev).toBe(list.first);
  });

  it('итератор обходит элементы и поддерживает for...of и reset', () => {
    const list = fill(10, 20, 30);
    const it = list.iterator();

    expect(it.hasNext()).toBe(true);
    expect(it.next()).toBe(10);
    expect([...it]).toEqual([20, 30]);
    it.reset();
    expect(it.next()).toBe(10);
  });

  it('итератор пустого списка бросает ITERATOR_EMPTY', () => {
    const it = new LinkedList<string>().iterator();

    expect(it.hasNext()).toBe(false);
    expect(() => it.next()).toThrow(expect.objectContaining({ code: ErrorCodes.ITERATOR_EMPTY }));
  });

  it('итератор за концом бросает ITERATOR_EXHAUSTED', () => {
    const it = fill(1).iterator();
    it.next();

    expect(() => it.next()).toThrow(expect.objectContaining({ code: ErrorCodes.ITERATOR_EXHAUSTED }));
  });
});
