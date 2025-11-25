import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function ChatWelcome({ fileRef, uploadFile, oldFile }) {
  return (
    <>
      <Box sx={{ textAlign: 'center', mt: 5, mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 38 }}>
          Ask about any part of your document.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
        {/* upload and process file */}
        <Button
          variant='outlined'
          onClick={() => fileRef.current?.click()}
          sx={{
            minWidth: 320,
            py: 1.8,
            borderRadius: 2,
            border: '1.5px solid #000',
            fontWeight: 700,
            color: '#4159FD',
            textTransform: 'none',
            boxShadow: '3px 2px 0 rgba(0,0,0,0.18)',
            '&:hover': { bgcolor: '#f8f8f8' }
          }}
        >
          Upload new file(s)
          <input type='file' hidden ref={fileRef} onChange={uploadFile} />
        </Button>

        {/* get saved files */}
        <Button
          variant='outlined'
          onClick={oldFile}
          sx={{
            minWidth: 320,
            py: 1.8,
            borderRadius: 2,
            border: '1.5px solid #000',
            fontWeight: 700,
            color: '#4159FD',
            textTransform: 'none',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
            '&:hover': { bgcolor: '#f8f8f8' }
          }}
        >
          Question about old file(s)
        </Button>
      </Box>
    </>
  );
}