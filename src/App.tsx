import React from 'react';
import { ExamProvider, useExam } from './state/ExamContext';
import { StartScreen } from './components/exam/StartScreen';
import { ExamScreen } from './components/exam/ExamScreen';
import { ResultScreen } from './components/exam/ResultScreen';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import './App.css';

const AppContent: React.FC = () => {
  const { examState, examResult } = useExam();

  const getCurrentScreen = () => {
    if (examResult) {
      return <ResultScreen />;
    }
    
    if (examState && examState.status !== 'notStarted') {
      return <ExamScreen />;
    }
    
    return <StartScreen />;
  };

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        {getCurrentScreen()}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ExamProvider>
      <AppContent />
    </ExamProvider>
  );
}

export default App;