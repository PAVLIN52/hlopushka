# CLAUDE.md

Правила работы в репозитории «Хлопушки» для Claude Code.

## Ветки

- **Вся разработка ведётся в ветке `develop`.** Новые коммиты делаются только в неё.
- **`main` — чистая ветка.** Изменения попадают в `main` только из `develop`, после
  тестирования, через pull request `develop → main`. Напрямую в `main` ничего не
  коммитить и не пушить.
- Перед PR в `main` должны пройти:
  - юнит-тесты (`npm run test:core -w backend`, `npm run test:unit -w backend`);
  - e2e-тесты бэкенда на отдельной базе `hlopushka_test` (`npm run test:e2e -w backend`,
    нужен запущенный Postgres);
  - линтеры (`npm run lint`, `npm run lint -w frontend`);
  - сборка (`npm run build`);
  - ручная проверка сценариев из `specs/<фича>/quickstart.md`.
- Историю `main` и `develop` не переписывать. Force push и удаление этих веток запрещены
  правилами на GitHub.
- Не переключать ветки, пока запущены dev-серверы: watch-режим упадёт на пропавших файлах.

## Коммиты

- Сообщение — короткая фраза на английском в повелительном наклонении, например
  `Add project members management`. Без префиксов `docs:`/`feat:`, номеров фич, ссылок на
  `/speckit-*` и перечислений через `;`. Подробности — пунктами в теле коммита.
- Без строк `Co-Authored-By` и любой другой атрибуции Claude — ни в коммитах, ни в PR.
- Автор коммитов — `175749181+PAVLIN52@users.noreply.github.com` (задано в локальном
  `git config` репозитория). Личную почту в историю не допускать.

## Публичные тексты

- Репозиторий публичный. README — описание продукта: без упоминаний учёбы, статуса и
  «следующих шагов», без инструкций по локальному запуску (до выкладки на сервер).
- Не коммитить `.env`, ключи и любые реальные секреты.

## Процесс

- Фичи ведутся по Spec Kit: `specs/NNN-название/` → spec, plan, tasks, implement.
- Правила кода и структуры — в [`.specify/memory/constitution.md`](.specify/memory/constitution.md);
  они обязательны.
- Документация, комментарии в ядре и общение — на русском.

## Локальный запуск (для разработки)

```bash
colima start                       # движок Docker на macOS
docker compose up -d postgres
npm run build:shared
npm run dev -w backend             # http://localhost:4000/api
npm run dev -w frontend            # http://localhost:3000
```

Демо-пользователи: `npm run seed -w backend` (данные в `backend/prisma/seed.ts`).
