import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider, Alert} from "@mui/material";
import axios from 'axios';
import { API_BASE_URL } from '../config';
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    //Password should be at least 6 characters
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
        // Registration successful, redirect to login
        navigate('/login');
      }
    })
    .catch(error => {
      if (error.response?.status === 400) {
        setError('Email is already registered');
      } else {
        setError('Registration failed. Please try again.');
      }
    })
    .finally(() => {
      setLoading(false);
    });
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

        {/* Sign up form */}
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
              Continue with Google
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
