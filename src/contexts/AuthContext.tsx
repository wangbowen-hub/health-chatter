import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthResponse } from '../types/chat';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (credentials: LoginCredentials & { email: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储的认证信息
    const initAuth = async () => {
      try {
        const savedUser = authService.getCurrentUser();
        if (savedUser && authService.isTokenValid()) {
          setUser(savedUser);
        } else {
          authService.clearAuth();
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        authService.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: LoginCredentials & { email: string }) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.register(credentials);
      setUser(authResponse.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};