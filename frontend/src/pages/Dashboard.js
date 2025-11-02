import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Paper, Grid, Box, Button, IconButton, Alert, 
  CircularProgress, TextField, MenuItem 
} from '@mui/material';
import { 
  InsertDriveFileOutlined,
  MoreHoriz,
  Logout,
  History,
  Settings,
  Stars 
} from '@mui/icons-material';
import { useDocuments } from '../hooks/useDocuments';
import { API_BASE_URL } from '../config';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('history');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const { documents: files, loading, error } = useDocuments();
  
  // All settings states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: ''
  });

  const [nameData, setNameData] = useState({
    newName: '',
    password: ''
  });

  const [languageData, setLanguageData] = useState({
    newLanguage: '',
    password: ''
  });

  // Separate loading and message states for each section
  const [nameLoading, setNameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [nameMessage, setNameMessage] = useState({ type: '', text: '' });
  const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });
  const [languageMessage, setLanguageMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Get current user info from localStorage
  const currentUser = {
    name: localStorage.getItem('user_name') || 'User',
    email: localStorage.getItem('user_email') || '',
    language: localStorage.getItem('user_language') || 'en'
  };

  // Language name mapping function
  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ar': 'Arabic'
    };
    return languages[code] || code;
  };

  const handleInputChange = (setter) => (field) => (event) => {
    setter(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNameChange = async () => {
    if (!nameData.newName.trim()) {
      setNameMessage({ type: 'error', text: 'Please enter a new name' });
      return;
    }

    setNameLoading(true);
    setNameMessage({ type: '', text: '' });
    try {
      const userId = parseInt(localStorage.getItem('user_id'));
      const response = await axios.put(`${API_BASE_URL}/update_user`, {
        user_id: userId,
        name: nameData.newName,
        current_password: nameData.password
      });
      
      setNameMessage({ type: 'success', text: response.data.message });
      localStorage.setItem('user_name', nameData.newName);
      setNameData({ newName: '', password: '' });
    } catch (error) {
      setNameMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update name' 
      });
    } finally {
      setNameLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setEmailLoading(true);
    setEmailMessage({ type: '', text: '' });
    try {
      const userId = parseInt(localStorage.getItem('user_id'));
      const response = await axios.put(`${API_BASE_URL}/update_user`, {
        user_id: userId,
        email: emailData.newEmail,
        current_password: emailData.password
      });
      
      setEmailMessage({ type: 'success', text: response.data.message });
      localStorage.setItem('user_email', emailData.newEmail);
      setEmailData({ newEmail: '', password: '' });
    } catch (error) {
      setEmailMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update email' 
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLanguageChange = async () => {
    if (!languageData.newLanguage.trim()) {
      setLanguageMessage({ type: 'error', text: 'Please select a language' });
      return;
    }

    setLanguageLoading(true);
    setLanguageMessage({ type: '', text: '' });
    try {
      const userId = parseInt(localStorage.getItem('user_id'));
      const response = await axios.put(`${API_BASE_URL}/update_user`, {
        user_id: userId,
        language: languageData.newLanguage,
        current_password: languageData.password
      });
      
      setLanguageMessage({ type: 'success', text: response.data.message });
      localStorage.setItem('user_language', languageData.newLanguage);
      setLanguageData({ newLanguage: '', password: '' });
    } catch (error) {
      setLanguageMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update language' 
      });
    } finally {
      setLanguageLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      const userId = parseInt(localStorage.getItem('user_id'));
      const response = await axios.put(`${API_BASE_URL}/update_user`, {
        user_id: userId,
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      setPasswordMessage({ type: 'success', text: response.data.message });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update password' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleOpenFile = (file) => {
    window.open(`${API_BASE_URL}/documents/${file.id}/download`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_language');
    navigate('/login');
  };

  // Load chat history from backend
  useEffect(() => {
    const loadChatHistory = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;

      setChatLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/chats/${userId}`);
        console.log('Chat history response:', response.data);
        setChatHistory(response.data);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setChatLoading(false);
      }
    };

    if (activeTab === 'history') {
      loadChatHistory();
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {  
      case 'history':
        return (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 34, mb: 4 }}>
              Previous Chat
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {chatLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : chatHistory.length > 0 ? (
                chatHistory.map((chat, i) => (
                  <Paper
                    key={chat.id || i}
                    onClick={() => navigate(`/chat/${chat.document_id || chat.id}`)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 2,
                      py: 1,
                      border: '1.5px solid #000',
                      borderRadius: 2,
                      boxShadow: '2px 2px 0 #00000020',
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f8f8f8' }
                    }}
                  >
                    <Typography sx={{ fontSize: 14 }}>
                      {chat.title || chat.document_name || `Chat ${i + 1}`}
                    </Typography>
                    <IconButton size='small' sx={{ color: '#000' }}>
                      <MoreHoriz />
                    </IconButton>
                  </Paper>
                ))
              ) : (
                <Typography sx={{ fontSize: 14, color: 'gray', textAlign: 'center', mt: 4 }}>
                  No chat history found
                </Typography>
              )}
            </Box>
          </Box>
        );
      
      case 'documents':
        return (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 34, mb: 4 }}>
              Recent Documents
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <>
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
                        <Box sx={{ borderTop: '1px solid #000', width: '100%', mt: 2, pt: 1, textAlign: 'center', position: 'relative' }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', px: 0.5 }}>
                            {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name }
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: '#555' }}>
                            {file.date}
                          </Typography>
                          <MoreHoriz sx={{ position: 'absolute', right: 4, top: -30, fontSize: 22, color: '#000' }} />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Button
                  onClick={() => navigate('/documents')}
                  sx={{
                    textTransform: 'none',
                    textDecoration: 'underline',
                    fontWeight: 800,
                    color: '#000',
                    mt: 1,
                    mb: 2,
                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  View All Documents
                </Button>
              </>
            )}
          </Box>
        );

      case 'settings':
        return (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 34, mb: 4 }}>
              Account Settings
            </Typography>

            {/* Name Change Section */}
            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Change Your Name
              </Typography>
              
              {nameMessage.text && (
                <Alert severity={nameMessage.type} sx={{ mb: 2 }} onClose={() => setNameMessage({ type: '', text: '' })}>
                  {nameMessage.text}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Current Name" 
                  fullWidth 
                  variant="outlined" 
                  value={currentUser.name} 
                  disabled 
                />
                <TextField 
                  label="New Name" 
                  fullWidth 
                  variant="outlined" 
                  value={nameData.newName} 
                  onChange={handleInputChange(setNameData)('newName')} 
                />
                <TextField 
                  label="Confirm Password" 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={nameData.password} 
                  onChange={handleInputChange(setNameData)('password')} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleNameChange} 
                    disabled={nameLoading || !nameData.newName || !nameData.password} 
                    sx={{ 
                      textTransform: 'none', 
                      backgroundColor: 'black', 
                      minWidth: 200,
                      fontSize: 16,
                      py: 1
                    }}
                  >
                    {nameLoading ? <CircularProgress size={24} /> : 'Update Name'}
                  </Button>
                </Box>
              </Box>
            </Box>
            
            {/* Email Change Section */}
            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Change Email Address
              </Typography>

              {emailMessage.text && (
                <Alert severity={emailMessage.type} sx={{ mb: 2 }} onClose={() => setEmailMessage({ type: '', text: '' })}>
                  {emailMessage.text}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Current Email" 
                  fullWidth 
                  variant="outlined" 
                  value={currentUser.email} 
                  disabled 
                />
                <TextField 
                  label="New Email Address" 
                  fullWidth 
                  variant="outlined" 
                  value={emailData.newEmail} 
                  onChange={handleInputChange(setEmailData)('newEmail')} 
                />
                <TextField 
                  label="Confirm Password" 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={emailData.password} 
                  onChange={handleInputChange(setEmailData)('password')} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleEmailChange} 
                    disabled={emailLoading || !emailData.newEmail || !emailData.password} 
                    sx={{ 
                      textTransform: 'none', 
                      backgroundColor: 'black', 
                      minWidth: 200,
                      fontSize: 16,
                      py: 1
                    }}
                  >
                    {emailLoading ? <CircularProgress size={24} /> : 'Update Email'}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Language Change Section */}
            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Change Default Language
              </Typography>

              {languageMessage.text && (
                <Alert severity={languageMessage.type} sx={{ mb: 2 }} onClose={() => setLanguageMessage({ type: '', text: '' })}>
                  {languageMessage.text}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Current Language" 
                  fullWidth 
                  variant="outlined" 
                  value={getLanguageName(currentUser.language)} 
                  disabled 
                />
                <TextField 
                  select 
                  label="New Language" 
                  fullWidth 
                  variant="outlined" 
                  value={languageData.newLanguage} 
                  onChange={handleInputChange(setLanguageData)('newLanguage')}
                  sx={{
                    '& .MuiSelect-select': {
                      textAlign: 'left',
                      justifyContent: 'flex-start'
                    }
                  }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                  <MenuItem value="zh">Chinese</MenuItem>
                  <MenuItem value="ja">Japanese</MenuItem>
                  <MenuItem value="ar">Arabic</MenuItem>
                </TextField>
                <TextField 
                  label="Confirm Password" 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={languageData.password} 
                  onChange={handleInputChange(setLanguageData)('password')} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleLanguageChange} 
                    disabled={languageLoading || !languageData.newLanguage || !languageData.password} 
                    sx={{ 
                      textTransform: 'none', 
                      backgroundColor: 'black', 
                      minWidth: 200,
                      fontSize: 16,
                      py: 1
                    }}
                  >
                    {languageLoading ? <CircularProgress size={24} /> : 'Update Language'}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Password Change Section */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Change Password
              </Typography>

              {passwordMessage.text && (
                <Alert severity={passwordMessage.type} sx={{ mb: 2 }} onClose={() => setPasswordMessage({ type: '', text: '' })}>
                  {passwordMessage.text}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Current Password" 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={passwordData.currentPassword} 
                  onChange={handleInputChange(setPasswordData)('currentPassword')} 
                />
                <TextField 
                  label="New Password" 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={passwordData.newPassword} 
                  onChange={handleInputChange(setPasswordData)('newPassword')} 
                />
                <TextField 
                  label="Confirm New Password" 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={passwordData.confirmPassword} 
                  onChange={handleInputChange(setPasswordData)('confirmPassword')} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={handlePasswordChange} 
                    disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword} 
                    sx={{ 
                      textTransform: 'none', 
                      backgroundColor: 'black', 
                      minWidth: 200,
                      fontSize: 16,
                      py: 1
                    }}
                  >
                    {passwordLoading ? <CircularProgress size={24} /> : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const DashboardSidebar = (
    <>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 6 }}>
          <Stars sx={{ fontSize: 30, mr: 1 }}/>
          <Typography variant='h5' component='h1' sx={{ fontWeight: 'bold' }}>
            Dashboard
          </Typography>
        </Box>

        <Box sx={{ borderBottom: '1px solid #000', my: 2 }} />

        <Button
          fullWidth
          startIcon={<History />}
          variant={activeTab === 'history' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('history')}
          sx={{
            border: '1.2px solid #000',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: '#000',
            mb: 1.2,
            bgcolor: activeTab === 'history' ? '#ddd' : '#f3f3f3ff',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: activeTab === 'history' ? '#ddd' : '#f8f8f8' },
            justifyContent: 'flex-start',
            pl: 2
          }}
        >
          Chat History
        </Button>

        <Button
          fullWidth
          startIcon={<InsertDriveFileOutlined />}
          variant={activeTab === 'documents' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('documents')}
          sx={{
            border: '1.2px solid #000',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: '#000',
            mb: 1.2,
            bgcolor: activeTab === 'documents' ? '#ddd' : '#f3f3f3ff',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: activeTab === 'documents' ? '#ddd' : '#f8f8f8' },
            justifyContent: 'flex-start',
            pl: 2
          }}
        >
          Documents
        </Button>

        <Button
          fullWidth
          startIcon={<Settings />}
          variant={activeTab === 'settings' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('settings')}
          sx={{
            border: '1.2px solid #000',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: '#000',
            mb: 1.2,
            bgcolor: activeTab === 'settings' ? '#ddd' : '#f3f3f3ff',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: activeTab === 'settings' ? '#ddd' : '#f8f8f8' },
            justifyContent: 'flex-start',
            pl: 2
          }}
        >
          Settings
        </Button>
      </Box>
      
      <Box>
        <Button
          fullWidth
          variant='outlined'
          onClick={() => navigate('/chat/new')}
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
      
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
          <Paper sx={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, bgcolor: '#fff' }}>
            {currentUser.name.charAt(0).toUpperCase()}
          </Paper>
          <Typography sx={{ fontWeight: 600 }}>{currentUser.name}</Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={handleLogout} sx={{ color: '#000' }}>
            <Logout sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>          
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fff', color: '#000', overflow: 'hidden' }}>
      <Box sx={{ width: 240, borderRight: '1.5px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.2 }}>
        {DashboardSidebar}
      </Box>

      <Box sx={{ flex: 1, p: 5, overflow: 'auto' }}>
        {renderContent()}
      </Box>
    </Box>
  );
}