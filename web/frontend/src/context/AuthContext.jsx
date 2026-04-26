import React, { useState, useEffect, createContext } from "react";
import { customerLogin, adminLogin, getProfile } from "../api/client.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAdmin(userData.is_admin || false);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
          logout();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const loginCustomer = async (credentials) => {
    try {
      const response = await customerLogin(credentials);
      const { token, customer } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...customer, is_customer: true, is_admin: false }),
      );

      setUser({ ...customer, is_customer: true, is_admin: false });
      setIsAdmin(false);
      setIsAuthenticated(true);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const loginAdmin = async (credentials) => {
    try {
      const response = await adminLogin(credentials);
      const { token, staff } = response.data;

      const userData = {
        ...staff,
        is_customer: false,
        is_admin: true,
        customer_id: staff.staff_id, // Map staff_id to customer_id for consistency
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAdmin(true);
      setIsAuthenticated(true);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Admin login failed",
      };
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      const updatedUser = {
        ...response.data,
        is_customer: true,
        is_admin: false,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  };

  const value = {
    user,
    isAdmin,
    isAuthenticated,
    loading,
    loginCustomer,
    loginAdmin,
    logout,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
