package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"dbms-proj/db"
	"dbms-proj/middleware"

	_ "github.com/go-sql-driver/mysql"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

var (
	dbConn  *sql.DB
	queries *db.Queries
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	_ = godotenv.Load()

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=UTC",
		env("DB_USER", "app_user"),
		env("DB_PASSWORD", "app_pass"),
		env("DB_HOST", "localhost"),
		env("DB_PORT", "3306"),
		env("DB_NAME", "app_db"),
	)

	var err error
	dbConn, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbConn.Close()

	// Configure connection pool
	dbConn.SetMaxOpenConns(25)
	dbConn.SetMaxIdleConns(5)
	dbConn.SetConnMaxLifetime(5 * time.Minute)

	if err := dbConn.Ping(); err != nil {
		log.Fatalf("Database unreachable: %v", err)
	}

	queries = db.New(dbConn)

	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(chimiddleware.AllowContentType("application/json"))
	r.Use(chimiddleware.SetHeader("Content-Type", "application/json"))

	// Public routes
	r.Post("/api/register", RegisterHandler)
	r.Post("/api/login", CustomerLoginHandler)
	r.Post("/api/admin/login", AdminLoginHandler)
	r.Get("/api/rooms", ListAvailableRoomsHandler)

	// Protected customer routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Get("/api/my-reservations", GetMyReservationsHandler)
		r.Post("/api/reservations", CreateReservationHandler)
		r.Post("/api/reservations/{id}/cancel", CancelReservationHandler)
		r.Post("/api/reservations/{id}/pay", CreatePaymentHandler)
		r.Get("/api/profile", GetProfileHandler)
	})

	// Protected admin routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.AdminMiddleware)
		r.Get("/api/admin/reservations", ListReservationsHandler)
		r.Patch("/api/admin/reservations/{id}/status", UpdateStatusHandler)
		r.Get("/api/admin/rooms", ListRoomsHandler)
		r.Post("/api/admin/rooms", CreateRoomHandler)
		r.Put("/api/admin/rooms/{id}", UpdateRoomHandler)
		r.Get("/api/admin/customers", ListCustomersHandler)
		r.Get("/api/admin/customers/search", SearchCustomersHandler)
		r.Get("/api/admin/payments", ListPaymentsHandler)
		r.Get("/api/admin/revenue", GetRevenueHandler)
	})

	port := env("API_PORT", "8080")
	log.Printf("API server starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}