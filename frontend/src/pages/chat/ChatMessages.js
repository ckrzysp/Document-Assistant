import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Select,
  MenuItem
} from '@mui/material';
import MessageBubble from './MessageBubble';
import { SUPPORTED_LANGS } from '../../config';

export default function ChatMessages({
  messages,
  lang,
  translating,
  savedDocs,
  chooseLang,
  selectOldDoc,
  endRef
}) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        width: 'min(900px, 92vw)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        alignItems: 'center',
        pb: 1
      }}
    >
      {messages.map((m, i) => {
        if (m.type === 'lang') {
          return (
            <Box
              key={i}
              sx={{
                alignSelf: 'flex-start',
                border: '1px solid #ddd',
                borderRadius: 2,
                p: 1.6,
                mb: 1.4,
                boxShadow: '1px 2px 0 rgba(0,0,0,0.15)',
                maxWidth: '80%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 500, mr: 1 }}>
                  Select source language:
                </Typography>
                <Select
                  size='small'
                  value={lang}
                  onChange={(e) => chooseLang(e.target.value)}
                  displayEmpty
                  sx={{
                    minWidth: 160,
                    borderRadius: '8px',
                    '& .MuiSelect-select': { py: 0.6, px: 1.3 }
                  }}
                >
                  <MenuItem value='' disabled>
                    Select language
                  </MenuItem>
                  {/* needs backend */}
                  {SUPPORTED_LANGS.map((l) => (
                    <MenuItem key={l} value={l}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          );
        } else if (m.type === 'oldDocSelect') {
          return (
            <Box
              key={i}
              sx={{
                alignSelf: 'flex-start',
                border: '1px solid #ddd',
                borderRadius: 2,
                p: 1.6,
                mb: 1.4,
                boxShadow: '2px 1px 0 rgba(0,0,0,0.18)',
                maxWidth: '80%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 500, mr: 1 }}>
                  Choose a saved document:
                </Typography>
                <Select
                  size='small'
                  value=''
                  onChange={(e) => selectOldDoc(e.target.value)}
                  displayEmpty
                  sx={{
                    minWidth: 200,
                    borderRadius: '8px',
                    '& .MuiSelect-select': { py: 0.6, px: 1.3 }
                  }}
                >
                  <MenuItem value='' disabled>
                    Select a document
                  </MenuItem>
                  {savedDocs.map((doc) => (
                    <MenuItem key={doc} value={doc}>
                      {doc}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          );
        } else {
          return <MessageBubble key={i} message={m} />;
        }
      })}

      {translating && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 1 }}>
          <CircularProgress size={18} sx={{ color: '#000' }} />
          <Typography variant='body2'>Translating...</Typography>
        </Box>
      )}

      <div ref={endRef} />
    </Box>
  );
}