import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div className="footer__section">
            <div className="footer__title">系统信息</div>
            <div className="footer__links">
              <div className="footer__link">使用指南</div>
              <div className="footer__link">常见问题</div>
              <div className="footer__link">技术支持</div>
            </div>
          </div>
          
          <div className="footer__section">
            <div className="footer__title">考试规则</div>
            <div className="footer__links">
              <div className="footer__link">考试须知</div>
              <div className="footer__link">评分标准</div>
              <div className="footer__link">证书说明</div>
            </div>
          </div>
          
          <div className="footer__section">
            <div className="footer__title">关于我们</div>
            <div className="footer__links">
              <div className="footer__link">团队介绍</div>
              <div className="footer__link">联系方式</div>
              <div className="footer__link">隐私政策</div>
            </div>
          </div>
        </div>
        
        <div className="footer__bottom">
          <div className="footer__copyright">
            © 2025 网络安全与信息化知识测试系统. All rights reserved.
          </div>
          <div className="footer__version">
            Version 1.0.0 | Built with React & TypeScript
          </div>
        </div>
      </div>
    </footer>
  );
};