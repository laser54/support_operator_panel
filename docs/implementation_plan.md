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
* [ ] Сделать API авторизации (JWT) `/auth/login`.
* [ ] Сделать CRUD API для справочников.

## Фаза 2: Фронтенд Ядро (Core UI)
* [ ] Настроить `TanStack Query` и `Axios` инстанс.
* [ ] Реализовать страницу Логина (сохранение токена).
* [ ] Создать Layout приложения (Sidebar/Header).
* [ ] Сверстать форму звонка (левая часть экрана) на `React Hook Form` + `zod`.

## Фаза 3: Интеграция Поиска (The "Wow" Factor)
* [ ] Backend: Прокси-эндпоинт `/search` к внешнему AI-сервису.
* [ ] Frontend: Компонент поиска (правая часть экрана).
* [ ] Frontend: Логика выбора ответа (копирование в форму).
* [ ] Frontend: Сабмит формы (сохранение звонка).

## Фаза 4: Админка и Деплой
* [ ] Дашборд с графиками (Recharts).
* [ ] Таблица истории звонков (TanStack Table).
* [ ] CI/CD: GitHub Actions для сборки Docker образов.
* [ ] Настройка VPS и Nginx.