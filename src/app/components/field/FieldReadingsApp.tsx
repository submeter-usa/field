'use client';

import React, { useState, useLayoutEffect } from 'react';
import LoginPage from './LoginPage';
import ReadingsPage from './ReadingsPage';

interface AuthState {
  isLoggedIn: boolean;
  fieldUserId: string;
  fieldUsername: string;
}

// Custom hook to safely read localStorage without triggering warnings
function useLocalStorage(key: string, defaultValue: string): string {
  const [value, setValue] = useState(defaultValue);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setValue(stored);
    }
  }, [key]);

  return value;
}

export default function FieldReadingsApp() {
  const [isMounted, setIsMounted] = useState(false);
  const fieldUserId = useLocalStorage('fieldUserId', '');
  const fieldUsername = useLocalStorage('fieldUsername', '');

  useLayoutEffect(() => {// eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted on client
  if (!isMounted) {
    return null;
  }

  const isLoggedIn = !!(fieldUserId && fieldUsername);

  const handleLoginSuccess = (id: string, username: string) => {
    localStorage.setItem('fieldUserId', id);
    localStorage.setItem('fieldUsername', username);
    // Force page reload to update state
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('fieldUserId');
    localStorage.removeItem('fieldUsername');
    // Force page reload to update state
    window.location.reload();
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