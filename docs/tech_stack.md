# Tech Stack & Guidelines (Rules)

Строгие правила использования инструментов для поддержания качества кода и скорости разработки.

## 1. Backend (Python / FastAPI)
* **Package Manager:** Только **`uv`**.
    * Инсталл: `uv add fastapi`
    * Запуск: `uv run uvicorn ...`
* **Linting:** Только **`ruff`**. Конфиг в `pyproject.toml`.
* **Async:** Весь I/O (база, внешние API) должен быть асинхронным (`async def`).
* **Validation:** Pydantic v2. Строгая типизация везде.

## 2. Frontend (React)
* **Package Manager:** Только **`pnpm`**.
* **Data Fetching:** **TanStack Query (v5)**.
    * ⛔ Запрещено: Использовать `useEffect` для запросов данных.
    * ✅ Разрешено: `useQuery`, `useMutation`.
* **State:**
    * Server State -> TanStack Query.
    * Form State -> React Hook Form.
    * Global UI State -> Zustand (только если реально надо).
* **UI Kit:** **shadcn/ui** (на базе Radix UI + Tailwind).
    * Не пишем свои css-классы, используем утилиты Tailwind.

## 3. Workflow
* **Commits:** Conventional Commits (`feat: add login`, `fix: button color`).
* **Env Vars:** Используем `.env.example`. Локально — `Infisical` или `.env` (в gitignore).