import React from 'react';
import { useAuth } from '../../state/AuthContext';
import { Button } from '../ui/Button';
import { AuthService } from '../../services/AuthService';
import './Header.css';

interface HeaderProps {
  onViewWrongQuestions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onViewWrongQuestions }) => {
  const { user, logout, login } = useAuth();
  const [userCount, setUserCount] = React.useState<number | null>(null);
  const authService = React.useMemo(() => AuthService.getInstance(), []);
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (user?.isAdmin) {
          const n = await authService.getUsersCount();
          if (!cancelled) setUserCount(n);
        } else {
          if (!cancelled) setUserCount(null);
        }
      } catch (e) {
        console.warn('获取用户总数失败', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.isAdmin, authService]);

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <h1 className="header__title">网络安全与信息化知识测试</h1>
        </div>
        <div className="header__nav">
          <div className="header__user-info">
            <span className="header__phone">用户: {user?.phone}</span>
          </div>
          <div className="header__actions">
            {!user && (
              <Button
                variant="secondary"
                size="small"
                onClick={async () => {
                  try {
                    await login('19905416876', '694034080');
                  } catch (e) {
                    alert('管理员登录失败');
                  }
                }}
              >
                管理员登录
              </Button>
            )}
            {user?.isAdmin && (
              <span className="header__admin-count">用户总数：{userCount ?? '...'}</span>
            )}
            {onViewWrongQuestions && (
              <Button
                variant="secondary"
                size="small"
                onClick={onViewWrongQuestions}
              >
                错题集
              </Button>
            )}
            <Button
              variant="secondary"
              size="small"
              onClick={logout}
            >
              退出登录
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};