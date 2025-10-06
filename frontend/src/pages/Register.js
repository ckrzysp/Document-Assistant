import React from "react";
import {Box, Typography, Button, Paper, TextField, Divider} from "@mui/material";
export default function Register() {
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
            <TextField
              fullWidth
              label="Set your username"
              variant="outlined"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Set your password"
              type="password"
              variant="outlined"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Enter your password again"
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
              Sign up
            </Button>

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
