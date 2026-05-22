import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdjustmentForm from './components/AdjustmentForm';
import AdjustmentList from './components/AdjustmentList';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import JigChecklist from './components/JigChecklist';
import LoginPage from './components/LoginPage';
import { getCurrentUser, logout } from './api/authService';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import './index.css';

function AppContent() {
  const { t } = useLanguage();
  const [user, setUser] = useState(getCurrentUser());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentView, setCurrentView] = useState('interventions'); // 'interventions' or 'checklist'

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Global auto-refresh every 60 seconds
    const interval = setInterval(handleRefresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  // Determine role based on user
  const role = user.role;

  return (
    <div className="container" style={{ maxWidth: role === 'ADMIN' || role === 'MANAGER' ? '1400px' : '1400px' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <main style={{ marginTop: '2rem' }}>
        {role === 'SUPERVISOR' && (
          <>
            <AdjustmentForm user={user} onCreated={handleRefresh} />
            <AdjustmentList refreshTrigger={refreshTrigger} user={user} role="SUPERVISOR" />
          </>
        )}

        {role === 'PROCESS' && (
          currentView === 'interventions' ? (
            <AdjustmentList refreshTrigger={refreshTrigger} user={user} role="PROCESS" />
          ) : (
            <JigChecklist user={user} refreshTrigger={refreshTrigger} />
          )
        )}

        {role === 'ADMIN' && (
          currentView === 'interventions' ? (
            <AdminDashboard refreshTrigger={refreshTrigger} />
          ) : (
            <JigChecklist user={user} refreshTrigger={refreshTrigger} />
          )
        )}

        {role === 'MANAGER' && (
          <ManagerDashboard refreshTrigger={refreshTrigger} />
        )}

      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        &copy; 2026 {t('amsSolution')} - {t('allRightsReserved')}
      </footer>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
