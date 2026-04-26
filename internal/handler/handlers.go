package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"dbms-proj/db"
	"dbms-proj/internal/middleware"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	DB      *sql.DB
	Queries *db.Queries
}

func New(db *sql.DB, queries *db.Queries) *Handler {
	return &Handler{DB: db, Queries: queries}
}

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

func nullStrVal(ns sql.NullString) interface{} {
	if ns.Valid {
		return ns.String
	}
	return nil
}

func nullTimeVal(nt sql.NullTime) interface{} {
	if nt.Valid {
		return nt.Time.Format("2006-01-02 15:04:05")
	}
	return nil
}

func nullIntVal(ni sql.NullInt32) interface{} {
	if ni.Valid {
		return ni.Int32
	}
	return nil
}

func roomToMap(room db.Room) map[string]interface{} {
	return map[string]interface{}{
		"room_id":         room.RoomID,
		"room_number":     room.RoomNumber,
		"room_type":       string(room.RoomType),
		"price_per_night": room.PricePerNight,
		"max_occupancy":   room.MaxOccupancy,
	}
}

func customerToMap(c db.Customer) map[string]interface{} {
	return map[string]interface{}{
		"customer_id":    c.CustomerID,
		"first_name":     c.FirstName,
		"last_name":      c.LastName,
		"email":          c.Email,
		"phone":          c.Phone,
		"address":        nullStrVal(c.Address),
		"loyalty_points": c.LoyaltyPoints,
		"created_at":     nullTimeVal(c.CreatedAt),
	}
}

func reservationToMap(r db.Reservationwithprice) map[string]interface{} {
	return map[string]interface{}{
		"reservation_id":      r.ReservationID,
		"customer_id":         r.CustomerID,
		"room_id":             r.RoomID,
		"staff_id":            nullIntVal(r.StaffID),
		"check_in_date":       r.CheckInDate.Format("2006-01-02"),
		"check_out_date":      r.CheckOutDate.Format("2006-01-02"),
		"number_of_guests":    r.NumberOfGuests,
		"status":              string(r.Status),
		"booking_date":        r.BookingDate.Format("2006-01-02 15:04:05"),
		"room_number":         r.RoomNumber,
		"room_type":           string(r.RoomType),
		"price_per_night":     r.PricePerNight,
		"nights":              r.Nights,
		"total_price":         r.TotalPrice,
		"customer_first_name": r.CustomerFirstName,
		"customer_last_name":  r.CustomerLastName,
		"customer_email":      r.CustomerEmail,
		"payment_status":      string(r.PaymentStatus),
	}
}

func paymentToMap(p db.Payment) map[string]interface{} {
	return map[string]interface{}{
		"payment_id":      p.PaymentID,
		"reservation_id":  p.ReservationID,
		"amount":          p.Amount,
		"payment_date":    p.PaymentDate.Format("2006-01-02 15:04:05"),
		"method":          string(p.Method),
		"transaction_id":  nullStrVal(p.TransactionID),
		"status":          string(p.Status),
		"billing_name":    p.BillingName,
		"billing_email":   p.BillingEmail,
		"billing_address": nullStrVal(p.BillingAddress),
	}
}

// ========== HANDLER IMPLEMENTATIONS ==========

