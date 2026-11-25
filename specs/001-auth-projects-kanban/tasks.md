---

description: "Задачи реализации инкремента 001: авторизация, проекты, канбан-доска"
---

# Tasks: Авторизация, проекты и канбан-доска

**Input**: Design documents from `/specs/001-auth-projects-kanban/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: По конституции (принцип I) юнит-тесты ООП-ядра обязательны. Они пишутся
**до** реализации класса ядра и должны сначала падать. Интеграционные и сквозные тесты
собраны в финальной фазе и проверяют SC-004…SC-007.

**Organization**: задачи сгруппированы по пользовательским историям из spec.md.

**Общие правила для каждой задачи** (повторно в задачах не указываются):
- структура файлов, именование, порядок импортов и членов класса — по принципу VIII
  конституции;
- в ядре: JSDoc на русском (принцип VII), комментарий с названием паттерна (принцип V),
  без `any` (принцип II);
- ошибки — только через наследников `CustomException` с кодами из `data-model.md` §2.1
  (принцип III);
- ограничения полей берутся из `data-model.md` по ссылке вида `Entity.field` и в задачах
  не переписываются.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можно делать параллельно (разные файлы, нет зависимости от незавершённых задач)
- **[Story]**: к какой истории относится (US1…US6)

## Path Conventions

Веб-приложение в монорепо: `backend/src/`, `frontend/src/`, `shared/src/` (plan.md →
Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: каркас монорепо и инструменты

- [X] T001 Создать корневой `package.json` с npm workspaces (`backend`, `frontend`, `shared`), скриптами `dev`, `build`, `test`, `lint` и `engines.node >=24` в `package.json`
- [X] T002 Создать общий `tsconfig.base.json` (strict, `noImplicitAny`, `exactOptionalPropertyTypes`) и пакет `shared` с `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`
- [X] T003 [P] Инициализировать NestJS 11 в `backend/` (`backend/package.json`, `backend/tsconfig.json` с алиасами `@/core`, `@/infrastructure`, `@/common`, `@/modules`, `@/config`; `backend/nest-cli.json`)
- [X] T004 [P] Инициализировать Next.js 15 (App Router, TypeScript, Tailwind 4) в `frontend/` с алиасом `@/*` → `frontend/src/*` в `frontend/tsconfig.json`
- [X] T005 [P] Настроить ESLint + Prettier, включая правило порядка импортов по группам из принципа VIII, в `eslint.config.mjs` и `.prettierrc`
- [X] T006 [P] Настроить Jest для бэкенда: проекты `core` (только `src/core/**/*.spec.ts`, без БД) и `e2e` (`test/**/*.e2e-spec.ts`), скрипты `test:core` и `test:e2e` в `backend/jest.config.ts`
- [X] T007 [P] Создать `.env.example` с комментариями: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_ORIGIN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- [X] T008 Создать `docker-compose.yml` с сервисами `postgres:16` (с volume и healthcheck), `backend` и `frontend` (Dockerfile для каждого: `backend/Dockerfile`, `frontend/Dockerfile`; образы arm64-совместимые)
- [X] T009 [P] Создать каталоги документации `docs/uml/`, `docs/sequence/`, `docs/screenshots/001/`, `docs/report/` с `.gitkeep`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ООП-ядро общего назначения, схема БД, обработка ошибок, логгер, базовый
фронтенд. Нужно для всех историй.

**⚠️ CRITICAL**: работа над историями начинается только после этой фазы.

### Общие типы

- [X] T010 [P] Описать перечисления `Role`, `Stage` (с массивом `STAGE_ORDER`), `TaskType`, `Priority` по таблице «Перечисления» из `data-model.md` в `shared/src/enums.ts`
- [X] T011 [P] Описать тип ответа об ошибке `ApiError { code, message, value }` и интерфейс `BoardEvent<T>` (contracts/realtime-events.md) в `shared/src/contracts/common.ts` и `shared/src/contracts/board-events.ts`

### Ядро: исключения (принцип III)

- [X] T012 [P] Тест: свойства `message`/`value`/`code`, цепочка `instanceof` для 5 наследников (включая `UnauthorizedException`), сохранение `name` и стека в `backend/src/core/exceptions/exceptions.spec.ts`
- [X] T013 Реализовать `CustomException extends Error` в `backend/src/core/exceptions/custom.exception.ts`
- [X] T014 [P] Реализовать наследников `NotFoundException`, `ValidationException`, `AccessDeniedException`, `ConflictException`, `UnauthorizedException` в `backend/src/core/exceptions/not-found.exception.ts`, `validation.exception.ts`, `access-denied.exception.ts`, `conflict.exception.ts`, `unauthorized.exception.ts` и реэкспорт в `backend/src/core/exceptions/index.ts`
- [X] T015 [P] Константы кодов ошибок из `data-model.md` §2.1 в `backend/src/core/exceptions/error-codes.ts`

### Ядро: коллекции и интерфейс итератора (принципы II, VI)

- [X] T016 [P] Объявить `IIterator<T>` (`hasNext`, `next`, `reset`, `[Symbol.iterator]`) в `backend/src/core/iterators/iterator.interface.ts`
- [X] T017 [P] Объявить `IRepository<T, TCreate, TUpdate>` в `backend/src/core/collections/repository.interface.ts`
- [X] T018 [P] Тест `LinkedList<T>`: append, removeFirst, removeAfter (обрезка хвоста), size, итерация, `ITERATOR_EMPTY`/`ITERATOR_EXHAUSTED` в `backend/src/core/collections/linked-list.spec.ts`
- [X] T019 Реализовать `LinkedList<T>` с внутренним итератором, реализующим `IIterator<T>`, в `backend/src/core/collections/linked-list.ts`
- [X] T020 [P] Тест `PriorityQueue<T>`: порядок по компаратору, peek, dequeue из пустой очереди → `ValidationException` в `backend/src/core/collections/priority-queue.spec.ts`
- [X] T021 Реализовать `PriorityQueue<T>` (бинарная куча с компаратором) в `backend/src/core/collections/priority-queue.ts`, реэкспорт коллекций в `backend/src/core/collections/index.ts`

### Ядро: Singleton-логгер (принцип V)

- [X] T022 [P] Тест: `getInstance()` всегда возвращает один и тот же объект, конструктор недоступен снаружи в `backend/src/core/patterns/singleton/app.logger.spec.ts`
- [X] T023 Реализовать `AppLogger` (приватный конструктор, `getInstance`, `log`/`warn`/`error` с контекстом) в `backend/src/core/patterns/singleton/app.logger.ts`
- [X] T024 Адаптер `NestLoggerAdapter implements LoggerService` поверх `AppLogger` в `backend/src/infrastructure/logger/nest-logger.adapter.ts`

### Инфраструктура бэкенда

- [X] T025 Prisma-схема со всеми моделями и enum'ами из `data-model.md` §1: `User` (`User.email` уникален), `RefreshSession` (каскадное удаление по `RefreshSession.userId`), `Project` (`Project.description` необязательно), `ProjectMember` (составной PK `ProjectMember.projectId`+`ProjectMember.userId`), `Task` (каскадное удаление по `Task.projectId`; `Task.authorId` обязательно; `Task.description` необязательно; индексы `(projectId, stage, rank)` и `(projectId, deadline)`; `Task.version` по умолчанию 0) в `backend/prisma/schema.prisma`; первая миграция в `backend/prisma/migrations/`
- [X] T026 `PrismaService` с `$connect` в `onModuleInit` и `$disconnect` в `onModuleDestroy` (принцип IV) и `PrismaModule` в `backend/src/infrastructure/prisma/prisma.service.ts`, `prisma.module.ts`
- [X] T027 [P] Загрузка и проверка конфигурации из `.env` (без секрета приложение не стартует) в `backend/src/config/app.config.ts`
- [X] T028 Глобальный `CustomExceptionFilter`: маппинг Unauthorized→401, NotFound→404, Validation→400, AccessDenied→403, Conflict→409, остальное→500 с записью исходной ошибки в `AppLogger`; тело `{code,message,value}` по contracts/rest-api.md; ошибки `class-validator` превращаются в `ValidationException` с кодом `VALIDATION` в `backend/src/common/filters/custom-exception.filter.ts`
- [X] T029 `main.ts` и `app.module.ts`: префикс `/api`, `cookie-parser`, CORS с credentials для `FRONTEND_ORIGIN`, глобальный `ValidationPipe` (whitelist), фильтр из T028, `app.useLogger(NestLoggerAdapter)`, `enableShutdownHooks()` в `backend/src/main.ts`, `backend/src/app.module.ts`

### Базовый фронтенд

- [X] T030 [P] Инициализировать shadcn/ui (button, input, label, dialog, select, card, badge, sonner, avatar, dropdown-menu) в `frontend/src/components/ui/`
- [X] T031 [P] API-клиент на `fetch` с `credentials: 'include'`: разбор `ApiError`, один повтор запроса через `/auth/refresh` при 401 в `frontend/src/lib/api-client.ts`
- [X] T032 [P] `QueryClient` и провайдеры (TanStack Query, Toaster) в `frontend/src/lib/query-client.ts` и `frontend/src/app/providers.tsx`; подключение в `frontend/src/app/layout.tsx` (язык `ru`)

**Checkpoint**: `npm run test:core -w backend` зелёный (исключения, коллекции, логгер),
`docker compose up` поднимает пустое приложение.

---

## Phase 3: User Story 1 — Регистрация и вход (Priority: P1) 🎯 MVP

**Goal**: пользователь регистрируется, входит, выходит; защищённые страницы закрыты.

**Independent Test**: сценарии 1–2 из quickstart.md.

### Implementation for User Story 1

- [X] T033 [P] [US1] Контракты `RegisterDto`, `LoginDto`, `UserDto` в `shared/src/contracts/auth.ts`
- [X] T034 [P] [US1] Доменный класс `User` без поля пароля наружу (`data-model.md` → `User.name`, `User.email`, `User.passwordHash`) в `backend/src/modules/users/entities/user.entity.ts`
- [X] T035 [US1] `UsersRepository implements IRepository<User>`: `findByEmail` (`User.email` сравнивается в нижнем регистре) в `backend/src/modules/users/users.repository.ts`; `UsersService` и `UsersModule` в `backend/src/modules/users/users.service.ts`, `users.module.ts`
- [X] T036 [P] [US1] DTO с `class-validator`: имя по `data-model.md` → `User.name`, email по `User.email`; правило пароля из FR-003 (≥ 8 символов, есть буква и цифра) → `AUTH_WEAK_PASSWORD` в `backend/src/modules/auth/dto/register.dto.ts`, `login.dto.ts`
- [X] T037 [US1] `RefreshSessionsRepository` (хранит хеш токена `data-model.md` → `RefreshSession.tokenHash`, срок `RefreshSession.expiresAt`, отзыв `RefreshSession.revokedAt`) в `backend/src/modules/auth/auth.repository.ts`
- [X] T038 [US1] `AuthService`: регистрация (argon2id → `User.passwordHash`, `AUTH_EMAIL_TAKEN`), вход (`AUTH_INVALID_CREDENTIALS` без уточнения поля), выпуск access на 15 мин и refresh на 7 дней, ротация refresh, выход с отзывом сессии (research.md R2) в `backend/src/modules/auth/auth.service.ts`
- [X] T039 [US1] `AuthController`: `/auth/register`, `/login`, `/refresh`, `/logout`, `/me` по contracts/rest-api.md; httpOnly-cookie `SameSite=Lax`, `Secure` в production в `backend/src/modules/auth/auth.controller.ts`, `auth.module.ts`
- [X] T040 [US1] `JwtAuthGuard` (глобальный, с декоратором `@Public()`): при отсутствии, истечении или отзыве токена бросает только `UnauthorizedException` с кодом `AUTH_REQUIRED` (не исключение NestJS, принцип III); декоратор `@CurrentUser()` в `backend/src/common/guards/jwt-auth.guard.ts`, `backend/src/common/decorators/public.decorator.ts`, `current-user.decorator.ts`
- [X] T041 [P] [US1] Хуки `useSession`, `useLogin`, `useRegister`, `useLogout` в `frontend/src/features/auth/use-session.ts` и `frontend/src/features/auth/api.ts`
- [X] T042 [P] [US1] Страницы входа и регистрации: валидация полей, сообщения ошибок на русском в `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/(auth)/register/page.tsx`
- [X] T043 [US1] Защита маршрутов: без сессии — переход на `/login`, после входа — на `/projects`, кнопка «Выйти» в шапке в `frontend/src/middleware.ts` и `frontend/src/components/projects/app-header.tsx`

**Checkpoint**: регистрация, вход и выход работают; `/api/auth/me` без cookie отвечает 401.

---

## Phase 4: User Story 2 — Проект и участники с ролями (Priority: P1)

**Goal**: создание проектов, добавление участников по email, смена ролей, правило «≥ 1
продюсер».

**Independent Test**: сценарии 3–5 из quickstart.md.

**Зависит от**: US1 (сессия и `@CurrentUser`).

### Implementation for User Story 2

- [X] T044 [P] [US2] Контракты `CreateProjectDto`, `ProjectDto`, `MemberDto`, `AddMemberDto`, `UpdateMemberRoleDto` в `shared/src/contracts/projects.ts`
- [X] T045 [P] [US2] Доменные классы `Project` и `ProjectMember` (`data-model.md` → `Project.title`, `Project.dueDate`, `ProjectMember.role`) в `backend/src/modules/projects/entities/project.entity.ts`, `project-member.entity.ts`
- [X] T046 [P] [US2] DTO проекта и участника с валидацией (`data-model.md` → `Project.title`, `Project.description`, `Project.dueDate`, `ProjectMember.role`) в `backend/src/modules/projects/dto/create-project.dto.ts`, `update-project.dto.ts`, `add-member.dto.ts`, `update-member-role.dto.ts`
- [X] T047 [US2] `ProjectsRepository implements IRepository<Project>` + методы участников (`findMember`, `countProducers`, `addMember`, `updateRole`, `removeMember` со сбросом `Task.assigneeId` в null в той же транзакции) в `backend/src/modules/projects/projects.repository.ts`
- [X] T048 [US2] Декоратор `@ProjectAccess(action)` и `ProjectAccessGuard`: проверка участия (`PROJECT_NOT_FOUND`, `PROJECT_ACCESS_DENIED`) и права роли (`ROLE_FORBIDDEN`) по матрице FR-011 (`ProjectPermissions`); guard зависит от интерфейса `IProjectAccessResolver`, участие кладётся в `request.membership` в `backend/src/common/guards/project-access.guard.ts`, `project-access.interface.ts`, `backend/src/common/decorators/project-access.decorator.ts`
- [X] T049 [US2] `ProjectsService`: создание проекта (создатель получает роль PRODUCER), список только своих проектов, добавление участника по email (`USER_NOT_FOUND`, `MEMBER_ALREADY_EXISTS`), смена роли и удаление с проверкой `LAST_PRODUCER` в транзакции в `backend/src/modules/projects/projects.service.ts`
- [X] T050 [US2] `ProjectsController`: эндпоинты Projects и Members из contracts/rest-api.md в `backend/src/modules/projects/projects.controller.ts`, `projects.module.ts`
- [ ] T051 [P] [US2] Хуки `useProjects`, `useProject`, `useCreateProject`, `useMembers`, `useAddMember`, `useUpdateMemberRole`, `useRemoveMember` в `frontend/src/features/projects/api.ts`, `use-projects.ts`, `use-members.ts`
- [ ] T052 [P] [US2] Список проектов с пустым состоянием и диалогом «Создать проект» в `frontend/src/app/projects/page.tsx`, `frontend/src/components/projects/project-list.tsx`, `create-project-dialog.tsx`
- [ ] T053 [US2] Страница участников: таблица, диалог добавления по email с выбором роли, смена роли, удаление; элементы управления видны только продюсеру в `frontend/src/app/projects/[id]/members/page.tsx`, `frontend/src/components/projects/member-list.tsx`, `add-member-dialog.tsx`

**Checkpoint**: продюсер управляет участниками; не участник получает 403 по прямой ссылке.

---

## Phase 5: User Story 3 — Канбан-доска с задачами (Priority: P1)

**Goal**: доска из 6 колонок, создание, редактирование и удаление задач (удаляет только
продюсер), отметка просроченных.

**Independent Test**: сценарий 6 и проверка удаления из сценария 14 (quickstart.md).

**Зависит от**: US2 (участники и `ProjectRoleGuard`).

### Тесты ядра для User Story 3 (обязательны по принципу I) ⚠️

- [ ] T054 [P] [US3] Тест абстрактного Factory Method в ядре на фейковом создателе (без импортов из модулей): шаблонный `create()` подставляет `defaultStage()`, если этап не передан, и сохраняет явно переданный; `TaskCreatorRegistry` возвращает зарегистрированного создателя, а для неизвестного типа бросает `ValidationException` в `backend/src/core/patterns/factory/task-creator.spec.ts`
- [ ] T055 [P] [US3] Тест `DeadlineIterator`: порядок от самой просроченной, задачи без дедлайна и в этапе DELIVERY пропускаются, `ITERATOR_EMPTY`, `ITERATOR_EXHAUSTED`, работа `for...of` в `backend/src/core/iterators/deadline.iterator.spec.ts`

### Implementation for User Story 3

- [ ] T056 [P] [US3] Контракты `TaskDto`, `CreateTaskDto`, `UpdateTaskDto`, `BoardDto` в `shared/src/contracts/tasks.ts`
- [ ] T057 [US3] Ядро Factory Method: интерфейс `ITaskLike` в `backend/src/core/iterators/task-like.interface.ts`; абстрактный `TaskCreator<T extends ITaskLike>` (шаблонный `create()`, абстрактные `createTask()` и `defaultStage()`) и `TaskCreatorRegistry<T>` (research.md R7, `data-model.md` §2.3) в `backend/src/core/patterns/factory/task.creator.ts`, `task-creator.registry.ts`, `index.ts`
- [ ] T058 [US3] Доменные классы и конкретные создатели в модуле: абстрактный `Task implements ITaskLike` с `isOverdue(now)` (производное поле из `data-model.md` → `Task.deadline`, `Task.stage`), 6 наследников и 6 `*TaskCreator extends TaskCreator<Task>` с этапами по умолчанию из `data-model.md` §2.4; тест создателей в `backend/src/modules/tasks/entities/task-creators.spec.ts`; файлы `backend/src/modules/tasks/entities/task.entity.ts`, `shooting-task.entity.ts` … `other-task.entity.ts`, `shooting-task.creator.ts` … `other-task.creator.ts`
- [ ] T059 [US3] `DeadlineIterator implements IIterator<ITaskLike>` поверх `PriorityQueue` в `backend/src/core/iterators/deadline.iterator.ts`; реэкспорт в `backend/src/core/iterators/index.ts`
- [ ] T060 [P] [US3] DTO задач с валидацией (`data-model.md` → `Task.title`, `Task.description`, `Task.type`, `Task.stage`, `Task.priority`, `Task.deadline`, `Task.assigneeId`; в `UpdateTaskDto` обязателен `expectedVersion` → `Task.version`; `stage` в `UpdateTaskDto` запрещён) в `backend/src/modules/tasks/dto/create-task.dto.ts`, `update-task.dto.ts`
- [ ] T061 [US3] `TasksRepository implements IRepository<Task>`: сопоставление строки БД и подкласса, `findByProjectOrdered` (`stage`, `rank`), `updateWithVersion` (условие `version = expected`, иначе `TASK_VERSION_CONFLICT`; `Task.version` +1), вычисление `Task.rank` между соседями через `fractional-indexing` в `backend/src/modules/tasks/tasks.repository.ts`
- [ ] T062 [US3] `TasksService`: создание через `TaskCreatorRegistry` с регистрацией 6 создателей в `onModuleInit` (`data-model.md` → `Task.authorId` = текущий пользователь; `ASSIGNEE_NOT_MEMBER` по `Task.assigneeId`; предупреждение `DEADLINE_AFTER_PROJECT_DUE`, если `Task.deadline` позже `Project.dueDate`), редактирование с `expectedVersion`, удаление в `backend/src/modules/tasks/tasks.service.ts`
- [ ] T063 [US3] `TasksController`: POST/PATCH/DELETE задач по contracts/rest-api.md; удаление только для `@ProjectRoles(PRODUCER)`, изменения — для PRODUCER/EDITOR/COLORIST в `backend/src/modules/tasks/tasks.controller.ts`, `tasks.module.ts`
- [ ] T064 [US3] `BoardsService.getBoard`: 6 колонок в порядке `STAGE_ORDER`, задачи по `rank`, `overdue` из `DeadlineIterator`, поле `history` (пока `{canUndo:false, canRedo:false}`) и `BoardsController` `GET /projects/:id/board` в `backend/src/modules/boards/boards.service.ts`, `boards.controller.ts`, `boards.module.ts`
- [ ] T065 [P] [US3] Хуки `useBoard`, `useCreateTask`, `useUpdateTask`, `useDeleteTask` с инвалидацией кеша в `frontend/src/features/board/api.ts`, `use-board.ts`
- [ ] T066 [P] [US3] Компоненты `KanbanBoard`, `KanbanColumn` (пустое состояние с подсказкой), `TaskCard` (тип, исполнитель, дедлайн, бейдж приоритета, красная рамка при `isOverdue`) в `frontend/src/components/kanban/kanban-board.tsx`, `kanban-column.tsx`, `task-card.tsx`
- [ ] T067 [US3] `TaskDialog` для создания и редактирования: исполнитель выбирается только из участников, предупреждение о дедлайне позже сдачи, кнопка «Удалить» только для продюсера в `frontend/src/components/kanban/task-dialog.tsx`
- [ ] T068 [US3] Страница доски с вкладками «Доска» / «Участники» в `frontend/src/app/projects/[id]/board/page.tsx` и `frontend/src/app/projects/[id]/layout.tsx`

**Checkpoint**: задачи создаются, редактируются, удаляются и сохраняются после
обновления страницы; просроченные помечены.

---

## Phase 6: User Story 4 — Перемещение карточек по правилам этапов + синхронизация (Priority: P1)

**Goal**: drag-and-drop внутри колонки и между колонками, правила State, синхронизация
доски между участниками в реальном времени и резервный опрос раз в минуту (FR-017,
FR-021…023).

**Independent Test**: сценарии 7–9, 15–16 из quickstart.md.

**Зависит от**: US3.

### Тесты ядра для User Story 4 (обязательны по принципу I) ⚠️

- [ ] T069 [P] [US4] Тест `StageIterator`: обход вперёд и назад от любого этапа, `reset`, `ITERATOR_EXHAUSTED` в `backend/src/core/iterators/stage.iterator.spec.ts`
- [ ] T070 [P] [US4] Тест State: полная матрица 6×6 из `data-model.md` («Переходы между этапами»), `STAGE_TRANSITION_FORBIDDEN` с `value = {from, to, allowed}`, переход в тот же этап разрешён в `backend/src/core/patterns/state/task-stage.context.spec.ts`
- [ ] T071 [P] [US4] Тест Observer: subscribe/unsubscribe/notify, исключение в одном наблюдателе не мешает остальным (ошибка уходит в `AppLogger`) в `backend/src/core/patterns/observer/board-event-bus.spec.ts`

### Implementation for User Story 4

- [ ] T072 [US4] `StageIterator implements IIterator<Stage>` (`direction: 'forward' | 'backward'`) в `backend/src/core/iterators/stage.iterator.ts`
- [ ] T073 [US4] State: абстрактный `StageState` (`allowedTransitions` через `StageIterator`), 6 состояний и `TaskStageContext.transitionTo` (research.md R6) в `backend/src/core/patterns/state/stage.state.ts`, `preproduction.state.ts`, `shooting.state.ts`, `editing.state.ts`, `color.state.ts`, `sound.state.ts`, `delivery.state.ts`, `task-stage.context.ts`, `index.ts`
- [ ] T074 [US4] Observer: `ISubject<E>`, `IObserver<E>`, `BoardEventBus` в `backend/src/core/patterns/observer/subject.interface.ts`, `observer.interface.ts`, `board-event-bus.ts`, `index.ts`
- [ ] T075 [P] [US4] DTO перемещения `{ expectedVersion, toStage, beforeId?, afterId? }` (`data-model.md` → `Task.version`, `Task.stage`) в `backend/src/modules/tasks/dto/move-task.dto.ts`
- [ ] T076 [US4] `TasksService.move`: проверка через `TaskStageContext`, новый `Task.rank` между соседями, `updateWithVersion`. При конфликте обычного перемещения — перечитать задачу и повторить один раз (research.md R4). Эндпоинт `POST /projects/:id/tasks/:taskId/move` в `backend/src/modules/tasks/tasks.service.ts`, `tasks.controller.ts`
- [ ] T077 [US4] `BoardGateway` (namespace `/board`): аутентификация по cookie при подключении, `board:join`/`board:leave` с проверкой участия, принудительный выход из комнаты при удалении участника, закрытие сокетов в `onApplicationShutdown` в `backend/src/infrastructure/realtime/board.gateway.ts`, `realtime.module.ts`
- [ ] T078 [US4] `SocketBoardObserver` и `AuditLogObserver` (подписываются на `BoardEventBus` в `onModuleInit`, отписываются в `onModuleDestroy`) в `backend/src/infrastructure/realtime/socket-board.observer.ts`, `backend/src/infrastructure/logger/audit-log.observer.ts`
- [ ] T079 [US4] Публиковать события `task.created/updated/moved/deleted` из `TasksService` и `member.added/updated/removed` из `ProjectsService` через `BoardEventBus` после успешной транзакции в `backend/src/modules/tasks/tasks.service.ts`, `backend/src/modules/projects/projects.service.ts`
- [ ] T080 [P] [US4] Socket-клиент (`withCredentials`, автоматическое переподключение) в `frontend/src/lib/socket-client.ts`
- [ ] T081 [US4] `useBoardSocket`: join/leave, применение событий к кешу `useBoard` по `version` (повторное применение безопасно), `refetchInterval: 60_000` при обрыве соединения и немедленный перезапрос после переподключения, обработка `member.removed` для себя (закрыть доску с сообщением) в `frontend/src/features/board/use-board-socket.ts`
- [ ] T082 [P] [US4] `ConnectionBanner` «Нет связи — данные обновляются раз в минуту» в `frontend/src/components/kanban/connection-banner.tsx`
- [ ] T083 [US4] `useMoveTask`: оптимистичное перемещение, откат и toast со списком допустимых этапов при `STAGE_TRANSITION_FORBIDDEN`, перечитывание доски при 409 в `frontend/src/features/board/use-move-task.ts`
- [ ] T084 [US4] dnd-kit: `DndContext` + `SortableContext` для каждой колонки, перенос между колонками, вычисление `beforeId`/`afterId`, возврат карточки на место при отпускании вне колонки, управление с клавиатуры в `frontend/src/components/kanban/kanban-board.tsx`, `kanban-column.tsx`, `task-card.tsx`

**Checkpoint**: в двух окнах перемещение видно меньше чем за 2 с; запрещённые переходы
откатываются; при остановленном бэкенде показывается баннер.

---

## Phase 7: User Story 5 — Отмена и повтор перемещений (Priority: P2)

**Goal**: личные undo/redo на сервере (Command + `LinkedList`), 50 шагов, отказ при
конфликте (FR-018…020).

**Independent Test**: сценарии 10–11 из quickstart.md.

**Зависит от**: US4.

### Тесты ядра для User Story 5 (обязательны по принципу I) ⚠️

- [ ] T085 [P] [US5] Тест `CommandHistory`: push/undo/redo, сброс повторов после новой команды, лимит 50 (самая старая вытесняется), `NOTHING_TO_UNDO`/`NOTHING_TO_REDO`, при ошибке `undo()` команда удаляется из истории, сценарий SC-006 «10 команд → 10 отмен → исходное состояние» в `backend/src/core/patterns/command/command-history.spec.ts`
- [ ] T086 [P] [US5] Тест `MoveTaskCommand` с фейковым исполнителем: `undo` возвращает исходные этап и rank и передаёт `versionAfter` как `expectedVersion`; конфликт превращается в `ConflictException` в `backend/src/core/patterns/command/move-task.command.spec.ts`

### Implementation for User Story 5

- [ ] T087 [US5] `ICommand`, `MoveTaskCommand` (зависит от интерфейса `ITaskMover`, а не от сервиса) и `CommandHistory` поверх `LinkedList<ICommand>` (research.md R5) в `backend/src/core/patterns/command/command.interface.ts`, `move-task.command.ts`, `command-history.ts`, `index.ts`
- [ ] T088 [US5] Хранилище историй в `BoardsService`: `Map<userId:projectId, CommandHistory>` (общая для вкладок пользователя, переживает обновление страницы — FR-019), очистка неактивных через 2 ч по таймеру; явный `dispose()` останавливает таймер и вызывается из `onModuleDestroy` (принцип IV). Методы `undo`/`redo`/`historyState` в `backend/src/modules/boards/boards.service.ts`
- [ ] T089 [US5] Перенести выполнение перемещения в `MoveTaskCommand` через `BoardsService` (`TasksService` реализует `ITaskMover`); ответ `move` содержит `history`; эндпоинты `POST /projects/:id/board/undo` и `/redo` для PRODUCER/EDITOR/COLORIST в `backend/src/modules/boards/boards.controller.ts`, `backend/src/modules/tasks/tasks.service.ts`
- [ ] T090 [US5] Хук `useUndoRedo`: кнопки и сочетания Cmd/Ctrl+Z и Cmd/Ctrl+Shift+Z, неактивность по `history`, toast при отказе с перечитыванием доски в `frontend/src/features/board/use-undo-redo.ts`
- [ ] T091 [US5] Кнопки «Отменить» и «Повторить» в панели доски в `frontend/src/components/kanban/board-toolbar.tsx` и `frontend/src/app/projects/[id]/board/page.tsx`

**Checkpoint**: 3 перемещения → 3 отмены → исходная позиция; отмена после чужого
изменения отклоняется.

---

## Phase 8: User Story 6 — Заказчик в режиме просмотра (Priority: P2)

**Goal**: заказчик видит доску, но ничего не меняет ни через интерфейс, ни в обход
него (FR-011, SC-004).

**Independent Test**: сценарии 12–13 из quickstart.md.

**Зависит от**: US3. Серверная часть прав уже реализована в `ProjectRoleGuard` (T048) и в
ролях эндпоинтов (T063, T076, T089); здесь — интерфейс и проверка.

### Implementation for User Story 6

- [ ] T092 [P] [US6] Хук `usePermissions(myRole)` по матрице FR-011 (`canEditTasks`, `canDeleteTasks`, `canManageMembers`) в `frontend/src/features/projects/use-permissions.ts`
- [ ] T093 [US6] Режим только для чтения: для CLIENT отключить сенсоры dnd-kit, скрыть кнопки создания/редактирования/удаления и undo/redo, карточка открывается в режиме просмотра, вверху бейдж «Режим просмотра» в `frontend/src/components/kanban/kanban-board.tsx`, `task-card.tsx`, `task-dialog.tsx`, `board-toolbar.tsx`
- [ ] T094 [US6] e2e-тест бэкенда: для заказчика каждый изменяющий эндпоинт (tasks POST/PATCH/DELETE/move, board undo/redo, members) отвечает `403 ROLE_FORBIDDEN`, данные в БД не меняются в `backend/test/client-readonly.e2e-spec.ts`

**Checkpoint**: заказчик видит доску без элементов управления; все запросы в обход
интерфейса возвращают 403.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: интеграционные проверки, отчётные материалы, финальная сверка.

- [ ] T095 [P] e2e-тесты бэкенда для auth, projects и members (регистрация, `AUTH_EMAIL_TAKEN`, `LAST_PRODUCER`, `USER_NOT_FOUND`, доступ не участника) в `backend/test/auth.e2e-spec.ts`, `backend/test/projects.e2e-spec.ts`
- [ ] T096 [P] e2e-тест бэкенда: матрица переходов через API, конфликт версий, undo после чужого изменения в `backend/test/board.e2e-spec.ts`
- [ ] T097 [P] Seed-данные (Аня, Боря, Вика, проект «Клип», 10 задач в разных этапах) для демонстрации; флаг `--big` дополнительно создаёт проект с 200 задачами для замера SC-003 в `backend/prisma/seed.ts`
- [ ] T098 [P] Playwright: сценарии 7 (синхронизация в двух контекстах, < 2 с), 8, 10 и 12 из quickstart.md с сохранением скриншотов в `docs/screenshots/001/` в `frontend/e2e/board.spec.ts` и `frontend/playwright.config.ts`
- [ ] T099 [P] Перенести UML из `data-model.md` §2 и диаграмму последовательности из plan.md в отдельные файлы для отчёта в `docs/uml/core-classes.md` и `docs/sequence/move-task.md`
- [ ] T100 [P] Замеры: SC-003 — доска с 200 задачами (seed `--big`) открывается меньше чем за 2 с; SC-002 — 20 перемещений подряд, p95 подтверждения сервера меньше 1 с (замер в Playwright по времени ответа `/move`); результаты в `docs/report/001-performance.md`
- [ ] T101 Проверить, что во всех публичных классах `backend/src/core/**` есть JSDoc на русском и комментарий с названием паттерна, а в ядре нет `any`. Правило ESLint `no-restricted-imports` для `backend/src/core/**` запрещает `@nestjs/*`, `@prisma/*`, `socket.io` и `@/modules/*`, `@/infrastructure/*` в `eslint.config.mjs`
- [ ] T102 Пройти все 16 сценариев quickstart.md вручную и отметить результат в `docs/report/001-quickstart-results.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: зависимостей нет.
- **Foundational (Phase 2)**: после Setup. Блокирует все истории.
- **US1 → US2 → US3 → US4 → US5**: истории идут последовательно, каждая опирается на
  предыдущую: сессия → участники и права → задачи → перемещения → история перемещений.
- **US6**: после US3. Можно делать параллельно с US4 и US5, но T093 затрагивает файлы
  доски, поэтому удобнее после US5.
- **Polish (Phase 9)**: после всех историй.

### Within Each User Story

- Тест ядра → класс ядра → репозиторий → сервис → контроллер → хуки фронтенда → UI.
- Тест ядра (T012, T018, T020, T022, T054, T055, T058 (тест создателей), T069–T071, T085, T086) должен **падать**
  до реализации соответствующего класса.

### Parallel Opportunities

- Setup: T003, T004, T005, T006, T007, T009 — одновременно.
- Foundational: T010–T012, T015–T018, T020, T022, T027, T030–T032 — одновременно. Затем
  реализации ядра (T013, T019, T021, T023) — каждая после своего теста.
- Внутри истории задачи с [P] (shared-контракты, DTO, фронтовые хуки и компоненты) можно
  делать параллельно с бэкенд-сервисом.
- Polish: T095–T100 — одновременно.

---

## Parallel Example: User Story 4

```bash
# Сначала тесты ядра (все падают):
Task: "Тест StageIterator в backend/src/core/iterators/stage.iterator.spec.ts"
Task: "Тест State 6×6 в backend/src/core/patterns/state/task-stage.context.spec.ts"
Task: "Тест Observer в backend/src/core/patterns/observer/board-event-bus.spec.ts"

# Параллельно с бэкендом — фронтовые части без зависимостей:
Task: "Socket-клиент в frontend/src/lib/socket-client.ts"
Task: "ConnectionBanner в frontend/src/components/kanban/connection-banner.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 + Phase 2 → ядро исключений и коллекций с зелёными тестами.
2. US1 → US2 → US3 → **проверка**: рабочий трекер без перетаскивания.
3. US4 → **проверка**: полноценная канбан-доска с синхронизацией — это минимальный
   показ для преподавателя.
4. US5, US6 → полное покрытие спецификации.
5. Phase 9 → материалы для отчёта.

### Работа с ветками

- Вся разработка ведётся в ветке `develop` (см. `CLAUDE.md`).
- Коммит — после каждой задачи или логической группы, push — после каждой фазы.
- В `main` изменения попадают из `develop` через PR, только после тестирования.

---

## Notes

- [P] — разные файлы и нет зависимостей от незавершённых задач.
- Метка истории [USn] связывает задачу с историей из spec.md.
- Docker: движок Colima (`colima start`), стек поднимается `docker compose up --build`.
  Задачи ядра (тесты паттернов) от него не зависят.
- Strategy и Proxy в этом инкременте сознательно не реализуются (plan.md → Constitution
  Check, V).
