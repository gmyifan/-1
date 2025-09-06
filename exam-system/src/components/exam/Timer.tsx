import React from 'react';
import { useExam } from '../../state/ExamContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './Timer.css';

export const Timer: React.FC = () => {
  const { examState, formatTime } = useExam();

  if (!examState) {
    return null;
  }

  const timeRemaining = examState.timeRemaining;
  const formattedTime = formatTime(timeRemaining);
  const isWarning = timeRemaining < 10 * 60 * 1000; // 10 minutes
  const isDanger = timeRemaining < 5 * 60 * 1000; // 5 minutes

  const timerClasses = [
    'timer',
    isWarning ? 'timer--warning' : '',
    isDanger ? 'timer--danger' : ''
  ].filter(Boolean).join(' ');

  return (
    <Card className="timer-card" elevation={2}>
      <div className={timerClasses}>
        <div className="timer__icon">⏱️</div>
        <div className="timer__content">
          <div className="timer__label">剩余时间</div>
          <div className="timer__time">{formattedTime}</div>
        </div>
      </div>
    </Card>
  );
};