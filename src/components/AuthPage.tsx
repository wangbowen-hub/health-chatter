import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types/chat';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isLoading } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    await login(credentials);
  };

  const handleRegister = async (credentials: LoginCredentials & { email: string }) => {
    await register(credentials);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsLogin(false)}
            isLoading={isLoading}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsLogin(true)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};