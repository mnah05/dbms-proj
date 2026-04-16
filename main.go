package main

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"dbms-proj/db"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

const (
	LoyaltyPointsPerNight = 10
)

var (
	dbConn        *sql.DB
	queries       *db.Queries
	reader        *bufio.Reader
	ctx           context.Context
	cancelCtx     context.CancelFunc
	loginMutex    sync.Mutex
	loginAttempts = make(map[string][]time.Time)
	emailRegex    = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

type session struct {
	isAdmin    bool
	isCustomer bool
	staffID    int32
	custID     int32
	name       string
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
		fmt.Printf("Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer dbConn.Close()

	// Configure connection pool
	dbConn.SetMaxOpenConns(25)
	dbConn.SetMaxIdleConns(5)
	dbConn.SetConnMaxLifetime(5 * time.Minute)

	if err := dbConn.Ping(); err != nil {
		fmt.Printf("Database unreachable: %v\n", err)
		os.Exit(1)
	}

	// Create context with timeout for operations
	ctx, cancelCtx = context.WithCancel(context.Background())
	defer cancelCtx()

	queries = db.New(dbConn)
	reader = bufio.NewReader(os.Stdin)

	fmt.Println("\n=== Hotel Reservation System ===")
	fmt.Println("Database connected successfully!")

	for {
		mainMenu()
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mainMenu() {
	fmt.Println("\n========== MAIN MENU ==========")
	fmt.Println("1. Customer Login")
	fmt.Println("2. Customer Register")
	fmt.Println("3. Admin / Staff Login")
	fmt.Println("4. Exit")
	fmt.Print("Choose: ")

	choice := readLine()
	switch choice {
	case "1":
		customerLogin()
	case "2":
		customerRegister()
	case "3":
		adminLogin()
	case "4":
		fmt.Println("Goodbye!")
		os.Exit(0)
	default:
		fmt.Println("Invalid choice.")
	}
}

func customerLogin() {
	loginMutex.Lock()
	defer loginMutex.Unlock()

	fmt.Print("Email: ")
	email := strings.TrimSpace(readLine())

	// Rate limiting check
	now := time.Now()
	attempts := loginAttempts[email]
	// Remove attempts older than 5 minutes
	validAttempts := []time.Time{}
	for _, t := range attempts {
		if now.Sub(t) < 5*time.Minute {
			validAttempts = append(validAttempts, t)
		}
	}
	loginAttempts[email] = validAttempts

	if len(validAttempts) >= 5 {
		fmt.Println("Too many failed login attempts. Please try again in 5 minutes.")
		return
	}

	fmt.Print("Password: ")
	password := readLine()

	customer, err := queries.GetCustomerByEmail(ctx, email)
	if err != nil {
		loginAttempts[email] = append(loginAttempts[email], now)
		fmt.Println("Customer not found. Please register first.")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(customer.PasswordHash), []byte(password)); err != nil {
		loginAttempts[email] = append(loginAttempts[email], now)
		fmt.Println("Invalid password.")
		return
	}

	// Clear attempts on successful login
	delete(loginAttempts, email)

	fmt.Printf("\nWelcome, %s %s!\n", customer.FirstName, customer.LastName)
	s := session{isCustomer: true, custID: customer.CustomerID, name: customer.FirstName}
	customerMenu(s)
}

func customerRegister() {
	fmt.Print("First Name: ")
	first := strings.TrimSpace(readLine())
	if first == "" {
		fmt.Println("Error: First name is required.")
		return
	}

	fmt.Print("Last Name: ")
	last := strings.TrimSpace(readLine())
	if last == "" {
		fmt.Println("Error: Last name is required.")
		return
	}

	fmt.Print("Email: ")
	email := strings.TrimSpace(readLine())
	if email == "" {
		fmt.Println("Error: Email is required.")
		return
	}
	if !emailRegex.MatchString(email) {
		fmt.Println("Error: Invalid email format.")
		return
	}

	fmt.Print("Phone: ")
	phone := strings.TrimSpace(readLine())
	if phone == "" {
		fmt.Println("Error: Phone is required.")
		return
	}

	fmt.Print("Address (optional): ")
	addr := readLine()

	fmt.Print("Password: ")
	password := readLine()
	if password == "" {
		fmt.Println("Error: Password is required.")
		return
	}

	var addrSQL sql.NullString
	if addr != "" {
		addrSQL = sql.NullString{String: addr, Valid: true}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Password hashing failed: %v\n", err)
		return
	}

	result, err := queries.CreateCustomer(ctx, db.CreateCustomerParams{
		FirstName:    first,
		LastName:     last,
		Email:        email,
		Phone:        phone,
		Address:      addrSQL,
		PasswordHash: string(hashedPassword),
	})
	if err != nil {
		fmt.Printf("Registration failed: %v\n", err)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		fmt.Printf("Error getting customer ID: %v\n", err)
		return
	}
	fmt.Printf("Registration successful! Your customer ID is %d.\n", id)
}

func adminLogin() {
	fmt.Print("Email: ")
	email := readLine()
	fmt.Print("Password: ")
	password := readLine()

	staff, err := queries.GetStaffByEmail(ctx, email)
	if err != nil {
		fmt.Println("Staff not found.")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(staff.PasswordHash), []byte(password)); err != nil {
		fmt.Println("Invalid password.")
		return
	}

	fmt.Printf("\nWelcome, %s %s (Role: %s)\n", staff.FirstName, staff.LastName, staff.Role)
	s := session{isAdmin: true, staffID: staff.StaffID, name: staff.FirstName}
	adminMenu(s)
}

func customerMenu(s session) {
	for {
		fmt.Println("\n======= CUSTOMER MENU =======")
		fmt.Println("1. View Available Rooms")
		fmt.Println("2. Book a Room")
		fmt.Println("3. View My Reservations")
		fmt.Println("4. Cancel a Reservation")
		fmt.Println("5. Make a Payment")
		fmt.Println("6. View My Profile")
		fmt.Println("7. Logout")
		fmt.Print("Choose: ")

		switch readLine() {
		case "1":
			viewAvailableRooms()
		case "2":
			bookRoom(s)
		case "3":
			viewMyReservations(s)
		case "4":
			cancelReservation(s)
		case "5":
			makePayment(s)
		case "6":
			viewProfile(s)
		case "7":
			fmt.Println("Logged out.")
			return
		default:
			fmt.Println("Invalid choice.")
		}
	}
}

func adminMenu(s session) {
	for {
		fmt.Println("\n========= ADMIN MENU =========")
		fmt.Println("1.  View All Reservations")
		fmt.Println("2.  View Reservations by Status")
		fmt.Println("3.  Confirm Reservation")
		fmt.Println("4.  Check-In Guest")
		fmt.Println("5.  Check-Out Guest")
		fmt.Println("6.  Update Reservation Status")
		fmt.Println("7.  View All Rooms")
		fmt.Println("8.  Add a Room")
		fmt.Println("9.  Update a Room")
		fmt.Println("10. View All Customers")
		fmt.Println("11. Search Customers")
		fmt.Println("12. View All Payments")
		fmt.Println("13. Revenue Summary")
		fmt.Println("14. Logout")
		fmt.Print("Choose: ")

		switch readLine() {
		case "1":
			viewAllReservations()
		case "2":
			viewReservationsByStatus()
		case "3":
			updateReservationStatus(db.ReservationStatusConfirmed)
		case "4":
			updateReservationStatus(db.ReservationStatusCheckedIn)
		case "5":
			updateReservationStatus(db.ReservationStatusCheckedOut)
		case "6":
			updateReservationStatusCustom()
		case "7":
			viewAllRooms()
		case "8":
			addRoom()
		case "9":
			updateRoom()
		case "10":
			viewAllCustomers()
		case "11":
			searchCustomers()
		case "12":
			viewAllPayments()
		case "13":
			revenueSummary()
		case "14":
			fmt.Println("Logged out.")
			return
		default:
			fmt.Println("Invalid choice.")
		}
	}
}

func viewAvailableRooms() {
	fmt.Print("Check-in date (YYYY-MM-DD): ")
	ci := readLine()
	fmt.Print("Check-out date (YYYY-MM-DD): ")
	co := readLine()

	checkIn, err := time.Parse("2006-01-02", ci)
	if err != nil {
		fmt.Println("Invalid check-in date format.")
		return
	}
	checkOut, err := time.Parse("2006-01-02", co)
	if err != nil {
		fmt.Println("Invalid check-out date format.")
		return
	}

	if !checkOut.After(checkIn) {
		fmt.Println("Check-out must be after check-in.")
		return
	}

	rooms, err := queries.GetAvailableRooms(ctx, db.GetAvailableRoomsParams{
		CheckInDate:  checkIn,
		CheckOutDate: checkOut,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(rooms) == 0 {
		fmt.Println("No rooms available for those dates.")
		return
	}

	fmt.Println("\n--- Available Rooms ---")
	fmt.Printf("%-8s %-12s %-16s %-10s\n", "ID", "Number", "Type", "Price/Night")
	for _, r := range rooms {
		fmt.Printf("%-8d %-12s %-16s $%-10s\n", r.RoomID, r.RoomNumber, r.RoomType, r.PricePerNight)
	}
	fmt.Printf("\n%d room(s) available.\n", len(rooms))
}

// bookRoom handles room booking with optimistic locking pattern
// NOTE: There's a potential race condition between room display and booking.
// Another user could book the same room after we display available rooms.
// The CheckRoomAvailabilityForUpdate query inside the transaction handles this.
func bookRoom(s session) {
	fmt.Print("Check-in date (YYYY-MM-DD): ")
	ci := readLine()
	fmt.Print("Check-out date (YYYY-MM-DD): ")
	co := readLine()

	checkIn, err := time.Parse("2006-01-02", ci)
	if err != nil {
		fmt.Println("Invalid check-in date format.")
		return
	}
	checkOut, err := time.Parse("2006-01-02", co)
	if err != nil {
		fmt.Println("Invalid check-out date format.")
		return
	}

	if !checkOut.After(checkIn) {
		fmt.Println("Check-out must be after check-in.")
		return
	}

	rooms, err := queries.GetAvailableRooms(ctx, db.GetAvailableRoomsParams{
		CheckInDate:  checkIn,
		CheckOutDate: checkOut,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(rooms) == 0 {
		fmt.Println("No rooms available for those dates.")
		return
	}

	fmt.Println("\n--- Available Rooms ---")
	fmt.Printf("%-8s %-12s %-16s %-10s %-12s\n", "ID", "Number", "Type", "Price/Nt", "Max Guests")
	for _, r := range rooms {
		fmt.Printf("%-8d %-12s %-16s $%-10s %-12d\n", r.RoomID, r.RoomNumber, r.RoomType, r.PricePerNight, r.MaxOccupancy)
	}

	fmt.Print("Enter Room ID: ")
	roomID, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Print("Number of guests: ")
	guests, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	var selectedRoom db.Room
	found := false
	for _, r := range rooms {
		if r.RoomID == roomID {
			selectedRoom = r
			found = true
			break
		}
	}
	if !found {
		fmt.Println("Room not available for the selected dates.")
		return
	}
	room := selectedRoom
	if guests > room.MaxOccupancy {
		fmt.Printf("Max occupancy for this room is %d.\n", room.MaxOccupancy)
		return
	}

	tx, err := dbConn.BeginTx(ctx, nil)
	if err != nil {
		fmt.Printf("Error starting transaction: %v\n", err)
		return
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	txQueries := queries.WithTx(tx)

	count, err := txQueries.CheckRoomAvailabilityForUpdate(ctx, db.CheckRoomAvailabilityForUpdateParams{
		RoomID:       roomID,
		CheckInDate:  checkIn,
		CheckOutDate: checkOut,
	})
	if err != nil {
		fmt.Printf("Error checking availability: %v\n", err)
		return
	}
	if count > 0 {
		fmt.Println("Room is no longer available for those dates.")
		return
	}

	result, err := txQueries.CreateReservation(ctx, db.CreateReservationParams{
		CustomerID:     s.custID,
		RoomID:         roomID,
		StaffID:        sql.NullInt32{Valid: false},
		CheckInDate:    checkIn,
		CheckOutDate:   checkOut,
		NumberOfGuests: guests,
		Status:         db.ReservationStatusPending,
	})
	if err != nil {
		fmt.Printf("Error creating reservation: %v\n", err)
		return
	}

	resID, err := result.LastInsertId()
	if err != nil {
		fmt.Printf("Error getting reservation ID: %v\n", err)
		return
	}

	if err := tx.Commit(); err != nil {
		fmt.Printf("Error committing reservation: %v\n", err)
		return
	}

	fmt.Printf("\nReservation created! ID: %d (Status: Pending)\n", resID)
	fmt.Println("Please make a payment to confirm your reservation.")

	promptPayment(s, int32(resID), room.PricePerNight, checkIn, checkOut)
}

func promptPayment(s session, resID int32, priceStr string, checkIn, checkOut time.Time) {
	fmt.Print("Make payment now? (y/n): ")
	if strings.ToLower(readLine()) != "y" {
		return
	}

	price, err := parseDecimal(priceStr)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	nights := int(checkOut.Sub(checkIn).Hours() / 24)
	if nights <= 0 {
		nights = 1
	}
	total := price * float64(nights)

	fmt.Printf("Total: $%.2f (%d nights x $%s/night)\n", total, nights, priceStr)
	fmt.Println("Payment method: 1. Cash  2. Credit Card  3. Online")
	fmt.Print("Choose: ")
	var method db.PaymentMethod
	switch readLine() {
	case "1":
		method = db.PaymentMethodCash
	case "2":
		method = db.PaymentMethodCreditCard
	case "3":
		method = db.PaymentMethodOnline
	default:
		fmt.Println("Invalid choice. Defaulting to cash.")
		method = db.PaymentMethodCash
	}

	fmt.Print("Billing name: ")
	bname := readLine()
	fmt.Print("Billing email: ")
	bemail := readLine()
	fmt.Print("Billing address (optional): ")
	baddr := readLine()

	var baddrSQL sql.NullString
	if baddr != "" {
		baddrSQL = sql.NullString{String: baddr, Valid: true}
	}

	_, err = queries.CreatePayment(ctx, db.CreatePaymentParams{
		ReservationID:  resID,
		Amount:         fmt.Sprintf("%.2f", total),
		Method:         method,
		TransactionID:  sql.NullString{String: fmt.Sprintf("TXN-%d-%d", resID, time.Now().Unix()), Valid: true},
		Status:         db.PaymentStatusCompleted,
		BillingName:    bname,
		BillingEmail:   bemail,
		BillingAddress: baddrSQL,
	})
	if err != nil {
		fmt.Printf("Payment failed: %v\n", err)
		return
	}

	if err := queries.UpdateReservationStatus(ctx, db.UpdateReservationStatusParams{
		Status:        db.ReservationStatusConfirmed,
		ReservationID: resID,
	}); err != nil {
		fmt.Printf("Error updating reservation status: %v\n", err)
		return
	}

	cust, err := queries.GetCustomerByID(ctx, s.custID)
	if err != nil {
		fmt.Printf("Error getting customer: %v\n", err)
		return
	}
	points := int32(nights) * LoyaltyPointsPerNight
	if err := queries.UpdateCustomerLoyaltyPoints(ctx, db.UpdateCustomerLoyaltyPointsParams{
		LoyaltyPoints: cust.LoyaltyPoints + points,
		CustomerID:    s.custID,
	}); err != nil {
		fmt.Printf("Error updating loyalty points: %v\n", err)
		return
	}

	fmt.Printf("Payment successful! Reservation #%d is now confirmed.\n", resID)
	fmt.Printf("You earned %d loyalty points!\n", points)
}

func viewMyReservations(s session) {
	reservations, err := queries.ListReservationsByCustomer(ctx, s.custID)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(reservations) == 0 {
		fmt.Println("No reservations found.")
		return
	}

	fmt.Println("\n--- My Reservations ---")
	fmt.Printf("%-5s %-8s %-10s %-12s %-12s %-8s %-10s %-8s\n",
		"ID", "Room", "Type", "Check-In", "Check-Out", "Nights", "Status", "Total")
	for _, r := range reservations {
		fmt.Printf("%-5d %-8s %-10s %-12s %-12s %-8d %-10s $%-8.2f\n",
			r.ReservationID, r.RoomNumber, r.RoomType,
			r.CheckInDate.Format("2006-01-02"), r.CheckOutDate.Format("2006-01-02"),
			r.Nights, r.Status, r.TotalPrice)
	}
}

func cancelReservation(s session) {
	viewMyReservations(s)
	fmt.Print("Enter Reservation ID to cancel: ")
	resID, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// First verify the reservation belongs to this customer
	res, err := queries.GetReservationByID(ctx, resID)
	if err != nil {
		fmt.Println("Reservation not found.")
		return
	}
	if res.CustomerID != s.custID {
		fmt.Println("Unauthorized: This reservation does not belong to you.")
		return
	}

	// Check for existing payment and refund if needed
	payment, pErr := queries.GetPaymentByReservation(ctx, resID)
	if pErr == nil && payment.Status == db.PaymentStatusCompleted {
		// Check if not already refunded
		if payment.Status != db.PaymentStatusRefunded {
			_ = queries.RefundPayment(ctx, resID)
			fmt.Println("Payment will be refunded.")
		}
	}

	err = queries.CancelReservation(ctx, db.CancelReservationParams{
		ReservationID: resID,
		CustomerID:    s.custID,
	})
	if err != nil {
		fmt.Printf("Cancel failed: %v\n", err)
		return
	}
	fmt.Println("Reservation cancelled successfully.")
}

func makePayment(s session) {
	viewMyReservations(s)
	fmt.Print("Enter Reservation ID to pay: ")
	resID, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	res, err := queries.GetReservationByID(ctx, resID)
	if err != nil {
		fmt.Println("Reservation not found.")
		return
	}

	_, pErr := queries.GetPaymentByReservation(ctx, resID)
	if pErr == nil {
		fmt.Println("This reservation already has a payment.")
		return
	}

	room, err := queries.GetRoomByID(ctx, res.RoomID)
	if err != nil {
		fmt.Println("Room not found.")
		return
	}

	nights := int(res.CheckOutDate.Sub(res.CheckInDate).Hours() / 24)
	if nights <= 0 {
		nights = 1
	}

	promptPayment(s, resID, room.PricePerNight, res.CheckInDate, res.CheckOutDate)
}

func viewProfile(s session) {
	cust, err := queries.GetCustomerByID(ctx, s.custID)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("\n--- My Profile ---")
	fmt.Printf("ID:            %d\n", cust.CustomerID)
	fmt.Printf("Name:          %s %s\n", cust.FirstName, cust.LastName)
	fmt.Printf("Email:         %s\n", cust.Email)
	fmt.Printf("Phone:         %s\n", cust.Phone)
	fmt.Printf("Address:       %s\n", nullStr(cust.Address))
	fmt.Printf("Loyalty Points: %d\n", cust.LoyaltyPoints)
}

func viewAllReservations() {
	reservations, err := queries.ListAllReservations(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(reservations) == 0 {
		fmt.Println("No reservations found.")
		return
	}

	fmt.Println("\n--- All Reservations ---")
	fmt.Printf("%-5s %-10s %-8s %-10s %-12s %-12s %-8s %-12s %-8s\n",
		"ID", "CustID", "Room", "Type", "Check-In", "Check-Out", "Nights", "Status", "Total")
	for _, r := range reservations {
		fmt.Printf("%-5d %-10d %-8s %-10s %-12s %-12s %-8d %-12s $%-8.2f\n",
			r.ReservationID, r.CustomerID, r.RoomNumber, r.RoomType,
			r.CheckInDate.Format("2006-01-02"), r.CheckOutDate.Format("2006-01-02"),
			r.Nights, r.Status, r.TotalPrice)
	}
}

func viewReservationsByStatus() {
	fmt.Println("Status: 1. Pending  2. Confirmed  3. Checked-In  4. Checked-Out  5. Cancelled")
	fmt.Print("Choose: ")
	var status db.ReservationStatus
	switch readLine() {
	case "1":
		status = db.ReservationStatusPending
	case "2":
		status = db.ReservationStatusConfirmed
	case "3":
		status = db.ReservationStatusCheckedIn
	case "4":
		status = db.ReservationStatusCheckedOut
	case "5":
		status = db.ReservationStatusCancelled
	default:
		fmt.Println("Invalid choice.")
		return
	}

	reservations, err := queries.ListReservationsByStatus(ctx, status)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(reservations) == 0 {
		fmt.Printf("No %s reservations.\n", status)
		return
	}

	fmt.Printf("\n--- %s Reservations ---\n", status)
	fmt.Printf("%-5s %-10s %-8s %-10s %-12s %-12s %-8s %-12s %-8s\n",
		"ID", "CustID", "Room", "Type", "Check-In", "Check-Out", "Nights", "Status", "Total")
	for _, r := range reservations {
		fmt.Printf("%-5d %-10d %-8s %-10s %-12s %-12s %-8d %-12s $%-8.2f\n",
			r.ReservationID, r.CustomerID, r.RoomNumber, r.RoomType,
			r.CheckInDate.Format("2006-01-02"), r.CheckOutDate.Format("2006-01-02"),
			r.Nights, r.Status, r.TotalPrice)
	}
}

func updateReservationStatus(status db.ReservationStatus) {
	viewAllReservations()
	fmt.Printf("Enter Reservation ID to set to %s: ", status)
	resID, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	err = queries.UpdateReservationStatus(ctx, db.UpdateReservationStatusParams{
		Status:        status,
		ReservationID: resID,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("Reservation #%d status updated to %s.\n", resID, status)
}

func updateReservationStatusCustom() {
	fmt.Println("Status: 1. Pending  2. Confirmed  3. Checked-In  4. Checked-Out  5. Cancelled")
	fmt.Print("Choose new status: ")
	var status db.ReservationStatus
	switch readLine() {
	case "1":
		status = db.ReservationStatusPending
	case "2":
		status = db.ReservationStatusConfirmed
	case "3":
		status = db.ReservationStatusCheckedIn
	case "4":
		status = db.ReservationStatusCheckedOut
	case "5":
		status = db.ReservationStatusCancelled
	default:
		fmt.Println("Invalid choice.")
		return
	}

	fmt.Print("Enter Reservation ID: ")
	resID, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	err = queries.UpdateReservationStatus(ctx, db.UpdateReservationStatusParams{
		Status:        status,
		ReservationID: resID,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("Reservation #%d status updated to %s.\n", resID, status)
}

func viewAllRooms() {
	rooms, err := queries.ListRooms(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("\n--- All Rooms ---")
	fmt.Printf("%-8s %-12s %-16s %-10s %-12s\n", "ID", "Number", "Type", "Price/Nt", "Max Guests")
	for _, r := range rooms {
		fmt.Printf("%-8d %-12s %-16s $%-10s %-12d\n", r.RoomID, r.RoomNumber, r.RoomType, r.PricePerNight, r.MaxOccupancy)
	}
}

func addRoom() {
	fmt.Print("Room number: ")
	num := readLine()
	fmt.Println("Type: 1. Standard  2. Deluxe  3. Suite  4. Penthouse")
	fmt.Print("Choose: ")
	var rtype db.RoomRoomType
	switch readLine() {
	case "1":
		rtype = db.RoomRoomTypeStandard
	case "2":
		rtype = db.RoomRoomTypeDeluxe
	case "3":
		rtype = db.RoomRoomTypeSuite
	case "4":
		rtype = db.RoomRoomTypePenthouse
	default:
		fmt.Println("Invalid choice. Defaulting to Standard.")
		rtype = db.RoomRoomTypeStandard
	}
	fmt.Print("Price per night: ")
	price := readLine()
	fmt.Print("Max occupancy: ")
	occ, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	result, err := queries.CreateRoom(ctx, db.CreateRoomParams{
		RoomNumber:    num,
		RoomType:      rtype,
		PricePerNight: price,
		MaxOccupancy:  occ,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		fmt.Printf("Error getting room ID: %v\n", err)
		return
	}
	fmt.Printf("Room created with ID %d.\n", id)
}

func updateRoom() {
	viewAllRooms()
	fmt.Print("Enter Room ID to update: ")
	roomID, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	_, err = queries.GetRoomByID(ctx, roomID)
	if err != nil {
		fmt.Println("Room not found.")
		return
	}

	fmt.Print("New room number: ")
	num := readLine()
	fmt.Println("Type: 1. Standard  2. Deluxe  3. Suite  4. Penthouse")
	fmt.Print("Choose: ")
	var rtype db.RoomRoomType
	switch readLine() {
	case "1":
		rtype = db.RoomRoomTypeStandard
	case "2":
		rtype = db.RoomRoomTypeDeluxe
	case "3":
		rtype = db.RoomRoomTypeSuite
	case "4":
		rtype = db.RoomRoomTypePenthouse
	default:
		fmt.Println("Invalid choice. Defaulting to Standard.")
		rtype = db.RoomRoomTypeStandard
	}
	fmt.Print("New price per night: ")
	price := readLine()
	fmt.Print("New max occupancy: ")
	occ, err := readInt()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	err = queries.UpdateRoom(ctx, db.UpdateRoomParams{
		RoomNumber:    num,
		RoomType:      rtype,
		PricePerNight: price,
		MaxOccupancy:  occ,
		RoomID:        roomID,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Println("Room updated successfully.")
}

func viewAllCustomers() {
	customers, err := queries.ListCustomers(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("\n--- All Customers ---")
	fmt.Printf("%-5s %-15s %-15s %-25s %-15s %-8s\n", "ID", "First", "Last", "Email", "Phone", "Points")
	for _, c := range customers {
		fmt.Printf("%-5d %-15s %-15s %-25s %-15s %-8d\n",
			c.CustomerID, c.FirstName, c.LastName, c.Email, c.Phone, c.LoyaltyPoints)
	}
}

func searchCustomers() {
	fmt.Print("Search name: ")
	name := readLine()
	// Escape SQL wildcard characters to prevent injection
	name = strings.ReplaceAll(name, "%", "\\%")
	name = strings.ReplaceAll(name, "_", "\\_")
	pattern := "%" + name + "%"

	customers, err := queries.SearchCustomersByName(ctx, db.SearchCustomersByNameParams{
		FirstName: pattern,
		LastName:  pattern,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(customers) == 0 {
		fmt.Println("No customers found.")
		return
	}

	fmt.Println("\n--- Search Results ---")
	fmt.Printf("%-5s %-15s %-15s %-25s %-15s %-8s\n", "ID", "First", "Last", "Email", "Phone", "Points")
	for _, c := range customers {
		fmt.Printf("%-5d %-15s %-15s %-25s %-15s %-8d\n",
			c.CustomerID, c.FirstName, c.LastName, c.Email, c.Phone, c.LoyaltyPoints)
	}
}

func viewAllPayments() {
	payments, err := queries.ListAllPayments(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if len(payments) == 0 {
		fmt.Println("No payments found.")
		return
	}

	fmt.Println("\n--- All Payments ---")
	fmt.Printf("%-5s %-12s %-10s %-15s %-12s %-10s %-25s\n",
		"ID", "ResvID", "Amount", "Method", "Status", "Date", "Transaction")
	for _, p := range payments {
		var txn string
		if p.TransactionID.Valid {
			txn = p.TransactionID.String
		}
		fmt.Printf("%-5d %-12d $%-10s %-15s %-12s %-10s %-25s\n",
			p.PaymentID, p.ReservationID, p.Amount, p.Method, p.Status,
			p.PaymentDate.Format("2006-01-02"), txn)
	}
}

func revenueSummary() {
	total, err := queries.GetTotalRevenue(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
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

	fmt.Println("\n--- Revenue Summary ---")
	fmt.Printf("Total Revenue: $%s\n", revenue)
}

func readLine() string {
	line, err := reader.ReadString('\n')
	if err != nil {
		os.Exit(0)
	}
	return strings.TrimSpace(line)
}

func readInt() (int32, error) {
	line := readLine()
	n, err := strconv.ParseInt(line, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid integer: %s", line)
	}
	return int32(n), nil
}

func nullStr(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return "-"
}

func parseDecimal(s string) (float64, error) {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid decimal: %s", s)
	}
	return f, nil
}
