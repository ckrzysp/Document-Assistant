import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import ChatHeader from './ChatHeader';
import ChatWelcome from './ChatWelcome';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('');
  const [translating, setTranslating] = useState(false);
  const [savedDocs, setSavedDocs] = useState([]);
  const [canChat, setCanChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('savedDocs')) || [];
    setSavedDocs(stored);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateSavedDocs = (newList) => {
    setSavedDocs(newList);
    localStorage.setItem('savedDocs', JSON.stringify(newList));
  };

  const sendMsg = () => {
    if (!input.trim() || !canChat) return;
    const userMsg = { role: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
  };

  const uploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages((m) => [...m, { role: 'user', text: `Uploaded ${file.name}` }]);
    const updated = [...savedDocs, file.name];
    updateSavedDocs(updated);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', type: 'lang' }]);
    }, 1000);
  };

  const chooseLang = (val) => {
    setLang(val);
    setTranslating(true);
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        text: `I'll start processing your document now. Translating to ${val} from English...`
      }
    ]);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `You can now ask questions about your document.` }
      ]);
      setTranslating(false);
      setCanChat(true);
    }, 2000);
  };

  const oldFile = () => {
    setMessages((m) => [...m, { role: 'assistant', type: 'oldDocSelect' }]);
  };

  const selectOldDoc = (docName) => {
    const msg = { role: 'user', text: `Selected old document: ${docName}` };
    setMessages((m) => [...m, msg]);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', type: 'lang' }]);
    }, 500);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setLang('');
    setTranslating(false);
    setCanChat(false);
  };

  const toggleSidebar = () => setSidebarOpen((o) => !o);

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
        handleNewChat={handleNewChat}
      />

      <ChatHeader handleNewChat={handleNewChat} onToggleSidebar={toggleSidebar} />

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
          savedDocs={savedDocs}
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
            canChat={canChat}
          />
        </Box>
      </Box>
    </Box>
  );
}