import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { LoginPage } from './components/LoginPage';
import { ChatLayout } from './components/ChatLayout';
import { AdminPage } from './components/AdminPage';

function App() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-red rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-charcoal rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-red rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-gray text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin page - accessible even without login for stats viewing
  if (currentPath === '/admin') {
    if (!user) {
      return <LoginPage />;
    }
    return <AdminPage onBack={() => navigateTo('/')} />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}

export default App;
