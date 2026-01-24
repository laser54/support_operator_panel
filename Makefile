.PHONY: dev build up down db-migrate db-revision db-shell lint lint-fix test

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

lint:
	cd backend && uv run ruff check .

lint-fix:
	cd backend && uv run ruff check --fix .

test:
	cd backend && uv run pytest
