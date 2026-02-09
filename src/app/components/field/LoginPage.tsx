'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { loginStyles as styles } from './styles';

interface LoginPageProps {
  onLoginSuccess: (id: string, username: string) => void;
}

/**
 * LoginPage
 * 
 * Handles:
 * - Username/password input
 * - /api/field/auth/login call
 * - Error display
 */
export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/field/auth/login', {
        login,
        pwd: password,
      });

      if (response.status === 200) {
        const { id, login: username } = response.data;
        onLoginSuccess(id, username);
      }
    } catch (err: unknown) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <h1 style={styles.loginTitle}>Field Readings</h1>
        <p style={styles.loginSubtitle}>Employee Portal</p>

        <form onSubmit={handleLogin} style={styles.loginForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Enter username"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}