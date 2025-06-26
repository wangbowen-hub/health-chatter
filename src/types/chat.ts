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

// 添加用户相关类型定义
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  loginTime: Date;
}

export interface LoginFormData {
  username: string;
  password: string;
}