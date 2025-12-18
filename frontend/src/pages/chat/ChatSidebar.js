import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField
} from '@mui/material';
import {
  Add,
  InsertDriveFile,
  MoreHoriz,
  MenuOpen,
  LogoutRounded
} from '@mui/icons-material';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChatSidebar({
  open,
  onClose,
  handleNewChat
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('User');
  const [userLoading, setUserLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [chatActionLoading, setChatActionLoading] = useState(false);
  const [chatActionError, setChatActionError] = useState('');

  const sortedChats = [...chatHistory].sort((a, b) => b.id - a.id);
  const recentChats = sortedChats.slice(0, 3);
  const previousChats = sortedChats.slice(3);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setUserLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        if (response.data && response.data.name) {
          setUserName(response.data.name);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        // Fallback to localStorage if available
        const storedName = localStorage.getItem('user_name');
        if (storedName) {
          setUserName(storedName);
        }
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const loadChatHistory = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setChatLoading(false);
      return;
    }

    setChatLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chats/${userId}`);
      setChatHistory(response.data || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setChatHistory([]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (open) {
      loadChatHistory();
    }
  }, [open]);

  useEffect(() => {
    loadChatHistory();
  }, [location.pathname]);

  const handleMenuOpen = (event, chat) => {
    event.stopPropagation();
    event.preventDefault();
    
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX,
      chat: chat
    });
    setSelectedChat(chat);
    setChatActionError('');
  };

  const handleMenuClose = () => {
    setMenuPosition(null);
  };

  const openRenameDialog = () => {
    if (!selectedChat) return;
    setRenameValue(selectedChat.title || selectedChat.document_name || '');
    setRenameDialogOpen(true);
    setChatActionError('');
    handleMenuClose();
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setChatActionError('');
    handleMenuClose();
  };

  const handleRenameSubmit = async () => {
    const newName = renameValue.trim();
    if (!newName) {
      setChatActionError('Please enter a chat name');
      return;
    }

    if (!selectedChat) return;

    setChatActionLoading(true);
    setChatActionError('');
    try {
      const response = await axios.put(`${API_BASE_URL}/chat/${selectedChat.id}`, {
        name: newName
      });
      
      setChatHistory(chats =>
        chats.map(chat =>
          chat.id === selectedChat.id
            ? { ...chat, title: response.data.name || newName }
            : chat
        )
      );
      
      setRenameDialogOpen(false);
      setSelectedChat(null);
      setRenameValue('');
    } catch (error) {
      setChatActionError(error.response?.data?.detail || 'Failed to rename chat');
    } finally {
      setChatActionLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    setChatActionLoading(true);
    setChatActionError('');
    try {
      await axios.delete(`${API_BASE_URL}/chat/${selectedChat.id}`);
      
      setChatHistory(chats => chats.filter(chat => chat.id !== selectedChat.id));
      
      setDeleteDialogOpen(false);
      setSelectedChat(null);
      
      const currentPath = window.location.pathname;
      if (currentPath.includes(`/chat/${selectedChat.id}`)) {
        navigate('/chat/new');
      }
    } catch (error) {
      setChatActionError(error.response?.data?.detail || 'Failed to delete chat');
    } finally {
      setChatActionLoading(false);
    }
  };

  const handleCloseDialogs = () => {
    setRenameDialogOpen(false);
    setDeleteDialogOpen(false);
    setChatActionError('');
    setSelectedChat(null);
    setRenameValue('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_language');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuPosition && !event.target.closest('.custom-menu') && !event.target.closest('.menu-button')) {
        handleMenuClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuPosition]);

  const ChatItem = ({ chat }) => (
    <Paper
      onClick={() => navigate(`/chat/${chat.id}`)}
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
        '&:hover': { bgcolor: '#f8f8f8' },
        position: 'relative'
      }}
    >
      <Typography sx={{ fontSize: 14 }}>
        {chat.title || chat.document_name || 'Untitled chat'}
      </Typography>
      <IconButton 
        size='small' 
        className="menu-button"
        sx={{ color: '#000' }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleMenuOpen(e, chat);
        }}
      >
        <MoreHoriz />
      </IconButton>
    </Paper>
  );

  return (
    <>
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
              boxShadow: '3px 0 0 rgba(0,0,0,0.10)',
              height: '100vh',
              overflow: 'hidden'
            }
          }
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{ flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
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
              <IconButton onClick={onClose} sx={{ color: '#000', marginRight: -1 }}>
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
                width: '100%',
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
                width: '100%',
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

            <Typography sx={{ fontWeight: 700, mb: 1, mt: 1 }}>Recent</Typography>
            {chatLoading ? (
              <Typography sx={{ fontSize: 14, color: 'gray' }}>Loading...</Typography>
            ) : recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))
            ) : (
              <Typography sx={{ fontSize: 14, color: 'gray' }}>No recent chats</Typography>
            )}
          </Box>

          <Box sx={{ mt: 2, flexShrink: 0 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Previous</Typography>
          </Box>
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto',
          }}>
            {chatLoading ? (
              <Typography sx={{ fontSize: 14, color: 'gray' }}>Loading...</Typography>
            ) : previousChats.length > 0 ? (
              previousChats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
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
              justifyContent: 'space-between',
              flexShrink: 0
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
                {userLoading ? '' : userName.charAt(0).toUpperCase()}
              </Box>
              <Typography>
                {userLoading ? 'Loading...' : userName}
              </Typography>
            </Box>
            <IconButton onClick={handleLogout} sx={{ color: '#000' }}>
              <LogoutRounded />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      {menuPosition && (
        <Box
          className="custom-menu"
          sx={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left - 25 }px`, 
            zIndex: 1300,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
            width: '80px',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              py: 0.25 
            }}
          >
            <Box
              onClick={openRenameDialog}
              sx={{
                px: 1.5, 
                py: 0.75, 
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Rename
            </Box>
            <Box
              onClick={openDeleteDialog}
              sx={{
                px: 1.5, 
                py: 0.75,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#d32f2f',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.04)'
                }
              }}
            >
              Delete
            </Box>
          </Box>
        </Box>
      )}

      <Dialog 
        open={renameDialogOpen} 
        onClose={handleCloseDialogs} 
        fullWidth 
        maxWidth="xs"
      >
        <DialogTitle>Rename chat</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            label="Chat name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            sx={{ mt: 1 }}
          />
          {chatActionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {chatActionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={chatActionLoading}>Cancel</Button>
          <Button onClick={handleRenameSubmit} disabled={chatActionLoading}>
            {chatActionLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCloseDialogs} 
        fullWidth 
        maxWidth="xs"
      >
        <DialogTitle>Delete chat</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove the chat and its messages. Are you sure?
          </Typography>
          {chatActionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {chatActionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={chatActionLoading}>Cancel</Button>
          <Button
            onClick={handleDeleteChat}
            disabled={chatActionLoading}
            sx={{ color: '#d32f2f' }}
          >
            {chatActionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}