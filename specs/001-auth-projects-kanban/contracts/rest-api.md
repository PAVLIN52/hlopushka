# REST API Contract — инкремент 001

Базовый путь: `/api`. Формат: JSON. Аутентификация: httpOnly-cookie `access_token` и
`refresh_token`, которые выставляет сервер. Типы запросов и ответов лежат в
`shared/src/contracts/*.ts` и используются бэкендом и фронтендом.

## Формат ошибки (все эндпоинты)

```json
{ "code": "STAGE_TRANSITION_FORBIDDEN", "message": "Из этапа «Монтаж» нельзя перейти в «Сдача»", "value": { "from": "EDITING", "to": "DELIVERY", "allowed": ["PREPRODUCTION","SHOOTING","COLOR","SOUND"] } }
```

| HTTP | Исключение |
|---|---|
| 400 | ValidationException |
| 401 | UnauthorizedException (`AUTH_REQUIRED`) — нет действующей сессии |
| 403 | AccessDeniedException |
| 404 | NotFoundException |
| 409 | ConflictException |

Коды ошибок перечислены в [data-model.md §2.1](../data-model.md).

## Права

Обозначения ролей в таблицах: **P** — продюсер, **E** — монтажёр, **C** — колорист,
**Cl** — заказчик. Пользователь, который не состоит в проекте, на любой запрос к проекту
получает `403 PROJECT_ACCESS_DENIED`. Если проекта не существует — `404`.

---

## Auth

| Метод | Путь | Тело | Ответ | Ошибки |
|---|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `201 { user }` + cookies | 400 `AUTH_EMAIL_TAKEN`, `AUTH_WEAK_PASSWORD`, `VALIDATION`* |
| POST | `/auth/login` | `{ email, password }` | `200 { user }` + cookies | 403 `AUTH_INVALID_CREDENTIALS` |
| POST | `/auth/refresh` | — | `200` + новые cookies | 401 |
| POST | `/auth/logout` | — | `204`, сессия отозвана | — |
| GET | `/auth/me` | — | `200 { user }` | 401 |

\* Ошибки проверки формата полей возвращаются общим кодом `VALIDATION`, а в `value`
передаётся список полей с ошибками.

`user = { id, name, email, createdAt }`. Поле `passwordHash` не возвращается никогда.

## Projects

| Метод | Путь | Роли | Тело | Ответ |
|---|---|---|---|---|
| GET | `/projects` | любой вошедший | — | `200 ProjectSummary[]` — только проекты, где пользователь участник (FR-007) |
| POST | `/projects` | любой вошедший | `{ title, description?, dueDate? }` | `201 Project`, создатель становится PRODUCER |
| GET | `/projects/:id` | P E C Cl | — | `200 Project & { myRole }` |
| PATCH | `/projects/:id` | P | `{ title?, description?, dueDate? }` | `200 Project` |

## Members

| Метод | Путь | Роли | Тело | Ответ / ошибки |
|---|---|---|---|---|
| GET | `/projects/:id/members` | P E C Cl | — | `200 Member[]` (`{ user, role, joinedAt }`) |
| POST | `/projects/:id/members` | P | `{ email, role }` | `201 Member` · 404 `USER_NOT_FOUND` · 400 `MEMBER_ALREADY_EXISTS` |
| PATCH | `/projects/:id/members/:userId` | P | `{ role }` | `200 Member` · 400 `LAST_PRODUCER` · 404 `MEMBER_NOT_FOUND` |
| DELETE | `/projects/:id/members/:userId` | P | — | `204` · 400 `LAST_PRODUCER` · 404 `MEMBER_NOT_FOUND`. Задачи, где этот пользователь был исполнителем, остаются без исполнителя |

## Board & Tasks

### GET `/projects/:id/board` — роли P E C Cl

```json
{
  "columns": [
    { "stage": "PREPRODUCTION", "tasks": [Task, ...] },
    "... всего 6 колонок в фиксированном порядке"
  ],
  "overdue": ["taskId", "..."],
  "history": { "canUndo": false, "canRedo": false }
}
```

Задачи внутри колонки отсортированы по `rank`. Список `overdue` строит `DeadlineIterator`,
от самой просроченной задачи к наименее просроченной.

`Task = { id, title, description, type, stage, rank, priority, assignee: {id,name}|null, deadline, isOverdue, authorId, version, createdAt, updatedAt }`

### Задачи

| Метод | Путь | Роли | Тело | Ответ / ошибки |
|---|---|---|---|---|
| POST | `/projects/:id/tasks` | P E C | `{ title, type, stage?, priority?, description?, assigneeId?, deadline?, beforeId?, afterId? }` | `201 { task, warnings[] }`. `warnings` содержит `DEADLINE_AFTER_PROJECT_DUE`, если дедлайн позже даты сдачи проекта · 400 `TASK_VALIDATION`, `ASSIGNEE_NOT_MEMBER` |
| PATCH | `/projects/:id/tasks/:taskId` | P E C | `{ expectedVersion, title?, description?, type?, priority?, assigneeId?, deadline? }` | `200 { task, warnings[] }` · 409 `TASK_VERSION_CONFLICT`. Этап здесь **не** меняется, только через `/move` |
| DELETE | `/projects/:id/tasks/:taskId` | **P** | — | `204` · 403 `ROLE_FORBIDDEN` для остальных ролей |
| POST | `/projects/:id/tasks/:taskId/move` | P E C | `{ expectedVersion, toStage, beforeId?, afterId? }` | `200 { task, history: {canUndo, canRedo} }` · 400 `STAGE_TRANSITION_FORBIDDEN` · 409 `TASK_VERSION_CONFLICT` |

Как задаётся позиция при перемещении:
- `beforeId` / `afterId` — соседние карточки в целевой колонке; сервер вычисляет `rank`
  между ними;
- если оба поля не указаны — карточка ставится в конец колонки.

Каждое успешное перемещение записывается как `MoveTaskCommand` в историю
пользователя для этого проекта.

### Отмена и повтор

| Метод | Путь | Роли | Ответ / ошибки |
|---|---|---|---|
| POST | `/projects/:id/board/undo` | P E C | `200 { task, history }` · 400 `NOTHING_TO_UNDO` · 409 `TASK_VERSION_CONFLICT`, если задачу с тех пор изменил другой участник · 404 `TASK_NOT_FOUND`, если задачу удалили |
| POST | `/projects/:id/board/redo` | P E C | аналогично, код пустой истории — `NOTHING_TO_REDO` |

Если отмена отклонена из-за конфликта или удаления задачи, эта команда убирается из
истории, чтобы при следующей отмене пользователь не получил ту же ошибку.

Заказчик (**Cl**) на любой запрос изменения (POST, PATCH, DELETE задач, а также undo и redo)
получает `403 ROLE_FORBIDDEN` (FR-011, SC-004).
