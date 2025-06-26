export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 新增用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}