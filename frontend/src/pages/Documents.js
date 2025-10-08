import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Box, Button, LinearProgress } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudQueueOutlinedIcon from '@mui/icons-material/CloudQueueOutlined';

export default function Documents() {
  const [files, setFiles] = useState([]);

  const activeTab = 'folders';

  useEffect(() => {
    // replace with fetch() call
    const mockFiles = [
      {
        name: 'Sample_file.pdf',
        date: 'September 30, 2025',
        url: '/404'
      },
      {
        name: 'Sample_file_2.jpg',
        date: 'October 6, 2025',
        url: '/404'
      }
    ];
    setFiles(mockFiles);
  }, []);

  const handleOpenFile = (file) => {
    window.open(file.url, '_blank'); // open actual cloud storage  url later
  };

  const DocumentsSidebar = (
    <>
      <Box>
         <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <CloudQueueOutlinedIcon sx={{ fontSize: 20, mr: 1 }} />
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Storage</Typography>
        </Box>

        <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 10,
          borderRadius: 5,
          border: '1.5px solid #000',
          overflow:'hidden',
          bgcolor: '#ddd'
        }}
        >
          <LinearProgress
            variant='determinate'
            value={0}
            sx={{
              height: '100%',
              borderRadius: 5,
              bgcolor: 'transparent',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#000',
                borderRadius: 5
              }
            }}
          />
        </Box>
        <Typography sx={{ fontSize: 12, color: '#555' }}>
          0.0/1.0GB&nbsp;&nbsp;0%
        </Typography>

        <Box sx={{ borderBottom: '1px solid #000', my: 2 }} />

        <Button
          fullWidth
          variant={activeTab === 'all' ? 'contained' : 'outlined'}
          onClick={() => window.location.href = '/documents'}
          sx={{
            border: '1.2px solid #000',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: '#000',
            mb: 1.2,
            bgcolor: activeTab === 'all' ? '#ddd' : '#ecececff',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: activeTab === 'all' ? '#ddd' : '#f8f8f8' }
          }}
        >
          All Documents
        </Button>

        <Button
          fullWidth
          variant={activeTab === 'folders' ? 'contained' : 'outlined'}
          onClick={() => window.location.href = '/folders'}
          sx={{
            border: '1.2px solid #000',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: '#000',
            bgcolor: activeTab === 'folders' ? '#ddd' : 'transparent',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: activeTab === 'folders' ? '#ddd' : '#f8f8f8' }
          }}
        >
          Folders
        </Button>
      </Box>

      <Box>
        <Button
          fullWidth
          variant='outlined'
          onClick={() => window.location.href = '/chat'}
          sx={{
            border: '1.2px solid #000',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: '#000',
            mt: 1,
            mb: 2,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: '#f8f8f8' }
          }}
        >
          Back to Chatbot
        </Button>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 0.5
          }}
        >
          <Paper
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              bgcolor: '#fff'
            }}
          >
            U
          </Paper>
          <Typography sx={{ fontWeight: 600 }}>User</Typography>
          <LogoutIcon sx={{ fontSize: 20 }} />
        </Box>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fff', color: '#000' }}>
      <Box
        sx={{
          width: 240,
          borderRight: '1.5px solid #000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2.2
        }}
      >
        {DocumentsSidebar}
      </Box>

      <Box sx={{ flex: 1, p: 5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 34,
            mb: 4
          }}
        >
          My Files - All Documents
        </Typography>

        <Grid container spacing={3}>
          {files.map((file, i) => (
            <Grid item key={i}>
              <Paper
                onClick={() => handleOpenFile(file)}
                sx={{
                  width: 160,
                  height: 160,
                  border: '1.5px solid #000',
                  borderRadius: 3,
                  p: 2,
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 50 }} />
                </Box>
                <Box
                  sx={{
                    borderTop: '1px solid #000',
                    width: '100%',
                    mt: 2,
                    pt: 1,
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#555' }}>
                    {file.date}
                  </Typography>
                  <MoreHorizIcon
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: -30,
                      fontSize: 22,
                      color: '#000'
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
