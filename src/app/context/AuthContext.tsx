import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, User as ApiUser } from '../services/api';
import { toast } from 'sonner';

interface User {
  uid: string;
  full_name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (full_name: string, email: string, cpf: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      // Save tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      // Get full user data
      const userData = await api.getMe();
      setUser(userData);
      
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signup = async (full_name: string, email: string, cpf: string, password: string) => {
    try {
      const newUser = await api.signup(full_name, email, cpf, password);
      
      // Auto login after signup
      await login(email, password);
      
      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      toast.success('Logout realizado com sucesso!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};