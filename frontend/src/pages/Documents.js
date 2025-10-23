import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Grid, Box, Button, LinearProgress, Alert, CircularProgress } from '@mui/material';
import { 
  InsertDriveFileOutlined,
  MoreHoriz,
  Logout,
  CloudQueueOutlined,
  Upload 
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useDocuments } from '../hooks/useDocuments';

export default function Documents() {
  const navigate = useNavigate();
  const [downloadError, setDownloadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { documents: files, loading, error } = useDocuments();
  const activeTab = 'folders';

  const handleOpenFile = (file) => {
    // Download file from backend
    axios.get(`${API_BASE_URL}/documents/${file.id}/download`, {
      responseType: 'blob'
    })
    .then(response => {
      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Failed to download file:', error);
      setDownloadError('Failed to download file. Please try again.');
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    setUploading(true);
    setDownloadError('');

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('name', file.name);
    formData.append('file', file);

    axios.post(`${API_BASE_URL}/create_chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(response => {
      // Redirect to the new chat with the uploaded document
      navigate(`/chat/${response.data.chat_id}`);
    })
    .catch(error => {
      console.error('Failed to upload file:', error);
      setDownloadError('Failed to upload file. Please try again.');
    })
    .finally(() => {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const DocumentsSidebar = (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <CloudQueueOutlined sx={{ fontSize: 20, mr: 1 }} />
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
              bgcolor: activeTab === 'all' ? '#ddd' : '#f3f3f3ff',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
              '&:hover': { bgcolor: activeTab === 'all' ? '#ddd' : '#f8f8f8' }
            }}
          >
            All Documents
          </Button>
        </Box>

        {/* commenting out for now since we are not sure if we wanna do this
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
          bgcolor: activeTab === 'folders' ? '#ddd' : '#f3f3f3ff',
          boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
          '&:hover': { bgcolor: activeTab === 'folders' ? '#ddd' : '#f8f8f8' }
        }}
      >
        Folders
      </Button>
      */ }

        <Box>
          <Button
            fullWidth
            variant='outlined'
            onClick={() => window.location.href = '/dashboard'}
            sx={{
              border: '1.2px solid #000',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              color: '#000',
              mt: 1,
              boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
              '&:hover': { bgcolor: '#f8f8f8' }
            }}
          >
            Go to Dashboard
          </Button>
          <Button
            fullWidth
            variant='outlined'
            onClick={() => window.location.href = '/chat/new'}
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
              gap: 1,
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
            <Box sx={{ flex: 1 }} />
            <Logout sx={{ fontSize: 20, cursor: 'pointer' }} onClick={handleLogout} />
          </Box>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 34,
            }}
          >
            My Files - All Documents
          </Typography>
          
          <Button
            variant='contained'
            component='label'
            startIcon={<Upload />}
            sx={{
              border: '1.2px solid #000',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              color: '#fff',
              bgcolor: '#000',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
              '&:hover': { 
                bgcolor: '#333',
              }
            }}
          >
            Upload New Document
            <input
              type='file'
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : files.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography sx={{ fontSize: 18, color: '#666' }}>
              No documents found. Upload your first document to get started!
            </Typography>
          </Box>
        ) : (
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
                  <InsertDriveFileOutlined sx={{ fontSize: 50 }} />
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
                  
                  <Typography  // file name restriction generated by AI 
                    sx={{ 
                    fontSize: 14, 
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    px: 0.5 
                    }} 
                  >
                    {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name }
                  </Typography> 

                  <Typography sx={{ fontSize: 12, color: '#555' }}>
                    {file.date}
                  </Typography>
                  <MoreHoriz
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
        )}
      </Box>
    </Box>
  );
}