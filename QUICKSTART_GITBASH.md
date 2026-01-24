# Support Operator Panel - Quick Start (Git Bash)

Если вы используете Git Bash на Windows, используйте команды напрямую:

## 🚀 Быстрый запуск

### 1. Запустите все сервисы:
```bash
docker-compose up --build
```

### 2. В новом терминале Git Bash примените миграции:
```bash
docker-compose exec backend uv run alembic upgrade head
```

### 3. Создайте тестового пользователя:
```bash
docker-compose exec db psql -U postgres -d support_panel -c "INSERT INTO users (username, email, hashed_password, role) VALUES ('admin', 'admin@example.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/1jrYK', 'admin') ON CONFLICT (username) DO NOTHING;"
```

### 4. Проверьте работу:
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173
- Логин: `admin` / `admin`

## 📋 Полезные команды

```bash
# Запустить сервисы
docker-compose up --build

# Запустить в фоне
docker-compose up -d

# Остановить
docker-compose down

# Посмотреть логи
docker-compose logs -f backend
docker-compose logs -f frontend

# Подключиться к БД
docker-compose exec db psql -U postgres -d support_panel

# Применить миграции
cd backend && uv run alembic upgrade head && cd ..

# Создать новую миграцию
cd backend && uv run alembic revision --autogenerate -m "description" && cd ..

# Линтинг
cd backend && uv run ruff check . && cd ..
```

## 🔧 Если хотите использовать Makefile

Установите `make` для Windows:
1. Скачайте: https://gnuwin32.sourceforge.net/packages/make.htm
2. Или используйте Chocolatey: `choco install make`
3. Или используйте WSL вместо Git Bash

Тогда сможете использовать команды `make dev`, `make down` и т.д.
