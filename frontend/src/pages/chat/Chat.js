import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
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
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('');
  const [translating, setTranslating] = useState(false);
  const [canChat, setCanChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const fileRef = useRef(null);
  const endRef = useRef(null);
  const { documents: userDocuments } = useDocuments();

  // convert from language codes
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

  // start chat when document is selected or existing chat is loaded
  useEffect(() => {
    // Check if docId is "new" or a chat/document ID
    if (docId === 'new') {
      resetChat();
    } else if (docId) {
      // Check if docId is a chat ID (from chat history) or document ID
      loadChatOrDocument(docId);
    }
  }, [docId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatOrDocument = async (id) => {
    try {
      // First, try to load as existing chat ID
      const response = await axios.get(`${API_BASE_URL}/chat/${id}`);
      const chatData = response.data;
      
      console.log('Loading existing chat:', chatData);
      
      // Transform messages from backend format to frontend format
      const transformedMessages = (chatData.messages || []).map(msg => ({
        role: msg.role,
        text: msg.content  // Backend uses 'content', frontend expects 'text'
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
  };

  const loadDocumentChat = (documentId) => {
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
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setLang('');
    setTranslating(false);
    setCanChat(false);
    setCurrentChatId(null);
    setHasUploadedFile(false);
    setSelectedDocument('');
  };

  const sendMsg = () => {
    if (!input.trim() || !currentChatId) return;
    
    const messageText = input;
    setMessages(m => [...m, { role: 'user', text: messageText }]);
    setInput('');

    axios.post(`${API_BASE_URL}/send_message`, {
      chat_id: currentChatId,
      text: messageText,
      language: lang
    })
    .then(response => {
      setMessages(m => [...m, { role: 'assistant', text: response.data }]);
    })
    .catch(error => {
      console.error('Error sending message:', error);
      setMessages(m => m.slice(0, -1));
      if (error.response?.data?.detail) {
        setMessages(m => [...m, { role: 'assistant', text: error.response.data.detail }]);
      }
    });
  };

  // upload file and start chat
  const createNewChatWithFile = (file) => {
    const formData = new FormData();
    formData.append('user_id', localStorage.getItem('user_id'));
    formData.append('name', file.name);
    formData.append('file', file);

    axios.post(`${API_BASE_URL}/create_chat`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
      setCurrentChatId(response.data.chat_id);
      setMessages([
        { role: 'user', text: `Uploaded ${file.name}` }
      ]);
      setHasUploadedFile(true);
      setCanChat(true);
      showLanguagePrompt();
    });
  };

  const uploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (hasUploadedFile) {
      navigate('/chat/new');
      setTimeout(() => createNewChatWithFile(file), 100);
    } else {
      createNewChatWithFile(file);
    }
  };
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


  const oldFile = () => {
    // force new chat for old file selection
    navigate('/chat/new');
    setTimeout(() => {
      setMessages([{ role: 'assistant', type: 'oldDocSelect' }]);
      setSelectedDocument('');
    }, 100);
  };

  const selectOldDoc = async (docId) => {
    const doc = userDocuments.find(d => d.id === docId);
    if (!doc) return;
    setSelectedDocument(docId);
    setHasUploadedFile(true);
    setCanChat(false);
    setMessages([{ role: 'user', text: `Uploaded ${doc.filename}` }]);

    try {
      const userId = parseInt(localStorage.getItem('user_id'));
      const response = await axios.post(`${API_BASE_URL}/create_chat_from_document`, {
        user_id: userId,
        document_id: docId,
        name: doc.filename
      });
      setCurrentChatId(response.data.chat_id);
      setMessages([{ role: 'user', text: `Uploaded ${response.data.chat_name || doc.filename}` }]);
      setCanChat(true);
      showLanguagePrompt(500);
    } catch (error) {
      console.error('Failed to start chat from document:', error);
      setMessages([{ role: 'assistant', text: 'Unable to start chat with that document. Please try again.' }]);
      setHasUploadedFile(false);
      setCanChat(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '50vh',
        bgcolor: '#fff',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 10
      }}
    >
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
          savedDocs={userDocuments}
          chooseLang={chooseLang}
          selectOldDoc={selectOldDoc}
          selectedDocument={selectedDocument}
          endRef={endRef}
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
          />
        </Box>
      </Box>
    </Box>
  );
}
