.PHONY: dev build up down db-migrate db-revision db-shell lint lint-fix test fixtures fixtures-safe setup

dev:
	docker-compose up --build

up:
	docker-compose up -d

down:
	docker-compose down

db-migrate:
	docker-compose exec backend uv run alembic upgrade head

db-revision:
	cd backend && uv run alembic revision --autogenerate -m "$(msg)"

db-shell:
	docker-compose exec db psql -U postgres -d support_panel

# Загрузка фикстур (в dev режиме автоматически очищает БД)
fixtures:
	docker-compose exec backend uv run python load_fixtures.py

# Загрузка фикстур БЕЗ очистки (добавить только недостающие данные)
fixtures-safe:
	docker-compose exec backend uv run python load_fixtures.py --no-force

# Полная настройка: миграции + фикстуры
setup: db-migrate fixtures

lint:
	cd backend && uv run ruff check .

lint-fix:
	cd backend && uv run ruff check --fix .

test:
	cd backend && uv run pytest
