import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Onboarding from './pages/Onboarding';
import Performance from './pages/Performance';
import Allocations from './pages/Allocations';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'people':
        return <People />;
      case 'onboarding':
        return <Onboarding />;
      case 'performance':
        return <Performance />;
      case 'allocations':
        return <Allocations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
