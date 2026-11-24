# Хлопушка

Канбан-трекер задач для видеопродакшна. Команда ведёт проект от препродакшна до сдачи:
задачи по этапам производства, исполнители и дедлайны, перетаскивание карточек и
мгновенная синхронизация доски между всеми участниками.

## Возможности

- **Проекты и команда.** Участники добавляются по email и получают роль: продюсер,
  монтажёр, колорист или заказчик. У заказчика доступ только на просмотр.
- **Доска по этапам производства:** Препродакшн → Съёмка → Монтаж → Цвет → Звук → Сдача.
- **Задачи** разных типов (съёмка, монтаж, цвет, звук, графика) с исполнителем, дедлайном и
  приоритетом. Просроченные задачи выделяются на доске.
- **Правила переходов.** Карточку нельзя отправить в «Сдачу», минуя цвет или звук, а вернуть
  на доработку можно на любой этап.
- **Отмена и повтор** перемещений: Ctrl/Cmd+Z и Ctrl/Cmd+Shift+Z.
- **Синхронизация в реальном времени.** Изменения видны всем участникам без обновления
  страницы. Если соединение пропало, доска обновляется раз в минуту.

## Стек

| Часть | Технологии |
|---|---|
| Фронтенд | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, dnd-kit, TanStack Query |
| Бэкенд | NestJS 11, Prisma 6, PostgreSQL 16 |
| Real-time | Socket.IO |
| Язык | TypeScript (strict) |
| Тесты | Jest, Vitest, Playwright |
| Инфраструктура | Docker Compose |

## Быстрый старт

Нужны **Node.js 24+** и **Docker**. На macOS вместо Docker Desktop подойдёт
[Colima](https://github.com/abiosoft/colima):

```bash
brew install colima docker docker-compose docker-buildx
colima start --cpu 2 --memory 3
```

Запуск:

```bash
cp .env.example .env
docker compose up --build
```

| Сервис | Адрес |
|---|---|
| Веб-приложение | http://localhost:3000 |
| API | http://localhost:4000/api |

Остановка: `docker compose stop`.

## Разработка

В Docker запускается только PostgreSQL, бэкенд и фронтенд работают локально с
горячей перезагрузкой:

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run build:shared
npm run prisma:deploy -w backend
npm run seed -w backend     # демо-пользователи
npm run dev -w backend      # http://localhost:4000/api
npm run dev -w frontend     # http://localhost:3000
```

Учётные данные демо-пользователей лежат в [`backend/prisma/seed.ts`](backend/prisma/seed.ts).

### Проверки

```bash
npm run test:core -w backend   # юнит-тесты доменного ядра
npm run lint                   # ESLint: backend и shared
npm run lint -w frontend       # ESLint: frontend
```

## Архитектура

```text
├── backend/                 NestJS API
│   ├── prisma/              схема БД, миграции, демо-данные
│   └── src/
│       ├── core/            доменное ядро без зависимостей от фреймворков
│       ├── infrastructure/  Prisma, Socket.IO, логирование
│       ├── common/          фильтры, guards, декораторы, pipes
│       └── modules/         auth, users, projects, boards, tasks
├── frontend/                Next.js (App Router)
├── shared/                  общие типы и контракты API
└── specs/                   спецификации, планы и контракты API
```

**Доменное ядро** (`backend/src/core`) содержит бизнес-правила и базовые абстракции и не
зависит от NestJS, Prisma или транспорта. Это ограничение проверяет ESLint.

- **Ошибки.** `CustomException` с кодом и значением и его наследники (`NotFound`,
  `Validation`, `AccessDenied`, `Conflict`, `Unauthorized`). Глобальный фильтр переводит их в
  ответы `{ code, message, value }`.
- **Коллекции и итераторы.** Обобщённые `LinkedList<T>` и `PriorityQueue<T>`, интерфейсы
  `IIterator<T>` и `IRepository<T>`.
- **Паттерны:**
  - State — правила переходов между этапами;
  - Command — история отмены и повтора;
  - Observer — рассылка изменений доски;
  - Factory Method — типы задач;
  - Singleton — журнал приложения.

**Авторизация.** Пароли хешируются argon2id. Сессия хранится в httpOnly-cookie:
короткоживущий access-токен и одноразовый refresh-токен с ротацией. Если отозванный
refresh-токен предъявят повторно, все сессии пользователя отзываются.

Подробные спецификации, модель данных с UML-диаграммами и контракты REST и WebSocket лежат в
[`specs/`](specs). Правила структуры кода и именования — в
[`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Работа с репозиторием

- Каждая фича разрабатывается в отдельной ветке и попадает в `main` через pull request.
- Сообщения коммитов — короткие фразы на английском в повелительном наклонении.
