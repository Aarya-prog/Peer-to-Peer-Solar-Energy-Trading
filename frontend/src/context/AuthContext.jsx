import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on startup
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const login = async (email, password, rememberMe) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      if (response.data.success) {
        setUser(response.data.user);
        toast.success(`Welcome back, ${response.data.user.name}!`);
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role, referralCode) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, role, referralCode });
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Registration successful! Verify email link sent to inbox.');
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
