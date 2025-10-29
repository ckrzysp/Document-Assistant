import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ChatHeader from './ChatHeader';
import ChatWelcome from './ChatWelcome';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
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

  const fileRef = useRef(null);
  const endRef = useRef(null);
  const { documents: userDocuments } = useDocuments();

  // start chat when document is selected or existing chat is loaded
  useEffect(() => {
    if (docId && userDocuments.length > 0) {
      // Check if docId is a chat ID (from chat history) or document ID
      loadChatOrDocument(docId);
    } else if (docId === 'new') {
      resetChat();
    }
  }, [docId, userDocuments]);

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
      
      // Load the actual chat history
      setCurrentChatId(chatData.id);
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
      // start a new chat with the uploaded doc in the chat followed by an immediate language selection prompt
      setMessages([
        { role: 'user', text: `Uploaded ${document.filename}` },
        { role: 'assistant', type: 'lang' }
      ]);
      setCurrentChatId(documentId);
      setHasUploadedFile(true);
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
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    
    setMessages(m => [...m, { role: 'user', text: input }]);
    setInput('');

    axios.post(`${API_BASE_URL}/send_message`, {
      chat_id: currentChatId,
      text: input
    }).then(response => setMessages(m => [...m, { role: 'assistant', text: response.data }]));
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
        { role: 'user', text: `Uploaded ${file.name}` },
        { role: 'assistant', type: 'lang' }
      ]);
      setHasUploadedFile(true);
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
    setMessages(m => [
      ...m,
      { role: 'assistant', text: `I'll start processing your document now. I'll respond in ${val}...` }
    ]);
    
    setTimeout(() => {
      setMessages(m => [
        ...m,
        { role: 'assistant', text: `You can now ask questions about your document in ${val}.` }
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
    }, 100);
  };

  const selectOldDoc = (docName) => {
    setMessages(m => [...m, { role: 'user', text: `Selected document: ${docName}` }]);
    setHasUploadedFile(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', type: 'lang' }]);
    }, 500);
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
        handleNewChat={() => navigate('/chat/new')}
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
          savedDocs={userDocuments.map(doc => doc.filename)}
          chooseLang={chooseLang}
          selectOldDoc={selectOldDoc}
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
            uploadFile={uploadFile}
          />
        </Box>
      </Box>
    </Box>
  );
}