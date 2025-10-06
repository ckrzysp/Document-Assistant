import React from 'react';
import { Box, Paper } from '@mui/material';
import {
  MenuOpen,
  ChatBubbleOutline,
  Description,
  Stars
} from '@mui/icons-material';

const NAV_ICONS = [
  { Icon: MenuOpen, action: 'toggleSidebar' },
  { Icon: ChatBubbleOutline, action: 'newChat' },
  { Icon: Description, path: '/documents' },
  { Icon: Stars, path: '/dashboard' }
];

export default function ChatHeader({ handleNewChat, onToggleSidebar }) {
  return (
    <Box sx={{ position: 'fixed', top: 15, left: 20, display: 'flex', gap: 1.5 }}>
      <Box
        component="img"
        src="/LDAALogo.png"
        alt="Legal Document AI Assistant Logo"
        sx={{
        height: 50,
        width: 'auto',
        }}
      />

      <Paper
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          border: '1px solid #000',
          boxShadow: '2px 3px 0 rgba(0,0,0,0.12)'
        }}
      >
        {NAV_ICONS.map((item, i) => {
          const { Icon, path, action } = item;

          const handleClick = () => {
            if (action === 'newChat') {
              handleNewChat();
            } else if (path) {
              window.location.href = path;
            }
          };

          return (
            <Icon
              key={i}
              onClick={action === 'newChat' || path ? handleClick : undefined}
              onMouseEnter={action === 'toggleSidebar' ? onToggleSidebar : undefined}
              sx={{
                color: '#000',
                cursor: path || action ? 'pointer' : 'default',
                fontSize: 24,
                '&:hover': path || action ? { opacity: 0.7 } : {}
              }}
            />
          );
        })}
      </Paper>
    </Box>
  );
}