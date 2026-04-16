.PHONY: help db-up db-down migrate-up migrate-down migrate-create migrate-version dev build test lint sqlc run

# Default target
help:
	@echo "Available commands:"
	@echo "  make db-up          - Start MySQL database"
	@echo "  make db-down        - Stop MySQL database"
	@echo "  make migrate-up     - Run all pending migrations"
	@echo "  make migrate-down   - Rollback last migration"
	@echo "  make migrate-create - Create new migration (use NAME=migration_name)"
	@echo "  make migrate-version- Show current migration version"
	@echo "  make test           - Run Go tests"
	@echo "  make lint           - Run Go linter"

# Database
db-up:
	docker compose up -d

db-down:
	docker compose down

# Migrations
migrate-up:
	./migrate.sh up

migrate-down:
	./migrate.sh down

migrate-create:
	@if [ -z "$(NAME)" ]; then \
		echo "Usage: make migrate-create NAME=migration_name"; \
		exit 1; \
	fi
	./migrate.sh create $(NAME)

migrate-version:
	./migrate.sh version

# Testing and linting
test:
	go test ./...

lint:
	go fmt ./...
	go vet ./...

# SQLC
sqlc:
	sqlc generate

# Run
run:
	go run main.go
