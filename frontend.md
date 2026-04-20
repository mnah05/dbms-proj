# 🏨 Airbnb-Like Frontend — Implementation Plan

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Auth | JWT (stored in localStorage) |
| State | React Context (auth state) |
| Date Picker | React Datepicker |
| Icons | Lucide React |
| Location | `/frontend` inside existing project |

---

## Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js          # Proxy /api → localhost:8080
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx
    ├── App.jsx              # Routes + layout
    ├── api/
    │   └── client.js        # Axios instance + interceptors
    ├── context/
    │   └── AuthContext.jsx   # Auth state, login/logout/register
    ├── hooks/
    │   └── useAuth.js        # Custom auth hook
    ├── components/
    │   ├── Layout/
    │   │   ├── Navbar.jsx     # Top nav with logo, search, user menu
    │   │   ├── Footer.jsx     # Site footer
    │   │   └── ProtectedRoute.jsx  # Auth guard
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Badge.jsx
    │   │   └── Spinner.jsx
    │   └── rooms/
    │       ├── RoomCard.jsx       # Airbnb-style room listing card
    │       ├── RoomFilterBar.jsx  # Date picker + guest count
    │       └── RoomTypeIcon.jsx    # Room type icon (Standard/Deluxe/Suite/Penthouse)
    ├── pages/
    │   ├── Home.jsx              # Landing page with search
    │   ├── Login.jsx             # Customer login form
    │   ├── Register.jsx          # Customer registration form
    │   ├── Rooms.jsx             # Room listing with filters (Airbnb search results page)
    │   ├── RoomDetail.jsx        # Single room + booking form
    │   ├── BookingConfirm.jsx    # Review booking details before payment
    │   ├── Payment.jsx           # Payment form
    │   ├── MyReservations.jsx    # Customer's reservation list
    │   ├── Profile.jsx           # Customer profile + loyalty points
    │   ├── admin/
    │   │   ├── AdminLogin.jsx    # Admin login
    │   │   ├── Dashboard.jsx     # Admin dashboard with revenue summary
    │   │   ├── Reservations.jsx  # All reservations management
    │   │   ├── Rooms.jsx         # Room CRUD
    │   │   ├── Customers.jsx     # Customer list + search
    │   │   └── Payments.jsx      # Payment history
    │   └── NotFound.jsx
    └── utils/
        └── formatDate.js
```

---

## Pages & Routes

| Route | Page | Auth | Airbnb Equivalent |
|-------|------|------|-------------------|
| `/` | Home | Public | Airbnb homepage |
| `/login` | Login | Public | Airbnb login |
| `/register` | Register | Public | Airbnb signup |
| `/rooms` | Room listing | Public | Airbnb search results |
| `/rooms/:id/book` | Booking page | Customer | Airbnb booking page |
| `/reservations` | My Reservations | Customer | Airbnb trips page |
| `/profile` | Profile | Customer | Airbnb profile |
| `/admin/login` | Admin Login | Public | Airbnb host login |
| `/admin` | Dashboard | Admin | Airbnb host dashboard |
| `/admin/reservations` | Reservations | Admin | Host reservations |
| `/admin/rooms` | Room management | Admin | Host listings |
| `/admin/customers` | Customers | Admin | Host guests |
| `/admin/payments` | Payments | Admin | Host payouts |

---

## Key Pages Design

### Page 1: Home (Airbnb Homepage)
- Full-width hero image/banner
- Central search bar: check-in date, check-out date, guests
- "Search" button → navigates to `/rooms?check_in=X&check_out=Y&guests=N`
- Popular room types section (Standard, Deluxe, Suite, Penthouse cards)

### Page 2: Room Listing (Airbnb Search Results)
- Top filter bar (room type, price range)
- Grid of RoomCards (3 columns desktop, 2 tablet, 1 mobile)
- Each card: room image placeholder, type badge, price/night, max occupancy, "Book Now" button
- Paginated or infinite scroll

### Page 3: Room Detail + Booking (Airbnb Listing Page)
- Left: Room details (type, price, max occupancy, description)
- Right: Sticky booking card (like Airbnb's booking panel)
  - Date range, guest count
  - Price breakdown (nights × price/night)
  - "Reserve" button

### Page 4: My Reservations (Airbnb Trips)
- Tab layout: Upcoming / Past / Cancelled
- Card per reservation with room info, dates, status badge
- "Cancel" and "Pay" action buttons

### Page 5: Admin Dashboard
- Stat cards (total revenue, total reservations, total customers)
- Quick action buttons
- Recent reservations table

---

## API Integration

```javascript
// src/api/client.js
const API_BASE = '/api';  // Proxied to localhost:8080

