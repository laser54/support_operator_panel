# Support Operator Panel

<div align="center">

![Support Operator](https://img.shields.io/badge/Support_Operator-Contact_Center-D4F62F?style=for-the-badge&logoColor=black)

**Умная веб-панель для операторов контакт-центра. Создана как помощник, а не инструмент контроля!**
Фокус на максимальном удобстве интерфейса (минимальная когнитивная нагрузка) и мощных AI-алгоритмах поиска по базе скриптов.


[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## ✨ Возможности

<table>
<tr>
<td width="50%">

### 🎯 Удобство для операторов
- **Продуманный UX/UI** — чистый интерфейс, где форма звонка и подсказки интегрированы в одно рабочее окно
- **Умный AI-поиск** — интеллектуальный поиск нужных скриптов и руководств по ключевым словам или смыслу за секунду
- **Автоматизация рутины** — таймер звонка запускается сам, а шаблоны подсказывают готовые ответы
- **Топ актуальных вопросов** — всегда под рукой статистика по частым проблемам клиентов
- **Горячие клавиши** — управление без мышки: `Ctrl+Enter` сохранить, `Ctrl+S` поиск по базе

</td>
<td width="50%">

### 📊 Для руководителей
- **Аналитический дашборд** — KPI, графики, статистика
- **История звонков** — поиск, фильтры, редактирование
- **Управление пользователями** — роли, временные права
- **Справочники** — регионы, отделы, типы звонков
- **Ревью скриптов** — модерация предложений операторов

</td>
</tr>
</table>

---

## 🛠 Технологический стек

<table>
<tr>
<td align="center" width="25%">

**Frontend**

![React](https://img.shields.io/badge/-React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TanStack Query](https://img.shields.io/badge/-TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Tailwind](https://img.shields.io/badge/-Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/-shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white)

</td>
<td align="center" width="25%">

**Backend**

![FastAPI](https://img.shields.io/badge/-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/-Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![Pydantic](https://img.shields.io/badge/-Pydantic_v2-E92063?style=flat-square&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

</td>
<td align="center" width="25%">

**Database**

![PostgreSQL](https://img.shields.io/badge/-PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Alembic](https://img.shields.io/badge/-Alembic-6BA81E?style=flat-square&logo=alembic&logoColor=white)

</td>
<td align="center" width="25%">

**DevOps**

![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Nginx](https://img.shields.io/badge/-Nginx-009639?style=flat-square&logo=nginx&logoColor=white)

</td>
</tr>
</table>

---

## 🚀 Быстрый старт

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) с WSL 2 (для Windows)
- Git

### Запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/laser54/support_operator_panel.git
cd support_operator_panel

# 2. Запустить все сервисы
docker-compose up --build -d

# 3. Применить миграции
docker-compose exec backend uv run alembic upgrade head

# 4. Создать администратора
docker-compose exec backend uv run python create_admin.py

# 5. (Опционально) Загрузить тестовые данные
docker-compose exec backend uv run python load_fixtures.py
```

### Доступ

| Сервис | URL |
|--------|-----|
| 🌐 Frontend | http://localhost:3001 |
| 📚 API Docs | http://localhost:8000/docs |
| 🔧 API Health | http://localhost:8000/ |

**Тестовый вход:**
```
Username: admin
Password: admin
```

---

## 📁 Структура проекта

```
support_operator_panel/
├── 📂 backend/                 # FastAPI приложение
│   ├── 📂 app/
│   │   ├── 📂 api/v1/          # REST API endpoints
│   │   │   ├── auth.py         # Аутентификация (JWT)
│   │   │   ├── calls.py        # CRUD звонков
│   │   │   ├── users.py        # Управление пользователями
│   │   │   ├── scripts.py      # Скрипты и ревью
│   │   │   ├── search.py       # AI-поиск по базе знаний
│   │   │   └── ...             # Справочники
│   │   ├── 📂 models/          # SQLAlchemy ORM модели
│   │   ├── 📂 schemas/         # Pydantic валидация
│   │   ├── 📂 services/        # Бизнес-логика
│   │   └── 📂 core/            # Конфигурация, безопасность
│   ├── 📂 alembic/             # Миграции БД
│   └── 📂 fixtures/            # Тестовые данные
│
├── 📂 frontend/                # React SPA
│   └── 📂 src/
│       ├── 📂 pages/           # Страницы приложения
│       │   ├── HomePage.tsx    # Рабочее место оператора
│       │   ├── HistoryPage.tsx # История звонков
│       │   ├── DashboardPage.tsx # Аналитика
│       │   ├── UsersPage.tsx   # Управление пользователями
│       │   └── ...
│       ├── 📂 components/      # React компоненты
│       │   ├── OperatorForm.tsx    # Форма звонка
│       │   ├── KnowledgePanel.tsx  # Панель базы знаний
│       │   ├── 📂 ui/              # shadcn/ui компоненты
│       │   └── 📂 layout/          # Layout компоненты
│       ├── 📂 api/             # Axios клиент
│       └── 📂 hooks/           # Custom React hooks
│
├── 📂 docs/                    # Документация
├── 📂 .github/workflows/       # CI/CD
└── docker-compose.yml          # Docker конфигурация
```

---

## 👥 Роли и права

| Роль | Описание | Доступ |
|------|----------|--------|
| **Operator** | Оператор контакт-центра | Звонки, история (свои), поиск |
| **Supervisor** | Руководитель группы | + Дашборд, ревью скриптов, все звонки |
| **Admin** | Администратор | + Пользователи, справочники |

> 💡 Поддерживаются **временные роли** — можно выдать повышенные права на определённый срок

---

## ⌨️ Горячие клавиши

| Комбинация | Действие |
|------------|----------|
| `Ctrl + Enter` | Сохранить звонок |
| `Ctrl + S` | Фокус на поиск в базе знаний |
| `Escape` | Очистить форму (с подтверждением) |

---

## 🔧 Команды разработки

### Make (WSL/Linux)

```bash
make dev          # Запустить с hot reload
make up           # Запустить в фоне
make down         # Остановить
make db-migrate   # Применить миграции
make db-shell     # Подключиться к PostgreSQL
make lint         # Проверить код
make lint-fix     # Автоисправление
```

### Docker (любая ОС)

```bash
docker-compose up --build -d          # Запустить
docker-compose down                   # Остановить
docker-compose logs -f backend        # Логи бэкенда
docker-compose exec backend uv run alembic upgrade head  # Миграции
```

### Локальная разработка

**Backend:**
```bash
cd backend
uv sync                                    # Установить зависимости
uv run uvicorn app.main:app --reload       # Запустить dev server
uv run alembic revision --autogenerate -m "msg"  # Создать миграцию
```

**Frontend:**
```bash
cd frontend
pnpm install        # Установить зависимости
pnpm dev            # Запустить dev server
pnpm build          # Сборка для продакшена
pnpm lint           # Проверка ESLint
```

---

## ⚙️ Конфигурация

### Backend (.env)

```ini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/support_panel
SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:3001
KNOWLEDGE_BASE_URL=https://your-kb-api.com
KNOWLEDGE_BASE_PASSWORD=secret
```

### Frontend (frontend/.env)

```ini
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 📊 API Endpoints

<details>
<summary><b>Развернуть полный список</b></summary>

| Method | Endpoint | Описание | Роль |
|--------|----------|----------|------|
| `POST` | `/api/v1/auth/login` | Вход | Все |
| `GET` | `/api/v1/auth/me` | Текущий пользователь | Все |
| `GET` | `/api/v1/calls` | Список звонков | Все* |
| `POST` | `/api/v1/calls` | Создать звонок | Все |
| `PATCH` | `/api/v1/calls/{id}` | Редактировать звонок | Все* |
| `GET` | `/api/v1/search` | Поиск в базе знаний | Все |
| `GET` | `/api/v1/scripts/top-questions` | Топ вопросов | Все |
| `GET` | `/api/v1/scripts/review` | Скрипты на ревью | Admin/Supervisor |
| `GET` | `/api/v1/users` | Список пользователей | Admin |
| `POST` | `/api/v1/users` | Создать пользователя | Admin |
| `GET` | `/api/v1/regions` | Регионы | Все |
| `GET` | `/api/v1/departments` | Отделы | Все |
| `GET` | `/api/v1/call-types` | Типы звонков | Все |
| `GET` | `/api/v1/call-resolutions` | Резолюции | Все |

_* Операторы видят только свои звонки_

</details>

---

## 🐛 Troubleshooting

<details>
<summary><b>Порт занят</b></summary>

```bash
# Остановить все контейнеры
docker-compose down

# Или найти процесс
netstat -ano | findstr :8000
```
</details>

<details>
<summary><b>База данных не подключается</b></summary>

```bash
# Проверить статус
docker-compose ps

# Посмотреть логи
docker-compose logs db
docker-compose logs backend

# Пересоздать контейнеры
docker-compose down -v
docker-compose up --build -d
```
</details>

<details>
<summary><b>Миграции не применяются</b></summary>

```bash
# Убедиться что БД запущена
docker-compose ps

# Применить миграции вручную
docker-compose exec backend uv run alembic upgrade head

# Проверить текущую версию
docker-compose exec backend uv run alembic current
```
</details>

---

## 📚 Документация

- [Masterplan](docs/masterplan.md) — Видение проекта
- [Tech Stack](docs/tech_stack.md) — Технологии и правила
- [App Flow](docs/app_flow.md) — Роли и страницы
- [Design Guidelines](docs/design_guidelines.md) — UI/UX гайдлайны
- [DevOps Strategy](docs/devops_strategy.md) — CI/CD и деплой

---

## 📈 Статус разработки

- [x] ~~Phase 0: Инициализация~~
- [x] ~~Phase 1: Backend & Database~~
- [x] ~~Phase 2: Frontend Core~~
- [x] ~~Phase 3: Search Integration~~
- [x] ~~Phase 4: Dashboard & Analytics~~
- [ ] Phase 5: Production Deploy

---

<div align="center">

**Made with ❤️ for Support operator Contact Center**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>


