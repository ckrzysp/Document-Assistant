import React from "react";
import { Link } from "react-router-dom";
import {Box, Typography, Button, Paper, TextField, Divider} from "@mui/material";

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
          sx={{ fontWeight: "bold", mb: 4 }}
        >
          AI Assistant
        </Typography>

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
              Continue with Google
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
