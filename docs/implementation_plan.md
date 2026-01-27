# Implementation Plan

Этапы разработки с фокусом на минимальное количество багов и быстрый MVP.

## Фаза 0: Инициализация (Setup)
* [ ] Создать структуру Monorepo.
* [ ] Настроить **Backend**: `uv init`, `FastAPI`, `Ruff`.
* [ ] Настроить **Frontend**: `pnpm create vite`, `Tailwind`, `shadcn/ui`.
* [ ] Настроить **Docker Compose** для локальной разработки (Hot Reload).
* [ ] Настроить **Makefile** для управления одной командой.

## Фаза 1: Бэкенд и База (Skeleton)
* [ ] Поднять PostgreSQL в Docker.
* [ ] Настроить SQLAlchemy + Alembic (миграции).
* [ ] Реализовать модели: `User`, `Region`, `Department`.
* [ ] Сделать API авторизации (JWT) `/auth/login` (Port: 8888).
* [ ] Сделать CRUD API для справочников.

## Фаза 2: Фронтенд Ядро (Core UI)
* [x] Настроить `TanStack Query` и `Axios` инстанс.
* [x] Реализовать страницу Логина (сохранение токена).
* [x] Создать Layout приложения (Sidebar/Header).
* [x] Сверстать форму звонка (левая часть экрана) на `React Hook Form` + `zod`.

## Фаза 3: Интеграция Поиска (The "Wow" Factor)
* [x] Backend: Прокси-эндпоинт `/search` к внешнему AI-сервису.
* [x] Frontend: Компонент поиска (правая часть экрана).
* [x] Frontend: Логика выбора ответа (копирование в форму).
* [x] Frontend: Сабмит формы (сохранение звонка).

## Фаза 4: Админка и Деплой
* [x] Дашборд с графиками (Recharts).
* [x] Таблица истории звонков (TanStack Table).
* [ ] CI/CD: GitHub Actions для сборки Docker образов.
* [ ] Настройка VPS и Nginx.