import React, { useState } from 'react';
import { LayoutDashboard, FileText, CalendarRange, UserPlus, LogOut, Sun, Moon, Briefcase } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, theme, toggleTheme }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mission', label: 'Mission', icon: FileText },
    { id: 'conge', label: 'Congé', icon: CalendarRange },
    { id: 'ajouter_emploi', label: 'Ajouter un employé', icon: UserPlus },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      <aside className="sidebar">
        {/* Brand Header */}
        <div>
          <div style={styles.brand}>
            <img src="/logo.jpg" alt="SRM Logo" style={styles.logo} />
          </div>

          {/* User Badge */}
          <div style={styles.userProfile}>
            <div style={styles.avatar}>
              {user.user ? user.user.charAt(0) : 'R'}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.user || 'RH Agent'}</span>
              <span style={styles.userRole}>Ressources Humaines</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav style={styles.nav}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    ...styles.navItem,
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? '600' : '500',
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                  {isActive && <div style={styles.activeIndicator} />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Controls */}
        <div style={styles.footerControls}>
          {/* Theme Toggle */}
          <button 
            id="theme-toggle-btn"
            onClick={toggleTheme} 
            style={styles.controlButton}
            title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={18} style={styles.controlIcon} />
                <span>Mode Clair</span>
              </>
            ) : (
              <>
                <Moon size={18} style={styles.controlIcon} />
                <span>Mode Sombre</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button 
            id="logout-btn"
            onClick={() => setShowLogoutModal(true)} 
            style={{ ...styles.controlButton, ...styles.logoutButton }}
          >
            <LogOut size={18} style={styles.controlIcon} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirmation de déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}

const styles = {
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '1.5rem',
  },
  logo: {
    width: '100%',
    height: 'auto',
    maxHeight: '110px',
    objectFit: 'contain',
    padding: '0.25rem 0',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--background)',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '1rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  activeIndicator: {
    position: 'absolute',
    left: '0',
    top: '25%',
    height: '50%',
    width: '4px',
    backgroundColor: 'var(--primary)',
    borderRadius: '0 4px 4px 0',
  },
  footerControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
  },
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  controlIcon: {
    color: 'var(--text-muted)',
  },
  logoutButton: {
    color: 'var(--secondary)',
  },
};
export { styles };
