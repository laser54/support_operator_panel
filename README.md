# Support Operator Panel

Веб-приложение для операторов контакт-центра с AI-поиском и аналитикой.

## 🚀 Быстрый старт

### Предварительные требования

- Docker Desktop (с включенной WSL 2 интеграцией)
- WSL 2 (Ubuntu или другой дистрибутив)
- Git

#### Настройка WSL (если используете Windows)

1. **Установите make в WSL**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y make
   ```

2. **Убедитесь, что Docker Desktop интегрирован с WSL**:
   - Откройте Docker Desktop
   - Settings → Resources → WSL Integration
   - Включите интеграцию для вашего дистрибутива WSL

3. **Проверьте Docker в WSL**:
   ```bash
   docker --version
   docker-compose --version
   ```

### Запуск проекта

**Для Git Bash (Windows):**

1. **Запустите все сервисы**:
   ```bash
   docker-compose up --build -d
   ```

2. **Примените миграции**:
   ```bash
   docker-compose exec backend uv run alembic upgrade head
   ```

3. **Создайте тестового пользователя**:
   ```bash
   docker-compose exec backend uv run python create_admin.py
   ```

4. **Проверьте работу**:
   - API Docs: http://localhost:8000/docs
   - Frontend: http://localhost:3001
   - Health check: http://localhost:8000/

**Тестовые данные:**
- Username: `admin`
- Password: `admin`

**Для WSL/Linux (если установлен make):**

1. **Запустите все сервисы**:
   ```bash
   make dev
   ```

2. **В новом терминале примените миграции**:
   ```bash
   docker-compose exec backend uv run alembic upgrade head
   ```

3. **Создайте админа**:
   ```bash
   docker-compose exec backend uv run python create_admin.py
   ```

## 📋 Доступные команды

```bash
make dev          # Запустить все сервисы с hot reload
make up           # Запустить в фоновом режиме
make down         # Остановить все сервисы
make db-migrate   # Применить миграции
make db-shell     # Подключиться к PostgreSQL
make lint         # Проверить код (ruff)
make lint-fix     # Исправить код автоматически
```

## 🧪 Тестирование API

### Через Swagger UI

1. Откройте http://localhost:8000/docs
2. Нажмите на `/api/v1/auth/login`
3. Нажмите "Try it out"
4. Введите:
   - username: `admin`
   - password: `admin`
5. Нажмите "Execute"
6. Скопируйте `access_token` из ответа
7. Нажмите "Authorize" вверху страницы
8. Вставьте токен в формате: `Bearer <your-token>`
9. Теперь можете тестировать защищенные эндпоинты

### Через curl

```bash
# Получить токен
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"

# Использовать токен
TOKEN="<your-token>"
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# Получить список регионов
curl -X GET "http://localhost:8000/api/v1/regions" \
  -H "Authorization: Bearer $TOKEN"
```

## ⚙️ Configuration & Environments

### Environment Variables (.env)

**Backend:**
Copy `.env.example` to `.env`:
```ini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/support_panel
SECRET_KEY=...
FRONTEND_URL=http://localhost:5173
```

**Frontend:**
Create `frontend/.env`:
```ini
VITE_API_URL=http://localhost:8888/api/v1
FRONTEND_URL=http://localhost:3001
```
For QA/Production, update `VITE_API_URL` accordingly.

### External Resources
- **External Knowledge Base**: Configured via `KNOWLEDGE_BASE_URL` in `.env`.
  - *Note: This is the source for the Q&A database.*
  - Do NOT hardcode this URL. Use environment variables if integration is needed.

## 📁 Структура проекта

```
support_operator_panel/
├── backend/          # FastAPI приложение
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Конфигурация и безопасность
│   │   ├── db/       # База данных
│   │   ├── models/   # SQLAlchemy модели
│   │   └── schemas/  # Pydantic схемы
│   └── alembic/      # Миграции
├── frontend/         # React приложение
│   └── src/
├── docs/             # Документация проекта
└── docker-compose.yml
```

## 🛠 Разработка

### Backend

```bash
cd backend

# Установить зависимости
uv sync

# Запустить локально (без Docker)
uv run uvicorn app.main:app --reload

# Создать новую миграцию
make db-revision msg="description"

# Линтинг
make lint
make lint-fix
```

### Frontend

```bash
cd frontend

# Установить зависимости
pnpm install

# Запустить dev server
pnpm dev

# Собрать для продакшена
pnpm build
```

## 📚 Документация

- [Masterplan](docs/masterplan.md) - Общее видение проекта
- [Tech Stack](docs/tech_stack.md) - Технологии и правила
- [App Flow](docs/app_flow.md) - Роли и страницы
- [Design Guidelines](docs/design_guidelines.md) - UI/UX правила

## 🔧 Troubleshooting

### Порт уже занят

Если порт 5432, 8000 или 5173 уже используется:

```bash
# Остановите существующие контейнеры
make down

# Или измените порты в docker-compose.yml
```

### База данных не подключается

```bash
# Проверьте статус контейнеров
docker-compose ps

# Посмотрите логи
docker-compose logs db
docker-compose logs backend
```

### Миграции не применяются

```bash
# Убедитесь, что база данных запущена
docker-compose ps

# Проверьте подключение
make db-shell

# Пересоздайте контейнеры
make down
make dev
```

## 📝 Статус разработки

- ✅ Phase 0: Инициализация
- ✅ Phase 1: Backend & Database
- 🔄 Phase 2: Frontend Core (в разработке)
- ⏳ Phase 3: Search Integration
- ⏳ Phase 4: Admin & Deploy

## 📄 Лицензия

MIT