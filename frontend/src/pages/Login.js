import React from "react";
import { Link } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider, IconButton} from "@mui/material";
import { Google } from '@mui/icons-material';

export default function Login() {
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
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ backgroundColor: "black", mb: 2 }}
            >
              Log In
            </Button>

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
