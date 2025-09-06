import React, { useState } from 'react';
import { useAuth } from '../../state/AuthContext';

export const SimpleLoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证手机号
    if (!/^\d{11}$/.test(phone)) {
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
        await login(phone, password);
      } else {
        await register(phone, password);
      }
    } catch (error: any) {
      setError(error.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '10px',
          color: '#333',
          fontSize: '24px'
        }}>
          {isLogin ? '用户登录' : '用户注册'}
        </h1>
        
        <p style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#666',
          fontSize: '14px'
        }}>
          网络安全与信息化知识测试系统
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入11位手机号"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            {isLogin ? '还没有账户？' : '已有账户？'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            {isLogin ? '立即注册' : '立即登录'}
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ marginRight: '8px' }}>🔒</span>
            <span style={{ fontSize: '14px', color: '#666' }}>
              登录后可保存错题记录，方便复习
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '8px' }}>📊</span>
            <span style={{ fontSize: '14px', color: '#666' }}>
              查看历史考试成绩和统计信息
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};