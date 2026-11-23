# Realtime Contract (Socket.IO) — инкремент 001

Namespace: `/board`. Аутентификация выполняется по cookie `access_token` в момент
подключения (handshake). Без действующей сессии сервер разрывает соединение с ошибкой
`unauthorized`.

Сокет используется **только для получения событий**. Все изменения клиент отправляет через
REST ([rest-api.md](rest-api.md)), поэтому права и правила переходов проверяются в одном
месте.

## Клиент → сервер

| Событие | Payload | Ответ (ack) |
|---|---|---|
| `board:join` | `{ projectId }` | `{ ok: true }` или `{ ok: false, code: "PROJECT_ACCESS_DENIED" }` |
| `board:leave` | `{ projectId }` | `{ ok: true }` |

Подключившись к доске, клиент попадает в комнату `project:{projectId}`.

## Сервер → клиент

Все события имеют общую обёртку:

```ts
interface BoardEvent<T> {
  type: string;        // см. таблицу ниже
  projectId: string;
  actorId: string;     // кто сделал изменение
  occurredAt: string;  // ISO-8601
  payload: T;
}
```

| type | payload | Что делает клиент |
|---|---|---|
| `task.created` | `Task` | добавляет карточку в колонку по `rank` |
| `task.updated` | `Task` | заменяет карточку, если `version` новее |
| `task.moved` | `{ taskId, stage, rank, version }` | переносит карточку, если `version` новее |
| `task.deleted` | `{ taskId }` | удаляет карточку |
| `member.added` / `member.updated` | `Member` | обновляет список участников. Если изменилась **своя** роль — перезапрашивает права и доску |
| `member.removed` | `{ userId }` | если удалили **самого пользователя**: закрывает доску с сообщением, сервер принудительно выводит его из комнаты (FR-023). Иначе обнуляет `assignee` у задач этого участника |

Свои события клиент тоже получает (`actorId === me`). Если номер `version` совпадает с уже
применённым, событие игнорируется, поэтому повторное применение безопасно.

## Резервный режим (FR-022, SC-007)

| Состояние сокета | Поведение клиента |
|---|---|
| `connected` | `refetchInterval` выключен, доска обновляется по событиям |
| `disconnected` / `connect_error` | баннер «Нет связи — данные обновляются раз в минуту», `refetchInterval: 60_000` для `GET /board` |
| `reconnect` | немедленный перезапрос доски, повторный `board:join`, баннер скрывается |
