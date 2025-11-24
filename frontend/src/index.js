import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App';

const theme = createTheme({
  palette: {
    primary: { main: '#1d4ed8' },
    secondary: { main: '#0ea5e9' },
    text: {
      primary: '#0f172a',
      secondary: '#4b5563'
    }
  },
  typography: {
    fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    button: { fontWeight: 700 }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
