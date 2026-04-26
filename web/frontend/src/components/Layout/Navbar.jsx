import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Calendar, Heart, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../ui/Button.jsx';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Don't show navbar on auth pages
  const isAuthPage = ['/login', '/register', '/admin/login'].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-[#DDDDDD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF385C] rounded-full flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#FF385C] text-2xl font-bold tracking-tight">StayHere</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  // Admin Menu
                  <>
                    <Link to="/admin" className="text-[#222222] hover:text-[#FF385C] font-medium">
                      Dashboard
                    </Link>
                    <Link to="/admin/reservations" className="text-[#222222] hover:text-[#FF385C] font-medium">
                      Reservations
                    </Link>
                    <Link to="/admin/rooms" className="text-[#222222] hover:text-[#FF385C] font-medium">
                      Rooms
                    </Link>
                    <div className="relative group">
                      <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <Menu className="w-4 h-4" />
                        <div className="w-8 h-8 bg-[#222222] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#DDDDDD] py-2 hidden group-hover:block">
                        <div className="px-4 py-2 border-b border-[#DDDDDD]">
                          <p className="font-semibold text-[#222222]">{user?.first_name} {user?.last_name}</p>
                          <p className="text-sm text-[#717171]">Admin</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-[#222222] hover:bg-gray-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // Customer Menu
                  <>
                    <Link to="/" className="text-[#222222] hover:text-[#FF385C] font-medium">
                      Explore
                    </Link>
                    <Link to="/reservations" className="text-[#222222] hover:text-[#FF385C] font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Trips
                    </Link>
                    <div className="relative group">
                      <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors border border-[#DDDDDD]">
                        <Menu className="w-4 h-4" />
                        <div className="w-8 h-8 bg-[#717171] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#DDDDDD] py-2 hidden group-hover:block">
                        <div className="px-4 py-2 border-b border-[#DDDDDD]">
                          <p className="font-semibold text-[#222222]">{user?.first_name} {user?.last_name}</p>
                          <p className="text-sm text-[#717171]">{user?.email}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-2 text-[#222222] hover:bg-gray-50">
                          Profile
                        </Link>
                        <Link to="/reservations" className="block px-4 py-2 text-[#222222] hover:bg-gray-50">
                          My Reservations
                        </Link>
                        <div className="border-t border-[#DDDDDD] mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-[#222222] hover:bg-gray-50 flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              // Guest Menu
              <>
                <Link to="/admin/login" className="text-[#222222] hover:text-[#FF385C] font-medium">
                  Admin Portal
                </Link>
                <div className="flex items-center gap-3">
                  <Link to="/register">
                    <Button variant="ghost">Sign up</Button>
                  </Link>
                  <Link to="/login">
                    <Button>Log in</Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#DDDDDD]">
          <div className="px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to="/admin/reservations" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                      Reservations
                    </Link>
                    <Link to="/admin/rooms" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                      Rooms
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left py-2 text-[#222222] font-medium">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                      Explore
                    </Link>
                    <Link to="/reservations" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                      My Reservations
                    </Link>
                    <Link to="/profile" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                      Profile
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left py-2 text-[#222222] font-medium">
                      Log out
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                  Sign up
                </Link>
                <Link to="/admin/login" className="block py-2 text-[#222222] font-medium" onClick={() => setIsMenuOpen(false)}>
                  Admin Portal
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
