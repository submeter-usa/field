'use client';

import React, { useState, useLayoutEffect } from 'react';
import axios from 'axios';
import LoginPage from './LoginPage';
import ReadingsPage from './ReadingsPage';

export default function FieldReadingsApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [fieldUserId, setFieldUserId] = useState('');
  const [fieldUsername, setFieldUsername] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useLayoutEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('/api/field/auth/session');
        if (response.data.authenticated) {
          setFieldUserId(response.data.id);
          setFieldUsername(response.data.login);
        }
      } catch {
        // No valid session
      } finally {
        setIsCheckingSession(false);
        setIsMounted(true);
      }
    };

    checkSession();
  }, []);

  // Don't render anything until mounted and session checked
  if (!isMounted || isCheckingSession) {
    return null;
  }

  const isLoggedIn = !!(fieldUserId && fieldUsername);

  const handleLoginSuccess = (id: string, username: string) => {
    setFieldUserId(id);
    setFieldUsername(username);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/field/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setFieldUserId('');
      setFieldUsername('');
    }
  };

  return isLoggedIn ? (
    <ReadingsPage
      fieldUserId={fieldUserId}
      fieldUsername={fieldUsername}
      onLogout={handleLogout}
    />
  ) : (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  );
}