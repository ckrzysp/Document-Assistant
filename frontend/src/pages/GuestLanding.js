// src/pages/GuestLanding.js
import React from "react";
import { Link } from "react-router-dom";
import {Box, Typography, Button} from "@mui/material";

export default function GuestLanding() {
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
      {/* 'log in' and 'sign up' header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          p: 2,
          gap: 2,
        }}
      >
        <Link to="/login">
          <Button variant="text" sx={{ color: "#000", fontWeight: "bold" }}>
            Login
          </Button>
        </Link>
        <Link to="/register">
          <Button
            variant="outlined"
            sx={{ color: "#000", borderColor: "#000", fontWeight: "bold" }}
          >
            Sign up
          </Button>
        </Link>
      </Box>

      {/* center content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
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
          Hi! Welcome to
        </Typography>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", mb: 4
           }}
        >
          Legal Document AI Assistant!
        </Typography>

        {/* 'start chat' and 'get to know us' buttons */}
        <Box sx={{ display: "flex", gap: 3 }}>
          <Link to="/login">
          <Button
            variant="outlined"
            sx={{
              borderRadius: "12px",
              px: 4,
              py: 2,
              fontWeight: "bold",
              color: "#000",
              borderColor: "#000",
            }}
          >
            Start Chatting
          </Button>
          </Link>
          <Button
            variant="outlined"
            sx={{
              borderRadius: "12px",
              px: 4,
              py: 2,
              fontWeight: "bold",
              color: "#000",
              borderColor: "#000",
            }}
          >
            Get to know us
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
