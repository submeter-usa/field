'use client';

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Box,
  Card,
  Stack,
  Alert,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

interface LoginPageProps {
  onLoginSuccess: (id: string, username: string) => void;
}

interface ErrorResponse {
  message: string;
}

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
      const axiosError = err as AxiosError<ErrorResponse>;
      const message = axiosError.response?.data?.message || 'Login failed. Check credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Field Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Employee Portal
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Enter username"
                required
                disabled={loading}
                autoComplete="username"
              />

              <TextField
                fullWidth
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading}
                autoComplete="current-password"
              />

              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <LoadingButton
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                loading={loading}
              >
                Login
              </LoadingButton>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Box>
  );
}