func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.FirstName == "" || req.LastName == "" || req.Email == "" || req.Phone == "" || req.Password == "" {
		http.Error(w, "All fields except address are required", http.StatusBadRequest)
		return
	}

	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(emailRegex, req.Email)
	if !matched {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	var addrSQL sql.NullString
	if req.Address != "" {
		addrSQL = sql.NullString{String: req.Address, Valid: true}
	}

	result, err := h.Queries.CreateCustomer(r.Context(), db.CreateCustomerParams{
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

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"customer_id": id,
		"message":     "Registration successful",
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) CustomerLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	customer, err := h.Queries.GetCustomerByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Customer not found", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(customer.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	token, err := middleware.GenerateToken(customer.CustomerID, false, true, customer.FirstName)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"customer": map[string]interface{}{
			"customer_id":    customer.CustomerID,
			"first_name":     customer.FirstName,
			"last_name":      customer.LastName,
			"email":          customer.Email,
			"loyalty_points": customer.LoyaltyPoints,
		},
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) AdminLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	staff, err := h.Queries.GetStaffByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Staff not found", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(staff.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	token, err := middleware.GenerateToken(staff.StaffID, true, false, staff.FirstName)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"staff": map[string]interface{}{
			"staff_id":   staff.StaffID,
			"first_name": staff.FirstName,
			"last_name":  staff.LastName,
			"email":      staff.Email,
			"role":       staff.Role,
		},
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) ListAvailableRoomsHandler(w http.ResponseWriter, r *http.Request) {
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

	rooms, err := h.Queries.GetAvailableRooms(r.Context(), db.GetAvailableRoomsParams{
		CheckInDate:  checkInDate,
		CheckOutDate: checkOutDate,
	})
	if err != nil {
		http.Error(w, "Error fetching rooms: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(rooms))
	for i, room := range rooms {
		result[i] = roomToMap(room)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) CreateReservationHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int32)

	var req CreateReservationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

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

	tx, err := h.DB.BeginTx(r.Context(), nil)
	if err != nil {
		http.Error(w, "Error starting transaction", http.StatusInternalServerError)
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	txQueries := h.Queries.WithTx(tx)

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

	room, err := txQueries.GetRoomByID(r.Context(), req.RoomID)
	if err != nil {
		http.Error(w, "Error getting room details", http.StatusInternalServerError)
		return
	}

	nights := int(checkOutDate.Sub(checkInDate).Hours() / 24)
	if nights <= 0 {
		nights = 1
	}
	price, _ := parseDecimal(room.PricePerNight)
	total := price * float64(nights)

	if err := tx.Commit(); err != nil {
		http.Error(w, "Error committing transaction", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"reservation_id": resID,
		"room_number":    room.RoomNumber,
		"room_type":      room.RoomType,
		"check_in_date":  checkInDate.Format("2006-01-02"),
		"check_out_date": checkOutDate.Format("2006-01-02"),
		"nights":         nights,
		"total_price":    total,
		"status":         "pending",
		"message":        "Reservation created. Make payment to confirm.",
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) GetMyReservationsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int32)

	reservations, err := h.Queries.ListReservationsByCustomer(r.Context(), userID)
	if err != nil {
		http.Error(w, "Error fetching reservations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(reservations))
	for i, res := range reservations {
		result[i] = reservationToMap(res)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) CancelReservationHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int32)
	resIDStr := chi.URLParam(r, "id")
	resID, err := strconv.ParseInt(resIDStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid reservation ID", http.StatusBadRequest)
		return
	}

	res, err := h.Queries.GetReservationByID(r.Context(), int32(resID))
	if err != nil {
		http.Error(w, "Reservation not found", http.StatusNotFound)
		return
	}
	if res.CustomerID != userID {
		http.Error(w, "Unauthorized: This reservation does not belong to you", http.StatusForbidden)
		return
	}

	payment, pErr := h.Queries.GetPaymentByReservation(r.Context(), int32(resID))
	if pErr == nil && payment.Status == db.PaymentStatusCompleted {
		_ = h.Queries.RefundPayment(r.Context(), int32(resID))
	}

	err = h.Queries.CancelReservation(r.Context(), db.CancelReservationParams{
		ReservationID: int32(resID),
		CustomerID:    userID,
	})
	if err != nil {
		http.Error(w, "Cancel failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]string{
		"message": "Reservation cancelled successfully",
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) CreatePaymentHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int32)
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

	res, err := h.Queries.GetReservationByID(r.Context(), int32(resID))
	if err != nil {
		http.Error(w, "Reservation not found", http.StatusNotFound)
		return
	}

	if res.CustomerID != userID {
		http.Error(w, "Unauthorized: This reservation does not belong to you", http.StatusForbidden)
		return
	}

	_, pErr := h.Queries.GetPaymentByReservation(r.Context(), int32(resID))
	if pErr == nil {
		http.Error(w, "This reservation already has a payment", http.StatusConflict)
		return
	}

	room, err := h.Queries.GetRoomByID(r.Context(), res.RoomID)
	if err != nil {
		http.Error(w, "Room not found", http.StatusInternalServerError)
		return
	}

	nights := int(res.CheckOutDate.Sub(res.CheckInDate).Hours() / 24)
	if nights <= 0 {
		nights = 1
	}
	price, _ := parseDecimal(room.PricePerNight)
	total := price * float64(nights)

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

	_, err = h.Queries.CreatePayment(r.Context(), db.CreatePaymentParams{
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

	err = h.Queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
		Status:        db.ReservationStatusConfirmed,
		ReservationID: int32(resID),
	})
	if err != nil {
		http.Error(w, "Error updating reservation status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	cust, err := h.Queries.GetCustomerByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Error getting customer: "+err.Error(), http.StatusInternalServerError)
		return
	}

	points := int32(nights) * 10
	err = h.Queries.UpdateCustomerLoyaltyPoints(r.Context(), db.UpdateCustomerLoyaltyPointsParams{
		CustomerID:    userID,
		LoyaltyPoints: cust.LoyaltyPoints + points,
	})
	if err != nil {
		http.Error(w, "Error updating loyalty points: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Payment completed successfully",
		"total":         total,
		"nights":        nights,
		"points_earned": points,
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int32)

	customer, err := h.Queries.GetCustomerByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"customer_id":    customer.CustomerID,
		"first_name":     customer.FirstName,
		"last_name":      customer.LastName,
		"email":          customer.Email,
		"phone":          customer.Phone,
		"address":        nullStrVal(customer.Address),
		"loyalty_points": customer.LoyaltyPoints,
		"created_at":     nullTimeVal(customer.CreatedAt),
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) ListReservationsHandler(w http.ResponseWriter, r *http.Request) {
	reservations, err := h.Queries.ListAllReservations(r.Context())
	if err != nil {
		http.Error(w, "Error fetching reservations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(reservations))
	for i, res := range reservations {
		result[i] = reservationToMap(res)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) UpdateStatusHandler(w http.ResponseWriter, r *http.Request) {
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

	err = h.Queries.UpdateReservationStatus(r.Context(), db.UpdateReservationStatusParams{
		Status:        status,
		ReservationID: int32(resID),
	})
	if err != nil {
		http.Error(w, "Error updating status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]string{
		"message": fmt.Sprintf("Reservation #%d status updated to %s", resID, status),
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) ListRoomsHandler(w http.ResponseWriter, r *http.Request) {
	rooms, err := h.Queries.ListRooms(r.Context())
	if err != nil {
		http.Error(w, "Error fetching rooms: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(rooms))
	for i, room := range rooms {
		result[i] = roomToMap(room)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) CreateRoomHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

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

	result, err := h.Queries.CreateRoom(r.Context(), db.CreateRoomParams{
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

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"room_id": id,
		"message": "Room created successfully",
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) UpdateRoomHandler(w http.ResponseWriter, r *http.Request) {
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

	err = h.Queries.UpdateRoom(r.Context(), db.UpdateRoomParams{
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

	if err := json.NewEncoder(w).Encode(map[string]string{
		"message": "Room updated successfully",
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) ListCustomersHandler(w http.ResponseWriter, r *http.Request) {
	customers, err := h.Queries.ListCustomers(r.Context())
	if err != nil {
		http.Error(w, "Error fetching customers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(customers))
	for i, c := range customers {
		result[i] = customerToMap(c)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) SearchCustomersHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "name parameter required", http.StatusBadRequest)
		return
	}

	name = strings.ReplaceAll(name, "%", "\\%")
	name = strings.ReplaceAll(name, "_", "\\_")
	pattern := "%" + name + "%"

	customers, err := h.Queries.SearchCustomersByName(r.Context(), db.SearchCustomersByNameParams{
		FirstName: pattern,
		LastName:  pattern,
	})
	if err != nil {
		http.Error(w, "Error searching customers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(customers))
	for i, c := range customers {
		result[i] = customerToMap(c)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) ListPaymentsHandler(w http.ResponseWriter, r *http.Request) {
	payments, err := h.Queries.ListAllPayments(r.Context())
	if err != nil {
		http.Error(w, "Error fetching payments: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]map[string]interface{}, len(payments))
	for i, p := range payments {
		result[i] = paymentToMap(p)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func (h *Handler) GetRevenueHandler(w http.ResponseWriter, r *http.Request) {
	total, err := h.Queries.GetTotalRevenue(r.Context())
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

	if err := json.NewEncoder(w).Encode(map[string]string{
		"total_revenue": revenue,
	}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}