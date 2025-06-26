import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginFormData } from '../types/chat';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AuthContextType {
  user: User | null;
  login: (loginData: LoginFormData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// 模拟用户数据库
const mockUsers = [
  { username: 'admin', password: 'admin123', email: 'admin@example.com' },
  { username: 'user', password: 'user123', email: 'user@example.com' },
  { username: 'demo', password: 'demo123', email: 'demo@example.com' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('current-user', null);
  const [isLoading, setIsLoading] = useState(false);

  // 检查登录状态的有效性（可选：检查过期时间等）
  useEffect(() => {
    if (user) {
      // 这里可以添加token验证逻辑
      console.log('用户已登录:', user.username);
    }
  }, [user]);

  const login = async (loginData: LoginFormData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 验证用户凭证
      const foundUser = mockUsers.find(
        u => u.username === loginData.username && u.password === loginData.password
      );
      
      if (foundUser) {
        const newUser: User = {
          id: generateId(),
          username: foundUser.username,
          email: foundUser.email,
          loginTime: new Date(),
        };
        
        setUser(newUser);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('登录错误:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};