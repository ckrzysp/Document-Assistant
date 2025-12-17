import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ChatHeader from './ChatHeader';
import ChatWelcome from './ChatWelcome';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';
import axios from 'axios';
import { API_BASE_URL, LANG_TRANSLATIONS } from '../../config';
import { useDocuments } from '../../hooks/useDocuments';

export default function Chat() {
  const { docId } = useParams();
  const navigate = useNavigate();
  
  // State management for chat functionality
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('');
  const [translating, setTranslating] = useState(false);
  const [canChat, setCanChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [processingFile, setProcessingFile] = useState(false);
  const [processingFileName, setProcessingFileName] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);

  // Refs for file input and scroll anchoring
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const { documents: userDocuments } = useDocuments();

  // Convert language codes to full names
  const getLanguageFromCode = (code) => {
    const languageMap = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ar': 'Arabic'
    };
    return languageMap[code];
  };

  // Show language selection prompt with optional user preference
  const showLanguagePrompt = (delay = 100) => {
    // check if prefered language is set, automatically select it if it is
    const userLanguageCode = localStorage.getItem('user_language');
    if (userLanguageCode) {
      const fullLanguageName = getLanguageFromCode(userLanguageCode);
      if (fullLanguageName && LANG_TRANSLATIONS[fullLanguageName]) {
        // still show the prompt so user can change if needed
        setLang(fullLanguageName);
        setTimeout(() => {
          chooseLang(fullLanguageName);
        }, delay);
        setMessages(m => [...m, { role: 'assistant', type: 'lang' }]);
        return;
      }
    }
    
    // make user manually select from dropdown otherwise
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', type: 'lang' }]);
    }, delay);
  };

  // Load existing chat or document based on ID
  const loadChatOrDocument = useCallback(async (id) => {
    try {
      // First, try to load as existing chat ID
      const response = await axios.get(`${API_BASE_URL}/chat/${id}`);
      const chatData = response.data;
      
      console.log('Loading existing chat:', chatData);
      
      // Transform messages from backend format to frontend format
      const transformedMessages = (chatData.messages || []).map(msg => ({
        role: msg.role,
        text: msg.content
      }));
      
      setCurrentChatId(chatData.id);
      
      if (transformedMessages.length === 0) {
        setHasUploadedFile(true);
        setCanChat(true);
        setMessages([
          { role: 'user', text: `Uploaded ${chatData.document_name}` }
        ]);
        showLanguagePrompt();
        return;
      }
      
      // Load the actual chat history
      setMessages(transformedMessages);
      setHasUploadedFile(true);
      setCanChat(true);
      return;
    } catch (error) {
      console.log('Not a chat ID, treating as document ID');
    }
    
    // If not found as chat ID, treat as document ID
    loadDocumentChat(id);
  }, []);

  // Load chat from existing document
  const loadDocumentChat = useCallback((documentId) => {
    const document = userDocuments.find(doc => doc.id === parseInt(documentId));
    if (document) {
      setMessages([
        { role: 'user', text: `Uploaded ${document.filename}` }
      ]);
      setCurrentChatId(documentId);
      setHasUploadedFile(true);
      setCanChat(true);
      showLanguagePrompt();
    }
  }, [userDocuments]);

  // Initialize chat based on URL parameter
  useEffect(() => {
    if (docId === 'new') {
      resetChat();
    } else if (docId) {
      loadChatOrDocument(docId);
    }
  }, [docId, loadChatOrDocument]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset chat to initial state
  const resetChat = useCallback(() => {
    setMessages([]);
    setInput('');
    setLang('');
    setTranslating(false);
    setCanChat(false);
    setCurrentChatId(null);
    setHasUploadedFile(false);
    setSelectedDocument('');
    setProcessingFile(false);
    setProcessingFileName('');
    setAiProcessing(false);
  }, []);

  // Send message to backend
  const sendMsg = () => {
    if (!input.trim() || !currentChatId || aiProcessing) return;
    
    const messageText = input;
    setMessages(m => [...m, { role: 'user', text: messageText }]);
    setInput('');
    setAiProcessing(true);
    
    // Add AI processing indicator
    setMessages(m => [...m, { 
      role: 'assistant', 
      text: '',
      type: 'aiProcessing' 
    }]);

    axios.post(`${API_BASE_URL}/send_message`, {
      chat_id: currentChatId,
      text: messageText,
      language: lang
    })
    .then(response => {
      setAiProcessing(false);
      setMessages(m => {
        const newMessages = [...m];
        newMessages.pop();
        return [...newMessages, { role: 'assistant', text: response.data }];
      });
    })
    .catch(error => {
      setAiProcessing(false);
      console.error('Error sending message:', error);
      setMessages(m => {
        const newMessages = [...m];
        newMessages.pop();
        newMessages.pop();
        return newMessages;
      });
      
      if (error.response?.data?.detail) {
        setMessages(m => [...m, { role: 'assistant', text: error.response.data.detail }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', text: 'Sorry, I encountered an error while processing your request.' }]);
      }
    });
  };

  // Create new chat with uploaded file
  const createNewChatWithFile = (file) => {
    setProcessingFile(true);
    setProcessingFileName(file.name);
    
    const formData = new FormData();
    formData.append('user_id', localStorage.getItem('user_id'));
    formData.append('name', file.name);
    formData.append('file', file);

    axios.post(`${API_BASE_URL}/create_chat`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
      setProcessingFile(false);
      setCurrentChatId(response.data.chat_id);
      
      setMessages([
        { role: 'user', text: `Uploaded ${file.name}` }
      ]);
      
      setHasUploadedFile(true);
      setCanChat(true);
      showLanguagePrompt();
    }).catch(error => {
      setProcessingFile(false);
      console.error('Error uploading file:', error);
      
      setMessages([
        { role: 'assistant', text: `Failed to process "${file.name}". Please try again.` }
      ]);
    });
  };

  // Handle file upload
  const uploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (hasUploadedFile) {
      navigate('/chat/new');
      setTimeout(() => createNewChatWithFile(file), 100);
    } else {
      createNewChatWithFile(file);
    }
    
    // Reset file input
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  // Handle language selection
  const chooseLang = (val) => {
    setLang(val);
    setTranslating(true);
    const translations = LANG_TRANSLATIONS[val];
    setMessages(m => [
      ...m,
      { role: 'assistant', text: translations.processing }
    ]);
    
    setTimeout(() => {
      setMessages(m => [
        ...m,
        { role: 'assistant', text: translations.ready }
      ]);
      setTranslating(false);
      setCanChat(true);
    }, 2000);
  };

  // Start process for selecting existing document
  const oldFile = () => {
    // force new chat for old file selection
    navigate('/chat/new');
    setTimeout(() => {
      setMessages([{ role: 'assistant', type: 'oldDocSelect' }]);
      setSelectedDocument('');
    }, 100);
  };

  // Select and load existing document
  const selectOldDoc = async (docId) => {
    const doc = userDocuments.find(d => d.id === docId);
    if (!doc) return;
    
    setProcessingFile(true);
    setProcessingFileName(doc.filename);
    
    setSelectedDocument(docId);
    setHasUploadedFile(true);
    setCanChat(false);

    try {
      const userId = parseInt(localStorage.getItem('user_id'));
      const response = await axios.post(`${API_BASE_URL}/create_chat_from_document`, {
        user_id: userId,
        document_id: docId,
        name: doc.filename
      });
      
      setProcessingFile(false);
      setCurrentChatId(response.data.chat_id);
      
      setMessages([{ role: 'user', text: `Uploaded ${response.data.chat_name || doc.filename}` }]);
      setCanChat(true);
      showLanguagePrompt(500);
    } catch (error) {
      setProcessingFile(false);
      console.error('Failed to start chat from document:', error);
      
      setMessages([{ 
        role: 'assistant', 
        text: `Unable to start chat with "${doc.filename}". Please try again.` 
      }]);
      setHasUploadedFile(false);
      setCanChat(false);
    }
  };

  // Overlay component for file processing
  const ProcessingOverlay = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <CircularProgress 
        size={60} 
        sx={{ 
          color: '#4159FD',
          mb: 3 
        }} 
      />
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        Processing Document
      </Typography>
      <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
        {processingFileName}
      </Typography>
      <Typography variant="body2" sx={{ color: '#888', maxWidth: 400, textAlign: 'center' }}>
        Extracting text and preparing your document for chatting. 
        This may take a moment for large documents.
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '50vh',
        bgcolor: '#fff',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 10,
        position: 'relative'
      }}
    >
      {processingFile && <ProcessingOverlay />}
      
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        handleNewChat={() => {
          setSidebarOpen(false);
          navigate('/chat/new');
        }}
      />

      <ChatHeader 
        handleNewChat={() => navigate('/chat/new')} 
        onToggleSidebar={() => setSidebarOpen(o => !o)} 
      />

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        pb: 18
      }}>
        <ChatWelcome fileRef={fileRef} uploadFile={uploadFile} oldFile={oldFile} />

        <ChatMessages
          messages={messages}
          lang={lang}
          translating={translating}
          savedDocs={userDocuments || []}
          chooseLang={chooseLang}
          selectOldDoc={selectOldDoc}
          selectedDocument={selectedDocument}
          endRef={endRef}
          processingFile={processingFile}
          processingFileName={processingFileName}
          aiProcessing={aiProcessing}
        />

        <Box sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: '#fff',
          py: 2,
          zIndex: 1000
        }}>
          <ChatInput
            input={input}
            setInput={setInput}
            sendMsg={sendMsg}
            canChat={canChat}
            hasUploadedFile={hasUploadedFile}
            loading={aiProcessing || processingFile}
          />
        </Box>
      </Box>
    </Box>
  );
}