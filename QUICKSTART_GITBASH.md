# Support Operator Panel - Quick Start (Git Bash)

Если вы используете Git Bash на Windows, используйте команды напрямую:

## 🚀 Быстрый запуск

### Вариант 1: Автоматический запуск (рекомендуется)
```bash
./start.sh
```
Или на Windows:
```cmd
start.bat
```

### Вариант 2: Ручной запуск

#### 1. Запустите все сервисы:
```bash
docker-compose up --build
```

#### 2. В новом терминале примените миграции:
```bash
docker-compose exec backend uv run alembic upgrade head
```

#### 3. Загрузите тестовые данные (фикстуры):
```bash
docker-compose exec backend uv run python load_fixtures.py
```

#### 4. Проверьте работу:
- API Docs: http://localhost:8888/docs
- Frontend: http://localhost:3001

## 🔑 Тестовые учётные записи

| Логин | Пароль | Роль |
|-------|--------|------|
| `admin` | `admin` | Администратор |
| `supervisor` | `supervisor123` | Супервизор (админ) |
| `operator1` | `operator123` | Оператор |
| `operator2` | `operator123` | Оператор |
| `operator3` | `operator123` | Оператор |

## 📦 Тестовые данные (фикстуры)

При запуске `load_fixtures.py` загружаются:
- **Пользователи**: админ, супервизор, 3 оператора
- **Регионы**: 15 городов Казахстана (Алматы, Астана, Шымкент и др.)
- **Департаменты**: отделы по регионам (Контакт-центр, Отдел продаж и т.д.)
- **Скрипты**: примеры вопросов и ответов для базы знаний

### Поведение в зависимости от окружения

| APP_ENV | Поведение |
|---------|-----------|
| `development` (по умолчанию) | **Автоматическая очистка БД** + загрузка фикстур |
| `production` | ❌ **Заблокировано** - фикстуры нельзя запустить |

В development режиме при каждом запуске `load_fixtures.py`:
1. ✅ Удаляются все существующие данные (users, regions, departments, scripts)
2. ✅ Загружаются свежие тестовые данные

Это гарантирует чистую БД при каждом локальном запуске!

### Опции запуска фикстур
```bash
# По умолчанию в dev: очистка + загрузка
docker-compose exec backend uv run python load_fixtures.py

# Добавить только недостающие данные (без очистки)
docker-compose exec backend uv run python load_fixtures.py --no-force
```

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
docker-compose exec backend uv run alembic upgrade head

# Загрузить фикстуры
docker-compose exec backend uv run python load_fixtures.py

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

Тогда сможете использовать команды:
```bash
make dev           # Запуск с пересборкой
make up            # Запуск в фоне
make down          # Остановка
make fixtures      # Загрузка фикстур
make fixtures-force # Перезагрузка фикстур (с удалением)
make setup         # Миграции + фикстуры
```
