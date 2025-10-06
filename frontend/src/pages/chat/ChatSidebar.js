import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import {
  Add,
  InsertDriveFile,
  FolderOpen,
  Search,
  MoreHoriz,
  MenuOpen,
  OpenInNew
} from '@mui/icons-material';

export default function ChatSidebar({
  open,
  onClose,
  handleNewChat
}) {
  // needs backend. get user's recent conversations
  const recent = ['Sample title 1', 'Sample title 2', 'Sample title 3'];
  // needs backend. get user's previous conversations
  const previous = [
    'Sample title 4',
    'Sample title 5',
    'Sample title 6',
    'Sample title 7',
    'Sample title 8',
    'Sample title 9'
  ];

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

        {/* needs backend. route to files page */}
        <Button
          variant='outlined'
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

        {/* needs backend. route to folders page */}
        <Button
          variant='outlined'
          sx={{
            justifyContent: 'flex-start',
            border: '1.5px solid #000',
            borderRadius: 2,
            color: '#000',
            textTransform: 'none',
            mb: 2,
            gap: 1,
            py: 1.2,
            boxShadow: '2px 2px 0 #00000020',
            '&:hover': { bgcolor: '#f8f8f8' }
          }}
          startIcon={<FolderOpen />}
        >
          Folders
        </Button>

        {/* needs backend. search conversations */}
        <OutlinedInput
          placeholder='Search'
          startAdornment={
            <InputAdornment position='start'>
              <Search />
            </InputAdornment>
          }
          sx={{
            borderRadius: 2,
            '& .MuiOutlinedInput-notchedOutline': {
              border: '1.5px solid #000'
            },
            boxShadow: '2px 2px 0 #00000020',
            mb: 2,
            height: 44
          }}
        />

        <Typography sx={{ fontWeight: 700, mb: 1 }}>Recent</Typography>
        {recent.map((t, i) => (
          <Paper
            key={i}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 1.2,
              py: 0.8,
              border: '1.5px solid #000',
              borderRadius: 2,
              boxShadow: '2px 2px 0 #00000020',
              mb: 1
            }}
          >
            <Typography sx={{ fontSize: 14 }}>{t}</Typography>
            {/* needs backend. edit/delete options */}
            <IconButton size='small' sx={{ color: '#000' }}>
              <MoreHoriz />
            </IconButton>
          </Paper>
        ))}

        <Typography sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Previous</Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {previous.map((t, i) => (
            <Paper
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 1.2,
                py: 0.8,
                border: '1.5px solid #000',
                borderRadius: 2,
                boxShadow: '2px 2px 0 #00000020',
                mb: 1
              }}
            >
              <Typography sx={{ fontSize: 14 }}>{t}</Typography>
              {/* needs backend. edit/delete options */}
              <IconButton size='small' sx={{ color: '#000' }}>
                <MoreHoriz />
              </IconButton>
            </Paper>
          ))}
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
          {/* needs backend. user settings/logout */}
          <IconButton sx={{ color: '#000' }}>
            <OpenInNew />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}