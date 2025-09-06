import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // 从localStorage恢复token和用户信息
    this.token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        this.clearAuth();
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }

      // 保存认证信息
      this.setAuth(data.token, data.user);
      return data;
    } catch (error) {
      console.error('注册错误:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 保存认证信息
      this.setAuth(data.token, data.user);
      return data;
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  }

  async verifyToken(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearAuth();
        return null;
      }

      const data = await response.json();
      this.user = data.user;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      console.error('验证token失败:', error);
      this.clearAuth();
      return null;
    }
  }

  logout(): void {
    this.clearAuth();
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  isAdmin(): boolean {
    return !!this.user?.isAdmin;
  }

  async getUsersCount(): Promise<number> {
    if (!this.isAdmin()) throw new Error('仅管理员可用');
    const resp = await this.authenticatedFetch(`${API_BASE_URL}/auth/admin/users/count`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || '获取用户总数失败');
    }
    const data = await resp.json();
    return data.count ?? 0;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  private setAuth(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  // 获取带认证头的fetch配置
  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // 带认证的fetch请求
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    // 如果返回401，清除认证信息
    if (response.status === 401) {
      this.clearAuth();
      throw new Error('认证已过期，请重新登录');
    }

    return response;
  }
}