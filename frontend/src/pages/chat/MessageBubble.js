import React from 'react';
import { Typography } from '@mui/material';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <Typography
      sx={{
        mb: 1.4,
        fontSize: 16,
        maxWidth: '80%',
        textAlign: isUser ? 'right' : 'left',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        bgcolor: isUser ? '#efefef' : '#fff',
        border: '1px solid #eee',
        borderRadius: '12px',
        px: 2,
        py: 1,
        lineHeight: 1.6,
        boxShadow: isUser
          ? '2px 2px 0 rgba(0,0,0,0.16)'
          : '1px 1px 0 rgba(0,0,0,0.22)',
        whiteSpace: 'pre-line'
      }}
    >
      {message.text}
    </Typography>
  );
}