import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider, Alert, InputAdornment, IconButton, FormControlLabel, Checkbox} from "@mui/material";
import { Google, Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import PasswordSetup from './PasswordSetup';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    
    navigate('/dashboard');
  }, [getUserInfo, navigate]);

  // Process Google auth code
  const handleGoogleAuth = useCallback(async (code) => {
    setError('');
    setGoogleLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/google-auth`, {
        code: code,
        redirect_uri: `${window.location.origin}/register`
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
        navigate('/dashboard');
        return;
      }
      setError('Sign up with Google failed. Please try again.');
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

  // Handle email/password registration
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (rememberMe) {
      localStorage.setItem('remember_email', email);
    } else {
      localStorage.removeItem('remember_email');
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    axios.post(`${API_BASE_URL}/register`, {
      name,
      email,
      password,
      language: 'en'
    })
    .then(response => {
      if (response.data.message) {
        navigate('/login');
      }
    })
    .catch(err => {
      if (err.response?.status === 400) {
        setError('Email is already registered');
      } else {
        setError('Registration failed. Please try again.');
      }
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // Start Google OAuth flow
  const startGoogleSignup = () => {
    if (!googleConfig || !googleConfig.client_id) {
      setError('Authentication configuration not loaded. Please refresh the page.');
      return;
    }

    const redirectUri = googleConfig.redirect_uris.register;
    const params = new URLSearchParams({
      client_id: googleConfig.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile openid',
      access_type: 'offline',
      prompt: 'consent',
      state: 'signup'
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
          {configLoading ? 'Loading authentication...' : 'Creating your account with Google...'}
        </Typography>
        <Typography variant="body2" color="gray">
          Please wait while we complete your registration.
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
          bgcolor: "#fff",
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
                Join us Today!
              </Typography>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                Legal Document AI Assistant
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
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  pl: 3,
                  mb: 1.5,
                  fontWeight: 700,
                  fontSize: 24,
                  color: 'primary.main',
                  letterSpacing: '-0.02em',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    animation: 'pulse 1s linear infinite'
                  }
                }}
              >
                Register
              </Box>

              <form onSubmit={handleRegister}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  InputProps={{
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
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm((prev) => !prev)}
                          edge="end"
                          aria-label="toggle confirm password visibility"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  required
                />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ backgroundColor: "#4159FD", mb: 2 }}
              >
                {loading ? 'Signing up...' : 'Sign up'}
              </Button>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" color="gray">
                  Already have an account?{" "}
                  <Link to="/login" style={{ textDecoration: 'none', color: '#1d4ed8', fontWeight: 700 }}>
                    Sign in
                  </Link>
                </Typography>
              </Box>
              </form>

              <Divider textAlign="center">
                <Typography variant="body2">
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={startGoogleSignup}
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
                Sign up with Google
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