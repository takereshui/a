import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { HomePage } from './components/HomePage';
import { ChatPage } from './components/ChatPage';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { Prompt } from './types';

type View = 'home' | 'chat' | 'login' | 'admin';

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (() => {
          setIsAuthenticated(!!session);
          if (!session && view === 'admin') {
            setView('home');
          }
        })();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [view]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  }

  function handlePromptSelect(prompt: Prompt) {
    setSelectedPrompt(prompt);
    setView('chat');
  }

  function handleLoginSuccess() {
    setIsAuthenticated(true);
    setView('admin');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setView('home');
  }

  if (view === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'admin' && isAuthenticated) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (view === 'chat' && selectedPrompt) {
    return (
      <ChatPage
        prompt={selectedPrompt}
        onBack={() => {
          setView('home');
          setSelectedPrompt(null);
        }}
      />
    );
  }

  return (
    <HomePage
      onPromptSelect={handlePromptSelect}
      onLoginClick={() => setView('login')}
    />
  );
}

export default App;