// Axios instance with auto-auth headers
axiosInstance = axios.create({ baseURL: API_BASE });
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect to /login on 401
axiosInstance.interceptors.response.use(null, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location = '/login';
  }
  return Promise.reject(error);
});
```

### API Endpoints

| Function | Endpoint | Method |
|----------|----------|--------|
| `register(data)` | `/api/register` | POST |
| `customerLogin(data)` | `/api/login` | POST |
| `adminLogin(data)` | `/api/admin/login` | POST |
| `getProfile()` | `/api/profile` | GET |
| `getAvailableRooms(params)` | `/api/rooms?check_in=&check_out=` | GET |
| `createReservation(data)` | `/api/reservations` | POST |
| `getMyReservations()` | `/api/my-reservations` | GET |
| `cancelReservation(id)` | `/api/reservations/{id}/cancel` | POST |
| `makePayment(id, data)` | `/api/reservations/{id}/pay` | POST |
| `getAllReservations()` | `/api/admin/reservations` | GET |
| `updateReservationStatus(id, status)` | `/api/admin/reservations/{id}/status` | PATCH |
| `getRooms()` | `/api/admin/rooms` | GET |
| `createRoom(data)` | `/api/admin/rooms` | POST |
| `updateRoom(id, data)` | `/api/admin/rooms/{id}` | PUT |
| `getCustomers()` | `/api/admin/customers` | GET |
| `searchCustomers(name)` | `/api/admin/customers/search?name=` | GET |
| `getPayments()` | `/api/admin/payments` | GET |
| `getRevenue()` | `/api/admin/revenue` | GET |

---

## CORS Fix Needed on Backend

The API needs to allow the frontend origin. Add CORS middleware in `api/main.go`:

```go
// Add CORS middleware in api/main.go
// In main(), before routes:
r.Use(func(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if r.Method == "OPTIONS" { w.WriteHeader(http.StatusOK); return }
        next.ServeHTTP(w, r)
    })
})
```

In development, Vite proxy handles this automatically.

---

## Implementation Order (Phases)

### Phase 1: Project Setup (30 min)
1. Initialize React + Vite project in `/frontend`
2. Install dependencies: tailwindcss, react-router-dom, axios, lucide-react, react-datepicker
3. Configure Tailwind, Vite proxy (`/api` → `localhost:8080`)
4. Create `api/client.js`, `context/AuthContext.jsx`, `App.jsx` with routes

### Phase 2: Layout + Auth (2 hours)
5. Build `Navbar` (logo, search bar, user dropdown, login/register buttons)
6. Build `Footer`
7. Build `Login` page, `Register` page
8. Build `AuthContext` (store token, login/logout, auto-fetch profile)
9. Build `ProtectedRoute` component
10. Build `AdminLogin` page

### Phase 3: Customer Pages (3-4 hours)
11. Build `Home` page (hero + search form)
12. Build `RoomCard` component
13. Build `Rooms` listing page (grid + date filter)
14. Build `RoomDetail` / Booking page (room info + booking panel)
15. Build `MyReservations` page (upcoming/past/cancelled tabs)
16. Build `Profile` page (user info + loyalty points)

### Phase 4: Admin Pages (2-3 hours)
17. Build `Dashboard` (stat cards + revenue)
18. Build `Reservations` management page (table + status update)
19. Build `Rooms` CRUD page
20. Build `Customers` page (list + search)
21. Build `Payments` page

### Phase 5: Polish (1 hour)
22. Responsive design (mobile, tablet, desktop)
23. Loading states + error handling
24. Airbnb-style color palette: primary `#FF385C`, gray `#222222`

---

## Airbnb-Style Design Guidelines

### Colors
- Primary: `#FF385C` (Airbnb red/pink)
- Primary hover: `#D9324E`
- Text: `#222222` (almost black)
- Secondary text: `#717171` (gray)
- Border: `#DDDDDD` (light gray)
- Background: `#FFFFFF` (white) / `#F7F7F7` (light gray)

### Typography
- Font family: `Circular, -apple-system, BlinkMacSystemFont, Roboto, sans-serif`
- Large headings: 32px, font-weight 600
- Section titles: 22px, font-weight 600
- Body text: 16px, font-weight 400
- Small text: 14px, font-weight 400

### Components
- Cards: `rounded-xl`, `shadow-lg`, hover `shadow-xl`
- Buttons: `rounded-lg`, `font-semibold`, `transition-all`
- Inputs: `rounded-lg`, `border-gray-300`, `focus:border-black`
- Badges: `rounded-full`, `px-3 py-1`, `text-sm`

---

## Run Commands

```bash
# Start backend API
go run ./api

# Start frontend (in /frontend directory)
cd frontend
npm run dev

# Build frontend for production
npm run build
```

---

## Dependencies to Install

```bash
# Core
cd frontend
npm install react react-dom react-router-dom axios

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Icons + UI
npm install lucide-react react-datepicker

# Dev
npm install -D @vitejs/plugin-react
```

---

## Backend API Reference

### Current Backend Status
- API runs on `localhost:8080`
- All endpoints start with `/api`
- JWT authentication via `Authorization: Bearer <token>` header
- JSON request/response format
- Database triggers prevent double-booking
- Transaction safety in reservation creation

### Important Backend Models

**Room Types:**
- `Standard`
- `Deluxe`
- `Suite`
- `Penthouse`

**Reservation Status:**
- `pending`
- `confirmed`
- `checked_in`
- `checked_out`
- `cancelled`

**Payment Methods:**
- `cash`
- `credit_card`
- `online`

**Payment Status:**
- `pending`
- `completed`
- `failed`
- `refunded`

### Known Backend Limitations
1. No image support - rooms don't have photos (use placeholder images)
2. No reviews/ratings system
3. No messaging between guests and hosts
4. No calendar availability view (just list of available rooms)

---

## Estimated Timeline

**Total: ~8-10 hours of work**

**Phase 1:** 30 min  
**Phase 2:** 2 hours  
**Phase 3:** 3-4 hours  
**Phase 4:** 2-3 hours  
**Phase 5:** 1 hour  

**Total Files:** ~30 React components/pages  
**Total Lines:** ~3000-4000 lines of JSX/CSS

---

## Next Steps

1. ✅ Backend API complete and tested
2. ⬜ Add CORS middleware to backend (if needed for production)
3. ⬜ Create frontend directory structure
4. ⬜ Install dependencies
5. ⬜ Implement Phase 1: Project Setup
6. ⬜ Implement Phase 2: Layout + Auth
7. ⬜ Implement Phase 3: Customer Pages
8. ⬜ Implement Phase 4: Admin Pages
9. ⬜ Implement Phase 5: Polish
10. ⬜ Test full flow end-to-end
11. ⬜ Deploy

Ready to start Phase 1!