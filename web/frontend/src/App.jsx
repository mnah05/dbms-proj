import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Layout/ProtectedRoute.jsx';
import Navbar from './components/Layout/Navbar.jsx';
import Footer from './components/Layout/Footer.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Rooms from './pages/Rooms.jsx';
import RoomDetail from './pages/RoomDetail.jsx';
import MyReservations from './pages/MyReservations.jsx';
import Profile from './pages/Profile.jsx';
import Payment from './pages/Payment.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminReservations from './pages/admin/Reservations.jsx';
import AdminRooms from './pages/admin/Rooms.jsx';
import AdminCustomers from './pages/admin/Customers.jsx';
import AdminPayments from './pages/admin/Payments.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:id/book" element={<RoomDetail />} />

              {/* Protected Customer Routes */}
              <Route
                path="/reservations"
                element={
                  <ProtectedRoute>
                    <MyReservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reservations/:id/pay"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reservations"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminReservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rooms"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminRooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCustomers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPayments />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
