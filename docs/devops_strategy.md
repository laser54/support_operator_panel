# DevOps Strategy

## 1. Локальная разработка (Local)
* **Инструмент:** Docker Compose.
* **Запуск:** `make dev` (поднимает БД, Бэк, Фронт).
* **Особенность:** Hot Reload включен для всего. Frontend проброшен через Volume.
* **Secrets:** Используем `.env` (в gitignore) на основе `.env.example`.

## 2. CI/CD (GitHub Actions)
* **Trigger:** Push to `main`.
* **Build:** Сборка оптимизированных Docker-образов (multi-stage).
    * Frontend собирается в статику и кладется в Nginx-контейнер.
    * Backend собирается через `uv` (без dev-зависимостей).
* **Registry:** GitHub Container Registry (GHCR).

## 3. Production (VPS)
* **OS:** Ubuntu LTS.
* **Server:** Nginx (Reverse Proxy + SSL Let's Encrypt).
* **Deploy:** Pull образов из GHCR и перезапуск `docker compose up -d`.

## Makefile (Commands)
```makefile
dev:
	docker-compose up --build
down:
	docker-compose down
db-shell:
	docker-compose exec db psql -U postgres -d app
lint:
	cd backend && uv run ruff check .