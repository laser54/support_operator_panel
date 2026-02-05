# Deployment Guide / Руководство по деплою

## 🚀 Architecture / Архитектура

```
Local Development                    Production (VPS)
───────────────────                  ─────────────────────────────
┌─────────────────┐                  ┌─────────────────────────────┐
│ docker-compose  │   git push      │        /opt/rag-stack       │
│     .yml        │ ─────────────►  │                             │
│ (dev services)  │   to main       │  ┌─────────────────────────┐│
└─────────────────┘                  │  │      Traefik            ││
                                     │  │  (reverse proxy + TLS)  ││
                                     │  └──────────┬──────────────┘│
                                     │             │               │
                                     │  ┌──────────▼──────────────┐│
                                     │  │ support-panel-frontend  ││
                                     │  │   (nginx + SPA)         ││
                                     │  └─────────────────────────┘│
                                     │             │               │
                                     │  ┌──────────▼──────────────┐│
                                     │  │ support-panel-backend   ││
                                     │  │   (FastAPI + uv)        ││
                                     │  └──────────┬──────────────┘│
                                     │             │               │
                                     │  ┌──────────▼──────────────┐│
                                     │  │  support-panel-db       ││
                                     │  │    (PostgreSQL)         ││
                                     │  └─────────────────────────┘│
                                     └─────────────────────────────┘
```

## 📋 Setup Checklist / Чеклист настройки

### 1️⃣ GitHub Repository Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKERHUB_USERNAME` | `la5er` | Your Docker Hub username |
| `DOCKERHUB_PASSWORD` | `<your-token>` | Docker Hub access token (не пароль!) |
| `HOST2` | `<your-vps-ip>` | IP адрес VPS |
| `USER` | `root` | SSH username |
| `SSH_PRIVATE_KEY2` | `<private-key>` | Содержимое приватного SSH ключа |
| `SSH_PORT2` | `22` | SSH port (обычно 22) |

> **Docker Hub Token:** Settings → Security → New Access Token

### 2️⃣ VPS Configuration / Настройка VPS

#### A. Создать override файл на VPS

Скопируйте `docker-compose.prod.yml` на сервер как отдельный override файл:

```bash
# Вариант 1: через scp
scp docker-compose.prod.yml root@your-vps:/opt/rag-stack/docker-compose.support-panel.yml

# Вариант 2: вручную создать на сервере
ssh root@your-vps-ip
cd /opt/rag-stack
nano docker-compose.support-panel.yml
# вставить содержимое docker-compose.prod.yml
```

> ⚠️ **ВАЖНО:** Файл должен называться `docker-compose.support-panel.yml` (не docker-compose.prod.yml)

#### B. Environment Variables on VPS

Добавьте в `/opt/rag-stack/.env`:

```bash
# Support Panel
POSTGRES_PASSWORD=your-secure-password-here
SUPPORT_PANEL_SECRET_KEY=your-very-long-random-secret-key-min-32-chars
```

⚠️ **ВАЖНО:** Сгенерируйте безопасный SECRET_KEY:
```bash
openssl rand -hex 32
```

#### C. DNS Configuration / Настройка DNS

Добавьте A-запись для вашего домена:

| Type | Name | Value |
|------|------|-------|
| A | support | `<your-vps-ip>` |

Результат: `support.larin.work` → `<vps-ip>`

### 3️⃣ Initial Deployment / Первый деплой

После настройки, сделайте первый деплой вручную на VPS:

```bash
cd /opt/rag-stack

# Убедитесь что сеть существует
docker network create rag-stack_internal 2>/dev/null || true

# Используем override файл
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.support-panel.yml"

# Поднимите сервисы
docker compose $COMPOSE_FILES up -d support-panel-frontend support-panel-backend support-panel-db

# Дождитесь запуска БД
sleep 10

# Выполните миграции
docker compose $COMPOSE_FILES exec support-panel-backend uv run alembic upgrade head

# Проверьте статус
docker ps | grep support-panel
```

### 4️⃣ Verify Deployment / Проверка

После успешного деплоя проверьте:

1. **Frontend:** https://support.larin.work
2. **API Health:** https://support.larin.work/api/v1/health
3. **API Docs:** https://support.larin.work/api/v1/docs (если включено)

---

## 🔄 How It Works / Как это работает

1. **Push to main** → GitHub Actions триггерится
2. **Build Job:**
   - Checkout code
   - Login to Docker Hub
   - Build frontend image → push `la5er/support-panel-frontend:latest`
   - Build backend image → push `la5er/support-panel-backend:latest`
3. **Deploy Job:**
   - SSH в VPS
   - `cd /opt/rag-stack`
   - Использует два compose файла: `docker-compose.yml` + `docker-compose.support-panel.yml`
   - `docker compose pull` - скачивает новые образы
   - `docker compose up -d` - перезапускает сервисы
   - `alembic upgrade head` - применяет миграции

---

## 🛠 Troubleshooting / Решение проблем

### Logs / Логи
```bash
cd /opt/rag-stack
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.support-panel.yml"

# Все логи
docker compose $COMPOSE_FILES logs -f support-panel-backend

# Только ошибки
docker compose $COMPOSE_FILES logs support-panel-backend 2>&1 | grep -i error
```

### Restart Services / Перезапуск
```bash
docker compose $COMPOSE_FILES restart support-panel-backend support-panel-frontend
```

### Database Access / Доступ к БД
```bash
docker compose $COMPOSE_FILES exec support-panel-db psql -U postgres -d support_panel
```

### Force Rebuild / Принудительная пересборка
```bash
docker compose $COMPOSE_FILES pull support-panel-frontend support-panel-backend
docker compose $COMPOSE_FILES up -d --force-recreate support-panel-frontend support-panel-backend
```

### YAML Errors / Ошибки YAML
Если видите ошибку `mapping key "services" already defined`:
- Убедитесь что используете override файл (`docker-compose.support-panel.yml`)
- НЕ добавляйте содержимое в основной `docker-compose.yml` напрямую
- Используйте флаг `-f` для обоих файлов

---

## 📁 Files / Файлы проекта

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Production Docker image for FastAPI |
| `frontend/Dockerfile` | Production Docker image for Vite (nginx) |
| `frontend/nginx.conf` | Nginx config for SPA |
| `docker-compose.prod.yml` | Override файл для VPS (копируется как `docker-compose.support-panel.yml`) |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD workflow |
| `docs/DEPLOYMENT.md` | Это руководство |
