import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { LoginCredentials } from '../types/chat';

interface RegisterFormProps {
  onRegister: (credentials: LoginCredentials & { email: string }) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  isLoading,
}) => {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证表单
    if (!credentials.username.trim() || !credentials.email.trim() || !credentials.password) {
      setError('请填写完整的注册信息');
      return;
    }

    if (credentials.username.length < 3) {
      setError('用户名至少需要3个字符');
      return;
    }

    if (!credentials.email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (credentials.password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      await onRegister({
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '注册失败，请重试');
    }
  };

  const handleChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            创建账户
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            加入健康聊天社区
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="请输入用户名"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="请输入邮箱地址"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="请输入密码"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={credentials.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="请再次输入密码"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            已有账户？
            <button
              onClick={onSwitchToLogin}
              className="ml-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
              disabled={isLoading}
            >
              立即登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};