import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Paper,
  IconButton
} from '@mui/material';
import {
  Add,
  InsertDriveFile,
  MoreHoriz,
  MenuOpen,
  LogoutRounded
} from '@mui/icons-material';
import { useDocuments } from '../../hooks/useDocuments';
import { splitDocuments } from '../../utils/documentUtils';

export default function ChatSidebar({
  open,
  onClose,
  handleNewChat
}) {
  const navigate = useNavigate();
  const { documents: userDocuments, loading } = useDocuments();
  
  // split documents into recent and previous
  const { recent, previous } = splitDocuments(userDocuments, 3);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  return (
    <Drawer
      anchor='left'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 300,
            bgcolor: '#fff',
            borderRight: '1.5px solid #000',
            boxShadow: '3px 0 0 rgba(0,0,0,0.10)'
          }
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Legal Document
            </Typography>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              AI Assistant
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#000' }}>
            <MenuOpen sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Button
          variant='outlined'
          onClick={handleNewChat}
          sx={{
            justifyContent: 'flex-start',
            border: '1.5px solid #000',
            borderRadius: 2,
            color: '#000',
            textTransform: 'none',
            mb: 1,
            gap: 1,
            py: 1.2,
            boxShadow: '2px 2px 0 #00000020',
            '&:hover': { bgcolor: '#f8f8f8' }
          }}
          startIcon={<Add />}
        >
          New Chat
        </Button>

        <Button
          variant='outlined'
          onClick={() => navigate('/documents')}
          sx={{
            justifyContent: 'flex-start',
            border: '1.5px solid #000',
            borderRadius: 2,
            color: '#000',
            textTransform: 'none',
            mb: 1,
            gap: 1,
            py: 1.2,
            boxShadow: '2px 2px 0 #00000020',
            '&:hover': { bgcolor: '#f8f8f8' }
          }}
          startIcon={<InsertDriveFile />}
        >
          My files
        </Button>



        <Typography sx={{ fontWeight: 700, mb: 1 }}>Recent</Typography>
        {loading ? (
          <Typography sx={{ fontSize: 14, color: 'gray' }}>Loading...</Typography>
        ) : recent.length > 0 ? (
          recent.map((doc) => (
            <Paper
              key={doc.id}
              onClick={() => navigate(`/chat/${doc.id}`)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 1.2,
                py: 0.8,
                border: '1.5px solid #000',
                borderRadius: 2,
                boxShadow: '2px 2px 0 #00000020',
                mb: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f8f8f8' }
              }}
            >
              <Typography sx={{ fontSize: 14 }}>{doc.filename}</Typography>
              <IconButton size='small' sx={{ color: '#000' }}>
                <MoreHoriz />
              </IconButton>
            </Paper>
          ))
        ) : (
          <Typography sx={{ fontSize: 14, color: 'gray' }}>No recent chats</Typography>
        )}

        <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Previous</Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {loading ? (
            <Typography sx={{ fontSize: 14, color: 'gray' }}>Loading...</Typography>
          ) : previous.length > 0 ? (
            previous.map((doc) => (
              <Paper
                key={doc.id}
                onClick={() => navigate(`/chat/${doc.id}`)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 1.2,
                  py: 0.8,
                  border: '1.5px solid #000',
                  borderRadius: 2,
                  boxShadow: '2px 2px 0 #00000020',
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f8f8f8' }
                }}
              >
                <Typography sx={{ fontSize: 14 }}>{doc.filename}</Typography>
                <IconButton size='small' sx={{ color: '#000' }}>
                  <MoreHoriz />
                </IconButton>
              </Paper>
            ))
          ) : (
            <Typography sx={{ fontSize: 14, color: 'gray' }}>No previous chats</Typography>
          )}
        </Box>

        <Box
          sx={{
            borderTop: '1px solid #ddd',
            mt: 2,
            pt: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1.5px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}
            >
              U
            </Box>
            <Typography>User</Typography>
          </Box>
          <IconButton onClick={handleLogout} sx={{ color: '#000' }}>
            <LogoutRounded />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}