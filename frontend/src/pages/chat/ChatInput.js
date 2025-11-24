import React from 'react';
import { Paper, TextField, InputAdornment, IconButton } from '@mui/material';
import { ArrowUpward } from '@mui/icons-material';

export default function ChatInput({ input, setInput, sendMsg, canChat, loading, hasUploadedFile }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasUploadedFile && canChat && input.trim()) {
        sendMsg();
      }
    }
  };


  return (
    <Paper
      sx={{
        width: 'min(880px, 90vw)',
        border: '1.5px solid #000',
        borderRadius: '18px',
        boxShadow: '3px 3px 0 rgba(0,0,0,0.2)',
        p: 1,
        bgcolor: '#fff',
        mt: 'auto',
        mb: 4
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={6}
        variant='standard'
        placeholder={hasUploadedFile ? 'Type your message...' : 'Please upload your document before asking questions...'}
        value={input}
        onChange={(e) => {
          if (hasUploadedFile) {
            setInput(e.target.value);
          }
        }}
        disabled={!hasUploadedFile}
        onKeyDown={handleKeyPress}
        sx={{
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: '#999',
            color: '#999'
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#999',
            opacity: 1
          }
        }}
        InputProps={{
          disableUnderline: true,
          startAdornment: (
            <InputAdornment position="start" sx={{ width: '12px' }} />
          ),
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                onClick={sendMsg}
                disabled={!hasUploadedFile || !canChat || !input.trim() || loading}
                sx={{
                  bgcolor: '#4159FD',
                  color: '#fff',
                  width: 36,
                  height: 36,
                  '&:hover': { bgcolor: '#4159FD' },
                  '&:disabled': { opacity: 0.6 }
                }}
              >
                <ArrowUpward />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Paper>
  );
}
