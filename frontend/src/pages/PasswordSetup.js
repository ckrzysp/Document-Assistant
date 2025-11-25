import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Modal for new OAuth users to set their password
export default function PasswordSetup({ open, onClose, userData }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/set-password`, {
        user_id: userData.user_id,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      onClose(true);
    } catch (err) {
      console.error('Failed to set password:', err);
      setError('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} 
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Set Your Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete your registration with a password
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
              Welcome, <strong>{userData?.user_name}</strong>!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please set a password for your account to continue using the application.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            helperText="Password must be at least 6 characters long"
            error={password.length > 0 && password.length < 6}
          />
          
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            error={confirmPassword.length > 0 && password !== confirmPassword}
            helperText={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords do not match" : ""}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading || password.length < 6 || password !== confirmPassword}
            sx={{ 
              backgroundColor: "#4159FD",
              fontSize: '1rem',
              textTransform: 'none'
            }}
          >
            {loading ? 'Setting Password...' : 'Set Password & Continue'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}