import React, { useState } from 'react';
import { AuthService } from '../../services/AuthService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './LoginScreen.css';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authService = AuthService.getInstance();

  const validatePhone = (phone: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // 验证手机号
    if (!validatePhone(phone)) {
      setError('请输入正确的11位手机号');
      return;
    }

    // 验证密码
    if (!password.trim()) {
      setError('密码不能为空');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await authService.login({ phone, password });
      } else {
        await authService.register({ phone, password });
      }
      
      onLoginSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  return (
    <div className="login-screen">
      <Card className="login-screen__card" elevation={3}>
        <div className="login-screen__header">
          <h1 className="login-screen__title">
            网络安全与信息化知识测试
          </h1>
          <div className="login-screen__subtitle">
            {isLogin ? '登录账户' : '注册新账户'}
          </div>

        <div className="login-screen__admin">
          <Button
            variant="secondary"
            size="small"
            disabled={loading}
            onClick={async () => {
              setError('');
              setLoading(true);
              try {
                await authService.login({ phone: '19905416876', password: '694034080' });
                onLoginSuccess();
              } catch (e) {
                setError(e instanceof Error ? e.message : '管理员登录失败');
              } finally {
                setLoading(false);
              }
            }}
          >
            管理员一键登录
          </Button>
        </div>
        </div>

        <form className="login-screen__form" onSubmit={handleSubmit}>
          <div className="login-screen__field">
            <label htmlFor="phone" className="login-screen__label">
              手机号
            </label>
            <input
              id="phone"
              type="tel"
              className="login-screen__input"
              placeholder="请输入11位手机号"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              required
            />
          </div>

          <div className="login-screen__field">
            <label htmlFor="password" className="login-screen__label">
              密码
            </label>
            <input
              id="password"
              type="password"
              className="login-screen__input"
              placeholder="请输入密码"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          {error && (
            <div className="login-screen__error">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="large"
            disabled={loading}
            className="login-screen__submit"
            onClick={() => handleSubmit()}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </Button>
        </form>

        <div className="login-screen__switch">
          <span className="login-screen__switch-text">
            {isLogin ? '还没有账户？' : '已有账户？'}
          </span>
          <button
            type="button"
            className="login-screen__switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? '立即注册' : '立即登录'}
          </button>
        </div>

        <div className="login-screen__info">
          <div className="login-screen__info-item">
            <div className="login-screen__info-icon">🔒</div>
            <div className="login-screen__info-text">
              登录后可保存错题记录，方便复习
            </div>
          </div>
          <div className="login-screen__info-item">
            <div className="login-screen__info-icon">📊</div>
            <div className="login-screen__info-text">
              查看历史考试成绩和统计信息
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};