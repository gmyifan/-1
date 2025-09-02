import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 1 | 2 | 3;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevation = 1,
  padding = 'medium'
}) => {
  const cardClasses = [
    'card',
    `card--elevation-${elevation}`,
    `card--padding-${padding}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};