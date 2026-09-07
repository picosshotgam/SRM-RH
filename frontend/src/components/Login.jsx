import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { loginRH } from '../utils/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginRH(username, password);
      if (data.success) {
        const authData = { loggedIn: true, user: data.user, role: data.role, email: data.email };
        localStorage.setItem('srm_auth', JSON.stringify(authData));
        onLogin(authData);
      } else {
        setError(data.message || 'Identifiants incorrects.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Une erreur réseau est survenue. Assurez-vous que le backend Laravel est démarré.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.card} className="card">
        <div style={styles.header}>
          <img src="/logo.jpg" alt="SRM Logo" style={styles.logo} />
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="username-input">
              <User size={16} /> Identifiant
            </label>
            <input
              id="username-input"
              type="text"
              className="form-input"
              placeholder="Ex: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              <Lock size={16} /> Mot de passe
            </label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', height: '46px' }}
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div style={styles.footer}>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'radial-gradient(circle at top right, var(--primary-light), var(--background))',
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem 2rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    textAlign: 'center',
  },
  header: {
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: '180px',
    height: 'auto',
    maxHeight: '140px',
    objectFit: 'contain',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    color: 'var(--secondary)',
    fontSize: '0.85rem',
    textAlign: 'left',
    marginBottom: '1rem',
    border: '1px solid rgba(225, 29, 72, 0.2)',
  },
  footer: {
    marginTop: '1.5rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid var(--border)',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  }
};
