.PHONY: dev build up down

dev:
	docker-compose -f docker-compose.dev.yml up --build

build:
	docker-compose -f docker-compose.prod.yml build

up:
	docker-compose -f docker-compose.prod.yml up -d

down:
	docker-compose -f docker-compose.prod.yml down
