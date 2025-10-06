import React from 'react';
import { Box, Paper } from '@mui/material';
import {
  MenuOpen,
  ChatBubbleOutline,
  Description,
  FolderOpen
} from '@mui/icons-material';

const NAV_ICONS = [
  { Icon: MenuOpen, action: 'toggleSidebar' },
  { Icon: ChatBubbleOutline, action: 'newChat' },
  { Icon: Description, path: '/dashboard' },
  { Icon: FolderOpen, path: '/documents' }
];

export default function ChatHeader({ handleNewChat, onToggleSidebar }) {
  return (
    <Box sx={{ position: 'fixed', top: 15, left: 20, display: 'flex', gap: 1.5 }}>
      <Paper
        sx={{
          borderRadius: '50%',
          width: 45,
          height: 45,
          border: '1px solid #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          bgcolor: '#f6f6f6',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.15)'
        }}
      >
        L
      </Paper>

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