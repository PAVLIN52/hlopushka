/**
 * Перечисления предметной области (data-model.md → «Перечисления»).
 * Используются и бэкендом, и фронтендом.
 */

/** Роль участника в проекте. */
export enum Role {
  PRODUCER = 'PRODUCER',
  EDITOR = 'EDITOR',
  COLORIST = 'COLORIST',
  CLIENT = 'CLIENT',
}

/** Этап производства (колонка доски). Порядок значим. */
export enum Stage {
  PREPRODUCTION = 'PREPRODUCTION',
  SHOOTING = 'SHOOTING',
  EDITING = 'EDITING',
  COLOR = 'COLOR',
  SOUND = 'SOUND',
  DELIVERY = 'DELIVERY',
}

/** Этапы в порядке следования на доске. */
export const STAGE_ORDER: readonly Stage[] = [
  Stage.PREPRODUCTION,
  Stage.SHOOTING,
  Stage.EDITING,
  Stage.COLOR,
  Stage.SOUND,
  Stage.DELIVERY,
];

/** Русские названия этапов для сообщений и интерфейса. */
export const STAGE_LABELS: Readonly<Record<Stage, string>> = {
  [Stage.PREPRODUCTION]: 'Препродакшн',
  [Stage.SHOOTING]: 'Съёмка',
  [Stage.EDITING]: 'Монтаж',
  [Stage.COLOR]: 'Цвет',
  [Stage.SOUND]: 'Звук',
  [Stage.DELIVERY]: 'Сдача',
};

/** Тип задачи. */
export enum TaskType {
  SHOOTING = 'SHOOTING',
  EDITING = 'EDITING',
  COLOR = 'COLOR',
  SOUND = 'SOUND',
  GRAPHICS = 'GRAPHICS',
  OTHER = 'OTHER',
}

/** Приоритет задачи. */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Действия в проекте, на которые проверяются права (FR-011).
 * Матрица «роль → действие» живёт на бэкенде в `ProjectPermissions`.
 */
export enum ProjectAction {
  /** Смотреть проект, доску и участников. */
  VIEW = 'VIEW',
  /** Создавать, редактировать и перемещать задачи, отменять перемещения. */
  EDIT_TASKS = 'EDIT_TASKS',
  /** Удалять задачи. */
  DELETE_TASKS = 'DELETE_TASKS',
  /** Изменять проект и управлять участниками. */
  MANAGE_PROJECT = 'MANAGE_PROJECT',
}
