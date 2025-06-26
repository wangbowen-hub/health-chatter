import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatInterface } from './components/ChatInterface';
import { AuthPage } from './components/AuthPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <ChatInterface /> : <AuthPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;