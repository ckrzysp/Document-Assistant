import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider, IconButton, Alert, FormControlLabel, Checkbox, InputAdornment} from "@mui/material";
import { Google, AlternateEmail, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import PasswordSetup from './PasswordSetup';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [googleConfig, setGoogleConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const navigate = useNavigate();

  // Load Google OAuth configuration
  useEffect(() => {
    const loadGoogleConfig = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/config/google-oauth`);
        setGoogleConfig(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to load Google OAuth config:', err);
        setError('Authentication service is currently unavailable. Please try again later.');
      } finally {
        setConfigLoading(false);
      }
    };
    
    loadGoogleConfig();
  }, []);

  // Get user info from backend
  const getUserInfo = useCallback(async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    return response.data;
  }, []);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(async (userData) => {
    const userId = userData.user_id;
    
    localStorage.setItem('user_id', userId);
    
    const userInfo = await getUserInfo(userId);
    localStorage.setItem('user_name', userInfo.name);
    localStorage.setItem('user_email', userInfo.email);
    localStorage.setItem('user_language', userInfo.language || 'en');
    
    navigate('/chat/new');
  }, [getUserInfo, navigate]);

  // Process Google auth code
  const handleGoogleAuth = useCallback(async (code) => {
    setError('');
    setGoogleLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/google-auth`, {
        code: code,
        redirect_uri: `${window.location.origin}/login`
      });
      
      if (data.success) {
        if (data.needs_password_setup && data.is_new_user) {
          setPendingUser({
            user_id: data.user_id,
            user_email: data.user_email,
            user_name: data.user_name
          });
          setShowPasswordModal(true);
        } else {
          await handleAuthSuccess(data);
        }
      } else {
        setError('Google authentication failed');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      // If user is already logged in, redirect to dashboard
      if (localStorage.getItem('user_id')) {
        navigate('/chat/new');
        return;
      }
      setError('Sign in with Google failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [handleAuthSuccess, navigate]);

  // Handle password modal close
  const handlePasswordModalClose = useCallback(async (passwordSet) => {
    setShowPasswordModal(false);
    
    if (passwordSet && pendingUser) {
      await handleAuthSuccess(pendingUser);
    }
    
    setPendingUser(null);
  }, [pendingUser, handleAuthSuccess]);

  // Prefill remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Check for Google OAuth callback when component loads
  useEffect(() => {
    const checkGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        setError(`Google authentication failed: ${error}`);
        return;
      }
      
      if (code) {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        await handleGoogleAuth(code);
      }
    };

    checkGoogleCallback();
  }, [handleGoogleAuth]);

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });

      if (!data.success) {
        throw new Error('Login failed');
      }

      const userId = data.user_id;
      
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_email', email);
      if (rememberMe) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }
      
      const userInfo = await getUserInfo(userId);
      
      localStorage.setItem('user_name', userInfo.name);
      localStorage.setItem('user_language', userInfo.language || 'en');
      
      navigate('/chat/new');
      
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 404) {
        setError('User information not found');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Start Google OAuth flow
  const startGoogleLogin = () => {
    if (!googleConfig || !googleConfig.client_id) {
      setError('Authentication configuration not loaded. Please refresh the page.');
      return;
    }

    const redirectUri = googleConfig.redirect_uris.login;
    const params = new URLSearchParams({
      client_id: googleConfig.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile openid',
      access_type: 'offline',
      prompt: 'consent',
      state: 'login'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = authUrl;
  };

  // Show loading during Google auth or config loading
  if (googleLoading || configLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#fff",
          color: "#000",
          textAlign: "center"
        }}
      >
        <Box
          component="img"
          src="/LDAALogo.png"
          alt="Legal Document AI Assistant Logo"
          sx={{
            height: 150,
            width: 'auto',
            mb: 3
          }}
        />
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
          Legal Document AI Assistant
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {configLoading ? 'Loading authentication...' : 'Signing in with Google...'}
        </Typography>
        <Typography variant="body2" color="gray">
          Please wait while we complete your authentication.
        </Typography>
      </Box>
    );
  }

  // Show configuration error
  if (error && error.includes('Authentication service')) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#fff",
          color: "#000",
          textAlign: "center",
          px: 2
        }}
      >
        <Box
          component="img"
          src="/LDAALogo.png"
          alt="Legal Document AI Assistant Logo"
          sx={{
            height: 150,
            width: 'auto',
            mb: 3
          }}
        />
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
          Configuration Error
        </Typography>
        <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
          {error}
        </Typography>
        <Typography variant="body2" color="gray" sx={{ mb: 3 }}>
          Please check your backend server connection and refresh the page.
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ backgroundColor: "#1d4ed8" }}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/LDAALogo.png"
              alt="Legal Document AI Assistant Logo"
              sx={{
                height: 150,
                width: 'auto',
                mr: 2, 
              }}
            />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                Legal Document
              </Typography>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                AI Assistant
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: 420,
                p: 4,
                border: '1px solid #0f172a',
                background: '#fff',
                textAlign: 'left'
              }}
            >
              <form onSubmit={handleLogin}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AlternateEmail fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          aria-label="toggle password visibility"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  required
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        color="primary"
                        sx={{ p: 0.3 }}
                      />
                    }
                    label="Remember me"
                    sx={{ color: 'text.secondary', userSelect: 'none' }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ backgroundColor: "#1d4ed8", mb: 2 }}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </Button>
              </form>

              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  color="gray" 
                  sx = {{ mb: 2 }}
                >
                  Don't have an account? <Link to="/register" style={{ textDecoration: 'none' }}>Sign up</Link>
                </Typography>
              </Box>

              <Divider textAlign="center">
                <Typography variant="body2">
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={startGoogleLogin}
                disabled={loading || googleLoading || !googleConfig}
                sx={{
                  mt: 2,
                  py: 1,
                  fontWeight: "bold",
                  textTransform: 'none',
                  color: "#1d4ed8",
                  border: "1.5px solid #0f172a",
                }}
                startIcon={<Google />}
              >
                Continue with Google
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>

      <PasswordSetup
        open={showPasswordModal}
        onClose={handlePasswordModalClose}
        userData={pendingUser}
      />
    </>
  );
}