import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MissionForm from './components/MissionForm';
import CongeForm from './components/CongeForm';
import EmployeeManager from './components/EmployeeManager';

export default function App() {
  const [auth, setAuth] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');

  // Initialize Auth on mount
  useEffect(() => {
    // Auth Check
    const storedAuth = localStorage.getItem('srm_auth');
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
    
    // Theme Check
    const storedTheme = localStorage.getItem('srm_theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const handleLogin = (authData) => {
    setAuth(authData);
  };

  const handleLogout = () => {
    localStorage.removeItem('srm_auth');
    setAuth(null);
    setActiveTab('dashboard');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('srm_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  // Content Selection
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'mission':
        return <MissionForm />;
      case 'conge':
        return <CongeForm />;
      case 'ajouter_emploi':
        return <EmployeeManager />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Layout */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={auth}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
