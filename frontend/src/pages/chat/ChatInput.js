import React, { useRef } from 'react';
import { Paper, TextField, InputAdornment, IconButton } from '@mui/material';
import { AttachFile, ArrowUpward } from '@mui/icons-material';

export default function ChatInput({ input, setInput, sendMsg, canChat, loading, uploadFile }) {
  const fileRef = useRef(null);
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) sendMsg();
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
        variant='standard'
        placeholder='Type your message...'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        InputProps={{
          disableUnderline: true,
          startAdornment: (
            <InputAdornment position="start" sx={{ width: '12px' }} />
          ),
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton 
                onClick={() => fileRef.current?.click()}
                sx={{ color: '#000' }}
              >
                <AttachFile />
              </IconButton>
              <input 
                type="file" 
                ref={fileRef} 
                onChange={uploadFile}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              <IconButton
                onClick={sendMsg}
                disabled={!canChat || !input.trim() || loading}
                sx={{
                  bgcolor: '#000',
                  color: '#fff',
                  ml: 1,
                  width: 36,
                  height: 36,
                  '&:hover': { bgcolor: '#000' },
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