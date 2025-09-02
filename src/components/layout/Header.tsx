import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <div className="header__logo-icon">🛡️</div>
          <div className="header__logo-text">
            <div className="header__title">网络安全与信息化知识测试</div>
            <div className="header__subtitle">在线考试系统</div>
          </div>
        </div>
        
        <nav className="header__nav">
          <div className="header__nav-item">
            <span className="header__nav-icon">📚</span>
            <span>题库管理</span>
          </div>
          <div className="header__nav-item">
            <span className="header__nav-icon">📊</span>
            <span>考试统计</span>
          </div>
          <div className="header__nav-item">
            <span className="header__nav-icon">⚙️</span>
            <span>设置</span>
          </div>
        </nav>
      </div>
    </header>
  );
};