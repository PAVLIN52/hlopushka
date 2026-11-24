# Хлопушка

Канбан-трекер задач для видеопродакшна: проекты, этапы производства, задачи с исполнителями
и дедлайнами, перетаскивание карточек и синхронизация доски между участниками в реальном
времени.

Курсовой проект по дисциплине «Объектно-ориентированное программирование» (2 курс, ИСИТ).
Помимо работающего приложения проект демонстрирует ООП-принципы из лабораторных работ:
дженерики, собственную иерархию исключений, итераторы и паттерны проектирования. Всё это
собрано в отдельном ООП-ядре.

> **Статус:** в разработке. Готовы каркас, ООП-ядро общего назначения, схема БД,
> регистрация и вход. Следующий шаг — проекты и участники (инкремент 001).

## Возможности (инкремент 001)

- Регистрация и вход по email и паролю.
- Проекты с участниками и ролями: **продюсер**, **монтажёр**, **колорист**, **заказчик**
  (у заказчика доступ только на просмотр).
- Канбан-доска из шести этапов: Препродакшн → Съёмка → Монтаж → Цвет → Звук → Сдача.
- Задачи разных типов с исполнителем, дедлайном и приоритетом; просроченные выделяются.
- Перетаскивание карточек по правилам допустимых переходов между этапами.
- Отмена и повтор перемещений (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z).
- Синхронизация доски в реальном времени; без связи доска обновляется раз в минуту.

Дальше по плану: загрузка видео и плеер, комментарии с таймкодом и версии, уведомления,
обработка видео через FFmpeg (прокси, HLS, превью).

## Стек

| Часть | Технологии |
|---|---|
| Фронтенд | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, dnd-kit, TanStack Query |
| Бэкенд | NestJS 11, Prisma 6, PostgreSQL 16 |
| Real-time | Socket.IO |
| Язык | TypeScript (strict) везде |
| Тесты | Jest, Vitest, Playwright |
| Запуск | Docker Compose (на Mac — движок Colima) |

## ООП-ядро

Учебная часть лежит отдельно в [`backend/src/core`](backend/src/core) и не зависит ни от
NestJS, ни от Prisma, ни от остального приложения. Это проверяет ESLint.

| Что было в лабах | Как реализовано |
|---|---|
| Шаблоны классов | Дженерики: `LinkedList<T>`, `PriorityQueue<T>`, `IRepository<T>` |
| Обработка исключений | `CustomException` (сообщение, значение, код) и наследники `NotFound`, `Validation`, `AccessDenied`, `Conflict`, `Unauthorized`; в HTTP-ответы их переводит один глобальный фильтр |
| Умные указатели | В TypeScript их нет (сборщик мусора); ресурсы освобождаются через `try/finally`, `dispose()` и `onModuleDestroy` |
| Итераторы | Интерфейс `IIterator<T>` и реализации; выход за границы приводит к `CustomException` |
| Паттерны | Singleton (логгер), State (этапы задачи), Command (undo/redo), Observer (синхронизация доски), Factory Method (типы задач); позже Strategy и Proxy |

UML-диаграммы классов и диаграмма последовательности лежат в
[`specs/001-auth-projects-kanban/data-model.md`](specs/001-auth-projects-kanban/data-model.md)
и [`plan.md`](specs/001-auth-projects-kanban/plan.md).

## Быстрый старт

Нужны **Node.js 24+** и **Docker**. На Mac вместо Docker Desktop подойдёт Colima:

```bash
brew install colima docker docker-compose docker-buildx
colima start --cpu 2 --memory 3
```

Запуск всего приложения:

```bash
cp .env.example .env
docker compose up --build
```

- Фронтенд: http://localhost:3000
- API: http://localhost:4000/api

Остановка: `docker compose stop`. Освободить память Mac: `colima stop`.

### Режим разработки

В Docker остаётся только PostgreSQL, а приложение запускается на машине. Так изменения в коде
видны сразу, без пересборки образов.

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run build:shared
npm run prisma:deploy -w backend
npm run dev -w backend      # http://localhost:4000/api
npm run dev -w frontend     # http://localhost:3000
```

Демо-пользователи (Аня, Боря, Вика) создаются командой `npm run seed -w backend`.
Их email и общий пароль указаны в [`backend/prisma/seed.ts`](backend/prisma/seed.ts).

### Тесты и проверки

```bash
npm run test:core -w backend   # юнит-тесты ООП-ядра (без БД)
npm run lint                   # ESLint бэкенда и shared
npm run lint -w frontend       # ESLint фронтенда
```

## Структура репозитория

```text
├── backend/            NestJS
│   ├── prisma/         схема БД и миграции
│   └── src/
│       ├── core/       ООП-ядро: exceptions, collections, iterators, patterns
│       ├── infrastructure/  Prisma, Socket.IO, логгер
│       ├── common/     фильтры, guards, декораторы, pipes
│       └── modules/    auth, users, projects, boards, tasks
├── frontend/           Next.js (App Router)
├── shared/             общие типы и контракты API
├── docs/               материалы для отчёта (UML, скриншоты)
└── specs/              спецификации, планы и задачи по инкрементам
```

Правила структуры, именования и порядка кода закреплены в
[конституции проекта](.specify/memory/constitution.md).

## Как ведётся разработка

Проект разрабатывается по методике **Spec-Driven Development** с помощью
[Spec Kit](https://github.com/github/spec-kit). Каждый инкремент проходит путь
спецификация → план → задачи → реализация. Все артефакты лежат в [`specs/`](specs):

| Инкремент | Ветка | Содержание |
|---|---|---|
| 001 | `001-auth-projects-kanban` | Авторизация, проекты, канбан-доска |

Каждый инкремент разрабатывается в своей ветке и попадает в `main` через pull request.
