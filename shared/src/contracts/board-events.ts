/** Типы событий доски, рассылаемых через Socket.IO (contracts/realtime-events.md). */
export type BoardEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.moved'
  | 'task.deleted'
  | 'member.added'
  | 'member.updated'
  | 'member.removed';

/** Общая обёртка события доски. */
export interface BoardEvent<T = unknown> {
  type: BoardEventType;
  projectId: string;
  /** Кто сделал изменение. */
  actorId: string;
  /** Время события в ISO-8601. */
  occurredAt: string;
  payload: T;
}
