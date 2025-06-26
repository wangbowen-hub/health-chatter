import { User, LoginCredentials, AuthResponse } from '../types/chat';

const generateId = () => Math.random().toString(36).substr(2, 9);

// 模拟用户数据库
const USERS_STORAGE_KEY = 'health-chatter-users';
const AUTH_STORAGE_KEY = 'health-chatter-auth';

class AuthService {
  private getStoredUsers(): User[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  private saveAuth(authResponse: AuthResponse): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authResponse));
  }

  private getStoredAuth(): AuthResponse | null {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const auth = JSON.parse(stored);
      // 恢复日期对象
      auth.user.createdAt = new Date(auth.user.createdAt);
      auth.user.lastLoginAt = new Date(auth.user.lastLoginAt);
      auth.expiresAt = new Date(auth.expiresAt);
      return auth;
    }
    return null;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = this.getStoredUsers();
    const user = users.find(u => u.username === credentials.username);

    if (!user) {
      throw new Error('用户名不存在');
    }

    // 在实际应用中，这里应该验证密码哈希
    // 为了演示，我们使用简单的密码验证
    if (credentials.password !== 'password') {
      throw new Error('密码错误');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    this.saveUsers(users);

    const authResponse: AuthResponse = {
      user,
      token: generateId() + generateId(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
    };

    this.saveAuth(authResponse);
    return authResponse;
  }

  async register(credentials: LoginCredentials & { email: string }): Promise<AuthResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = this.getStoredUsers();

    // 检查用户名是否已存在
    if (users.some(u => u.username === credentials.username)) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    if (users.some(u => u.email === credentials.email)) {
      throw new Error('邮箱已被使用');
    }

    const newUser: User = {
      id: generateId(),
      username: credentials.username,
      email: credentials.email,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    users.push(newUser);
    this.saveUsers(users);

    const authResponse: AuthResponse = {
      user: newUser,
      token: generateId() + generateId(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
    };

    this.saveAuth(authResponse);
    return authResponse;
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  getCurrentUser(): User | null {
    const auth = this.getStoredAuth();
    return auth ? auth.user : null;
  }

  isTokenValid(): boolean {
    const auth = this.getStoredAuth();
    if (!auth) return false;
    
    return new Date() < auth.expiresAt;
  }

  clearAuth(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export const authService = new AuthService();