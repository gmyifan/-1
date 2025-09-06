import React, { useState } from 'react';
import { AuthProvider, useAuth } from './state/AuthContext';
import { ExamProvider, useExam } from './state/ExamContext';
import { SimpleLoginScreen } from './components/auth/SimpleLoginScreen';
import { StartScreen } from './components/exam/StartScreen';
import { ExamScreen } from './components/exam/ExamScreen';
import { ResultScreen } from './components/exam/ResultScreen';
import { WrongQuestionsScreen } from './components/exam/WrongQuestionsScreen';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import './styles/App.css';

type AppScreen = 'start' | 'exam' | 'result' | 'wrongQuestions';

const ExamContent: React.FC = () => {
  const { examState, examResult } = useExam();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('start');

  const getCurrentScreen = () => {
    if (currentScreen === 'wrongQuestions') {
      return <WrongQuestionsScreen onBack={() => setCurrentScreen('start')} />;
    }

    if (examResult) {
      return <ResultScreen />;
    }
    
    if (examState && examState.status !== 'notStarted') {
      return <ExamScreen />;
    }
    
    return <StartScreen onViewWrongQuestions={() => setCurrentScreen('wrongQuestions')} />;
  };

  return (
    <div className="app">
      <Header onViewWrongQuestions={() => setCurrentScreen('wrongQuestions')} />
      <main className="app__main">
        {getCurrentScreen()}
      </main>
      <Footer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app">
        <div className="app__loading">
          <div className="app__loading-text">加载中...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SimpleLoginScreen />;
  }

  return (
    <ExamProvider>
      <ExamContent />
    </ExamProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;