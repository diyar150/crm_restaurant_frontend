import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const SessionExpiredAlert = ({ open, onClose }) => (
  <Snackbar
    open={open}
    autoHideDuration={5000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  >
    <Alert
      onClose={onClose}
      severity="warning"
      variant="filled"
      sx={{ fontWeight: 'bold', fontSize: '1.1rem', direction: 'rtl' }}
    >
      کاتی چوونە ژوورەوە تەواو بوو، تکایە دووبارە بچۆ ژوورەوە.
    </Alert>
  </Snackbar>
);

export default SessionExpiredAlert;