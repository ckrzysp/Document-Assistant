import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider, Alert} from "@mui/material";
import { Google } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import PasswordSetup from './PasswordSetup';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

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
    const clientId = "763420082617-j42eaoshh28sv6dncameph7gjqhei4qc.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${window.location.origin}/register`);
    const scope = encodeURIComponent("email profile openid");
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=signup`;
    
    window.location.href = authUrl;
  };

  // Show loading during Google auth
  if (googleLoading) {
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
          Creating your account with Google...
        </Typography>
        <Typography variant="body2" color="gray">
          Please wait while we complete your registration.
        </Typography>
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
          color: "#000",
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
          }}
        >
          <Box
            component="img"
            src="/LDAALogo.png"
            alt="Legal Document AI Assistant Logo"
            sx={{
              height: 150,
              width: 'auto',
            }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            Join us Today! Sign up for 
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: "bold", mb: 4 }}
          >
            Legal Document AI Assistant
          </Typography>

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
                width: 350,
                padding: 4,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'black',
              }}
            >
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
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ backgroundColor: "black", mb: 2 }}
                >
                  {loading ? 'Signing up...' : 'Sign up'}
                </Button>
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
                disabled={loading || googleLoading}
                sx={{
                  mt: 2,
                  py: 1,
                  borderRadius: "12px",
                  fontWeight: "bold",
                  textTransform: 'none',
                  color: "black",
                  border: "2px solid gray",
                }}
              >
                <Google sx={{ mr: 1 }} />
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