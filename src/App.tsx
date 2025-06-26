import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { LoginForm } from './components/LoginForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  return user ? <ChatInterface /> : <LoginForm />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;