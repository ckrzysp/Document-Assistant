import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider, IconButton, Alert} from "@mui/material";
import { Google } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUserInfo = async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    return response.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });

      if (!loginResponse.data.success) {
        throw new Error('Login failed');
      }

      const userId = loginResponse.data.user_id;
      
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_email', email);
      
      const userInfo = await fetchUserInfo(userId);
      
      localStorage.setItem('user_name', userInfo.name);
      localStorage.setItem('user_language', userInfo.language || 'en');
      
      navigate('/dashboard');
      
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else if (error.response?.status === 404) {
        setError('User information not found');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        color: "#000",
      }}
    >
      {/* Header */}
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
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
          
          {/* title */}
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

        {/* Login form */}
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
            <form onSubmit={handleSubmit}>
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
              <IconButton sx={{ color: '#000' }}>
                <Google />
              </IconButton>
              Continue with Google
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}