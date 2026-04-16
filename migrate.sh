#!/bin/bash
set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env
if [ -f .env ]; then
    # More robust .env loading that handles spaces and special characters
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
else
    echo "Error: .env file not found in $(pwd)" >&2
    exit 1
fi

# Check required environment variables
required_vars=("DB_USER" "DB_PASSWORD" "DB_HOST" "DB_PORT" "DB_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set" >&2
        exit 1
    fi
done

DB_URL="mysql://${DB_USER}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?multiStatements=true&parseTime=true"
MIGRATIONS_DIR="./migrations"

# Check if migrate command is available
if ! command -v migrate &> /dev/null; then
    echo "Error: 'migrate' command not found. Install with:" >&2
    echo "  go install -tags 'mysql' github.com/golang-migrate/migrate/v4/cmd/migrate@latest" >&2
    exit 1
fi

# Debug output (can be disabled)
# Support both MIGRATE_DEBUG=1 and MIGRATE_DEBUG=true
if [ "${MIGRATE_DEBUG:-0}" = "1" ] || [ "${MIGRATE_DEBUG:-false}" = "true" ]; then
    echo "Script directory: $SCRIPT_DIR"
    echo "DB_URL: $DB_URL"
    echo "Migrations dir: $MIGRATIONS_DIR"
fi

case "$1" in
    up)
        echo "Applying migrations..."
        migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" up
        ;;
    down)
        echo "Rolling back last migration..."
        migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" down 1
        ;;
    version)
        migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" version
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Usage: $0 create <migration_name>"
            exit 1
        fi
        migrate create -ext sql -dir "$MIGRATIONS_DIR" -seq -digits 6 "$2"
        echo "Created migration: $MIGRATIONS_DIR/$(ls -1t "$MIGRATIONS_DIR" | head -1)"
        ;;
    help|--help|-h)
        echo "Usage: $0 {up|down|version|create <name>|help}"
        echo ""
        echo "Commands:"
        echo "  up              Apply all pending migrations"
        echo "  down            Roll back the last migration"
        echo "  version         Show current migration version"
        echo "  create <name>   Create new migration files"
        echo "  help            Show this help message"
        echo ""
        echo "Environment variables are loaded from .env file"
        echo "Set MIGRATE_DEBUG=1 for debug output"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
