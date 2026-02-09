'use client';

import React, { useState } from 'react';
import LoginPage from './LoginPage';
import ReadingsPage from './ReadingsPage';

/**
 * FieldReadingsApp
 * 
 * Main app controller
 * - Manages login state
 * - Handles localStorage
 * - Routes between Login / Readings pages
 */
export default function FieldReadingsApp() {
  // Initialize state from localStorage directly
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('fieldUserId');
    }
    return false;
  });

  const [fieldUserId, setFieldUserId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fieldUserId') || '';
    }
    return '';
  });

  const [fieldUsername, setFieldUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fieldUsername') || '';
    }
    return '';
  });

  const handleLoginSuccess = (id: string, username: string) => {
    localStorage.setItem('fieldUserId', id);
    localStorage.setItem('fieldUsername', username);
    setFieldUserId(id);
    setFieldUsername(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fieldUserId');
    localStorage.removeItem('fieldUsername');
    setFieldUserId('');
    setFieldUsername('');
    setIsLoggedIn(false);
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