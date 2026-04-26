# DBMS Proj

A Go-based database management system project built with MySQL, featuring a RESTful API, CLI tools, and web interface.

## Tech Stack

- **Language**: Go 1.25
- **Database**: MySQL 8.0
- **Router**: [chi](https://github.com/go-chi/chi)
- **Authentication**: JWT (golang-jwt)
- **SQL Generator**: [sqlc](https://github.com/sqlc-dev/sqlc)
- **Environment**: godotenv

## Project Structure

```
├── api/           # API handlers and routes
├── cli/           # CLI tools
├── cmd/           # Application entrypoints
│   ├── api/       # API server
│   └── cli/       # CLI entrypoint
├── db/            # Database utilities
├── internal/      # Internal packages
├── migrations/    # Database migrations
├── queries/       # SQL queries for sqlc
├── scripts/       # Utility scripts
└── web/           # Web frontend
```

## Getting Started

### Prerequisites

- Go 1.25+
- Docker & Docker Compose

### Setup

1. Clone the repository:
```bash
git clone https://github.com/mnah05/dbms-proj.git
cd dbms-proj
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Start the MySQL database:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
go run cmd/cli/main.go migrate
```

5. Start the API server:
```bash
go run cmd/api/main.go
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 3306 |
| DB_USER | Database user | app_user |
| DB_PASSWORD | Database password | app_pass |
| DB_NAME | Database name | app_db |
| MIGRATE_DEBUG | Enable migration debug logging | false |

## Development

### Generate SQL code with sqlc
```bash
sqlc generate
```

### Run tests
```bash
go test ./...
```

## License

MIT
