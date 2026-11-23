/**
 * Узел двусвязного списка. Наружу отдаётся, чтобы клиент (например, `CommandHistory`)
 * мог хранить «курсор» на узел и обрезать хвост за O(1) на каждый удаляемый элемент.
 */
export class ListNode<T> {
  public next: ListNode<T> | null = null;
  public prev: ListNode<T> | null = null;

  constructor(public readonly value: T) {}
}
