// src/pages/NotFound/NotFound.js
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f4f6f8',
        textAlign: 'center',
        padding: 2,
      }}
    >
      <Typography variant="h1" component="div" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 2 }}>
        404
      </Typography>
      <Typography variant="h6" sx={{ color: '#555', marginBottom: 2 }}>
        هیچ لاپەڕەیەک نەدۆزرایەوە
      </Typography>
      <Button
        component={Link}
        to="/"
        variant="contained"
        color="primary"
        sx={{ marginTop: 2 }}
      >
        گەڕانەوە
      </Button>
    </Box>
  );
};

export default NotFound;
