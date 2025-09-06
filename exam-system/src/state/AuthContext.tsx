import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' };

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isLoading: false };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true
  });

  const authService = AuthService.getInstance();

  useEffect(() => {
    // 应用启动时验证token
    const verifyAuth = async () => {
      try {
        const user = await authService.verifyToken();
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        console.error('验证认证失败:', error);
        dispatch({ type: 'SET_USER', payload: null });
      }
    };

    verifyAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.login({ phone, password });
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (phone: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.register({ phone, password });
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: !!state.user,
    isLoading: state.isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};