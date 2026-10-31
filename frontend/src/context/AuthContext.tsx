import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // Do not probe /auth/me on public auth screens to keep the console clean
      const isPublicAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some(
        (path) => window.location.pathname.startsWith(path)
      );

      if (isPublicAuthRoute) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.data) {
          setUser(res.data.data);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = (userData: User, token?: string) => {
    setUser(userData);
    if (token) {
      localStorage.setItem('brightloop_token', token);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('brightloop_token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
