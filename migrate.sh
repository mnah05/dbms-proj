#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_URL="mysql://${DB_USER}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}"
MIGRATIONS_DIR="./migrations"

case "$1" in
    up)
        migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" up
        ;;
    down)
        migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" down 1
        ;;
    version)
        migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" version
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Usage: ./migrate.sh create <name>"
            exit 1
        fi
        migrate create -ext sql -dir "$MIGRATIONS_DIR" -seq -digits 6 "$2"
        ;;
    *)
        echo "Usage: ./migrate.sh {up|down|version|create <name>}"
        exit 1
        ;;
esac
