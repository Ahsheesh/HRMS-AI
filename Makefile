.PHONY: start stop build clean seed logs help

help:
	@echo "HRMS Demo - Available commands:"
	@echo "  make start    - Start all services (MongoDB, API, AI service)"
	@echo "  make stop     - Stop all services"
	@echo "  make build    - Build all Docker images"
	@echo "  make clean    - Remove all containers and volumes"
	@echo "  make seed     - Seed database with demo data"
	@echo "  make logs     - Show logs for all services"

start:
	docker compose up -d
	@echo "✓ Services started. API: http://localhost:4000 | AI: http://localhost:8001 | UI: http://localhost:5173"

stop:
	docker compose down

build:
	docker compose build

clean:
	docker compose down -v
	@echo "✓ All containers and volumes removed"

seed:
	@echo "Seeding database..."
	docker compose exec api npm run seed

logs:
	docker compose logs -f