package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"dbms-proj/db"
	"dbms-proj/middleware"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

var _ = context.Background() // ensure context package is used

// ========== REQUEST/RESPONSE STRUCTS ==========

type RegisterRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Address   string `json:"address,omitempty"`
	Password  string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateReservationRequest struct {
	RoomID       int32  `json:"room_id"`
	CheckInDate  string `json:"check_in_date"`
	CheckOutDate string `json:"check_out_date"`
	Guests       int32  `json:"guests"`
}

type PaymentRequest struct {
	Method         string `json:"method"`
	BillingName    string `json:"billing_name"`
	BillingEmail   string `json:"billing_email"`
	BillingAddress string `json:"billing_address,omitempty"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

type CreateRoomRequest struct {
	RoomNumber    string `json:"room_number"`
	RoomType      string `json:"room_type"`
	PricePerNight string `json:"price_per_night"`
	MaxOccupancy  int32  `json:"max_occupancy"`
}

type UpdateRoomRequest struct {
	RoomNumber    string `json:"room_number"`
	RoomType      string `json:"room_type"`
	PricePerNight string `json:"price_per_night"`
	MaxOccupancy  int32  `json:"max_occupancy"`
}

// ========== HELPER FUNCTIONS ==========

func parseDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

func parseDecimal(s string) (float64, error) {
	return strconv.ParseFloat(s, 64)
}

func nullStr(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

// ========== HANDLER IMPLEMENTATIONS ==========

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validation
	if req.FirstName == "" || req.LastName == "" || req.Email == "" || req.Phone == "" || req.Password == "" {
		http.Error(w, "All fields except address are required", http.StatusBadRequest)
		return
	}

	// Email format validation (using existing regex from main.go)
	// We'll need to import regexp or copy the pattern
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(emailRegex, req.Email)
	if !matched {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Create customer
	var addrSQL sql.NullString
	if req.Address != "" {
		addrSQL = sql.NullString{String: req.Address, Valid: true}
	}

	result, err := queries.CreateCustomer(r.Context(), db.CreateCustomerParams{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		Phone:        req.Phone,
		Address:      addrSQL,
		PasswordHash: string(hashedPassword),
	})
	if err != nil {
		http.Error(w, "Registration failed: "+err.Error(), http.StatusBadRequest)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Error getting customer ID", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"customer_id": id,
		"message":     "Registration successful",
	})
}

func CustomerLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get customer
	customer, err := queries.GetCustomerByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Customer not found", http.StatusUnauthorized)
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(customer.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(customer.CustomerID, false, true, customer.FirstName)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"customer": map[string]interface{}{
			"customer_id":    customer.CustomerID,
			"first_name":     customer.FirstName,
			"last_name":      customer.LastName,
			"email":          customer.Email,
			"loyalty_points": customer.LoyaltyPoints,
		},
	})
}

func AdminLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get staff
	staff, err := queries.GetStaffByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Staff not found", http.StatusUnauthorized)
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(staff.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	// Generate token (isAdmin = true)
	token, err := middleware.GenerateToken(staff.StaffID, true, false, staff.FirstName)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"staff": map[string]interface{}{
			"staff_id":   staff.StaffID,
			"first_name": staff.FirstName,
			"last_name":  staff.LastName,
			"email":      staff.Email,
			"role":       staff.Role,
		},
	})
}

func ListAvailableRoomsHandler(w http.ResponseWriter, r *http.Request) {
	checkIn := r.URL.Query().Get("check_in")
	checkOut := r.URL.Query().Get("check_out")

	if checkIn == "" || checkOut == "" {
		http.Error(w, "check_in and check_out parameters required", http.StatusBadRequest)
		return
	}

	checkInDate, err := parseDate(checkIn)
	if err != nil {
		http.Error(w, "Invalid check_in date format (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	checkOutDate, err := parseDate(checkOut)
	if err != nil {
		http.Error(w, "Invalid check_out date format (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	if !checkOutDate.After(checkInDate) {
		http.Error(w, "check_out must be after check_in", http.StatusBadRequest)
		return
	}

	rooms, err := queries.GetAvailableRooms(r.Context(), db.GetAvailableRoomsParams{
		CheckInDate:  checkInDate,
		CheckOutDate: checkOutDate,
	})
	if err != nil {
		http.Error(w, "Error fetching rooms: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(rooms)
}

func CreateReservationHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int32)

	var req CreateReservationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Parse dates
	checkInDate, err := parseDate(req.CheckInDate)
	if err != nil {
		http.Error(w, "Invalid check_in_date format (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	checkOutDate, err := parseDate(req.CheckOutDate)
	if err != nil {
		http.Error(w, "Invalid check_out_date format (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	if !checkOutDate.After(checkInDate) {
		http.Error(w, "check_out must be after check_in", http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := dbConn.BeginTx(r.Context(), nil)
	if err != nil {
		http.Error(w, "Error starting transaction", http.StatusInternalServerError)
		return
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	txQueries := queries.WithTx(tx)

	// Check room availability
	count, err := txQueries.CheckRoomAvailabilityForUpdate(r.Context(), db.CheckRoomAvailabilityForUpdateParams{
		RoomID:       req.RoomID,
		CheckInDate:  checkInDate,
		CheckOutDate: checkOutDate,
	})
	if err != nil {
		http.Error(w, "Error checking availability: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if count > 0 {
		http.Error(w, "Room is no longer available for those dates", http.StatusConflict)
		return
	}

	// Create reservation
	result, err := txQueries.CreateReservation(r.Context(), db.CreateReservationParams{
		CustomerID:     userID,
		RoomID:         req.RoomID,
		CheckInDate:    checkInDate,
		CheckOutDate:   checkOutDate,
		NumberOfGuests: req.Guests,
		Status:         db.ReservationStatusPending,
	})
	if err != nil {
		http.Error(w, "Error creating reservation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Error getting reservation ID", http.StatusInternalServerError)
		return
	}

	// Get room for price calculation
	room, err := txQueries.GetRoomByID(r.Context(), req.RoomID)
	if err != nil {
		http.Error(w, "Error getting room details", http.StatusInternalServerError)
		return
	}

	// Calculate price
	nights := int(checkOutDate.Sub(checkInDate).Hours() / 24)
	if nights <= 0 {
		nights = 1
	}
	price, _ := parseDecimal(room.PricePerNight)
	total := price * float64(nights)

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Error committing transaction", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"reservation_id": resID,
		"room_number":    room.RoomNumber,
		"room_type":      room.RoomType,
		"check_in_date":  checkInDate.Format("2006-01-02"),
		"check_out_date": checkOutDate.Format("2006-01-02"),
		"nights":         nights,
		"total_price":    total,
		"status":         "pending",
		"message":        "Reservation created. Make payment to confirm.",
	})
}

func GetMyReservationsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int32)

	reservations, err := queries.ListReservationsByCustomer(r.Context(), userID)
	if err != nil {
		http.Error(w, "Error fetching reservations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reservations)
}

func CancelReservationHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int32)
	resIDStr := chi.URLParam(r, "id")
	resID, err := strconv.ParseInt(resIDStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid reservation ID", http.StatusBadRequest)
		return
	}

	// First verify the reservation belongs to this customer
	res, err := queries.GetReservationByID(r.Context(), int32(resID))
	if err != nil {
		http.Error(w, "Reservation not found", http.StatusNotFound)
		return
	}
	if res.CustomerID != userID {
		http.Error(w, "Unauthorized: This reservation does not belong to you", http.StatusForbidden)
		return
	}

	// Check for existing payment and refund if needed
	payment, pErr := queries.GetPaymentByReservation(r.Context(), int32(resID))
	if pErr == nil && payment.Status == db.PaymentStatusCompleted {
		// Check if not already refunded
		if payment.Status != db.PaymentStatusRefunded {
			_ = queries.RefundPayment(r.Context(), int32(resID))
		}
	}

	err = queries.CancelReservation(r.Context(), db.CancelReservationParams{
		ReservationID: int32(resID),
		CustomerID:    userID,
	})
	if err != nil {
		http.Error(w, "Cancel failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Reservation cancelled successfully",
	})
}

func CreatePaymentHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int32)
	resIDStr := chi.URLParam(r, "id")
	resID, err := strconv.ParseInt(resIDStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid reservation ID", http.StatusBadRequest)
		return
	}

	var req PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get reservation
	res, err := queries.GetReservationByID(r.Context(), int32(resID))
	if err != nil {
		http.Error(w, "Reservation not found", http.StatusNotFound)
		return
	}

	if res.CustomerID != userID {
		http.Error(w, "Unauthorized: This reservation does not belong to you", http.StatusForbidden)
		return
	}

	// Check if payment already exists
	_, pErr := queries.GetPaymentByReservation(r.Context(), int32(resID))
	if pErr == nil {
		http.Error(w, "This reservation already has a payment", http.StatusConflict)
		return
	}

	// Get room for price calculation
	room, err := queries.GetRoomByID(r.Context(), res.RoomID)
	if err != nil {
		http.Error(w, "Room not found", http.StatusInternalServerError)
		return
	}

	// Calculate total
	nights := int(res.CheckOutDate.Sub(res.CheckInDate).Hours() / 24)
	if nights <= 0 {
		nights = 1
	}
	price, _ := parseDecimal(room.PricePerNight)
	total := price * float64(nights)

	// Determine payment method
	var method db.PaymentMethod
	switch req.Method {
	case "cash":
		method = db.PaymentMethodCash
	case "credit_card":
		method = db.PaymentMethodCreditCard
	case "online":
		method = db.PaymentMethodOnline
	default:
		http.Error(w, "Invalid payment method. Must be 'cash', 'credit_card', or 'online'", http.StatusBadRequest)
		return
	}

	// Create payment
	_, err = queries.CreatePayment(r.Context(), db.CreatePaymentParams{
		ReservationID:  int32(resID),
		Amount:         fmt.Sprintf("%.2f", total),
		Method:         method,
		TransactionID:  sql.NullString{String: fmt.Sprintf("TXN-%d-%d", resID, time.Now().Unix()), Valid: true},
		Status:         db.PaymentStatusCompleted,
		BillingName:    req.BillingName,
		BillingEmail:   req.BillingEmail,
		BillingAddress: nullStr(req.BillingAddress),
	})
	if err != nil {
		http.Error(w, "Payment failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update reservation status to confirmed
	err = queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
		Status:        db.ReservationStatusConfirmed,
		ReservationID: int32(resID),
	})
	if err != nil {
		http.Error(w, "Error updating reservation status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update loyalty points
	cust, err := queries.GetCustomerByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Error getting customer: "+err.Error(), http.StatusInternalServerError)
		return
	}

	points := int32(nights) * 10 // LoyaltyPointsPerNight = 10
	err = queries.UpdateCustomerLoyaltyPoints(r.Context(), db.UpdateCustomerLoyaltyPointsParams{
		CustomerID:    userID,
		LoyaltyPoints: cust.LoyaltyPoints + points,
	})
	if err != nil {
		http.Error(w, "Error updating loyalty points: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Payment completed successfully",
		"total":         total,
		"nights":        nights,
		"points_earned": points,
	})
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(int32)

	customer, err := queries.GetCustomerByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"customer_id":    customer.CustomerID,
		"first_name":     customer.FirstName,
		"last_name":      customer.LastName,
		"email":          customer.Email,
		"phone":          customer.Phone,
		"address":        customer.Address.String,
		"loyalty_points": customer.LoyaltyPoints,
		"created_at":     customer.CreatedAt.Time.Format("2006-01-02 15:04:05"),
	})
}

func ListReservationsHandler(w http.ResponseWriter, r *http.Request) {
	reservations, err := queries.ListAllReservations(r.Context())
	if err != nil {
		http.Error(w, "Error fetching reservations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reservations)
}

func UpdateStatusHandler(w http.ResponseWriter, r *http.Request) {
	resIDStr := chi.URLParam(r, "id")
	resID, err := strconv.ParseInt(resIDStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid reservation ID", http.StatusBadRequest)
		return
	}

	var req UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Determine status
	var status db.ReservationStatus
	switch req.Status {
	case "pending":
		status = db.ReservationStatusPending
	case "confirmed":
		status = db.ReservationStatusConfirmed
	case "checked_in":
		status = db.ReservationStatusCheckedIn
	case "checked_out":
		status = db.ReservationStatusCheckedOut
	case "cancelled":
		status = db.ReservationStatusCancelled
	default:
		http.Error(w, "Invalid status. Must be: pending, confirmed, checked_in, checked_out, cancelled", http.StatusBadRequest)
		return
	}

	err = queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
		Status:        status,
		ReservationID: int32(resID),
	})
	if err != nil {
		http.Error(w, "Error updating status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": fmt.Sprintf("Reservation #%d status updated to %s", resID, status),
	})
}

func ListRoomsHandler(w http.ResponseWriter, r *http.Request) {
	rooms, err := queries.ListRooms(r.Context())
	if err != nil {
		http.Error(w, "Error fetching rooms: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(rooms)
}

func CreateRoomHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Determine room type
	var rtype db.RoomRoomType
	switch req.RoomType {
	case "Standard":
		rtype = db.RoomRoomTypeStandard
	case "Deluxe":
		rtype = db.RoomRoomTypeDeluxe
	case "Suite":
		rtype = db.RoomRoomTypeSuite
	case "Penthouse":
		rtype = db.RoomRoomTypePenthouse
	default:
		http.Error(w, "Invalid room type. Must be: Standard, Deluxe, Suite, Penthouse", http.StatusBadRequest)
		return
	}

	result, err := queries.CreateRoom(r.Context(), db.CreateRoomParams{
		RoomNumber:    req.RoomNumber,
		RoomType:      rtype,
		PricePerNight: req.PricePerNight,
		MaxOccupancy:  req.MaxOccupancy,
	})
	if err != nil {
		http.Error(w, "Error creating room: "+err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Error getting room ID", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"room_id": id,
		"message": "Room created successfully",
	})
}

func UpdateRoomHandler(w http.ResponseWriter, r *http.Request) {
	roomIDStr := chi.URLParam(r, "id")
	roomID, err := strconv.ParseInt(roomIDStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	var req UpdateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Determine room type
	var rtype db.RoomRoomType
	switch req.RoomType {
	case "Standard":
		rtype = db.RoomRoomTypeStandard
	case "Deluxe":
		rtype = db.RoomRoomTypeDeluxe
	case "Suite":
		rtype = db.RoomRoomTypeSuite
	case "Penthouse":
		rtype = db.RoomRoomTypePenthouse
	default:
		http.Error(w, "Invalid room type. Must be: Standard, Deluxe, Suite, Penthouse", http.StatusBadRequest)
		return
	}

	err = queries.UpdateRoom(r.Context(), db.UpdateRoomParams{
		RoomNumber:    req.RoomNumber,
		RoomType:      rtype,
		PricePerNight: req.PricePerNight,
		MaxOccupancy:  req.MaxOccupancy,
		RoomID:        int32(roomID),
	})
	if err != nil {
		http.Error(w, "Error updating room: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Room updated successfully",
	})
}

func ListCustomersHandler(w http.ResponseWriter, r *http.Request) {
	customers, err := queries.ListCustomers(r.Context())
	if err != nil {
		http.Error(w, "Error fetching customers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(customers)
}

func SearchCustomersHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "name parameter required", http.StatusBadRequest)
		return
	}

	// Escape wildcards
	name = strings.ReplaceAll(name, "%", "\\%")
	name = strings.ReplaceAll(name, "_", "\\_")
	pattern := "%" + name + "%"

	customers, err := queries.SearchCustomersByName(r.Context(), db.SearchCustomersByNameParams{
		FirstName: pattern,
		LastName:  pattern,
	})
	if err != nil {
		http.Error(w, "Error searching customers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(customers)
}

func ListPaymentsHandler(w http.ResponseWriter, r *http.Request) {
	payments, err := queries.ListAllPayments(r.Context())
	if err != nil {
		http.Error(w, "Error fetching payments: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(payments)
}

func GetRevenueHandler(w http.ResponseWriter, r *http.Request) {
	total, err := queries.GetTotalRevenue(r.Context())
	if err != nil {
		http.Error(w, "Error calculating revenue: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var revenue string
	switch v := total.(type) {
	case []byte:
		revenue = string(v)
	case string:
		revenue = v
	default:
		revenue = fmt.Sprintf("%v", v)
	}

	json.NewEncoder(w).Encode(map[string]string{
		"total_revenue": revenue,
	})
}
