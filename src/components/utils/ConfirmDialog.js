import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
  Typography
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "سڕینەوەی بەکارهێنەر",
  description = "ئایە دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟ ئەم کردارە گەرێنەوە نییە.",
  confirmText = "سڕینەوە",
  cancelText = "پاشگەزبوونەوە"
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        borderRadius: 3,
        p: 2,
        minWidth: 350,
      },
    }}
  >
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <WarningAmberIcon color="warning" />
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ color: 'text.secondary', fontSize: '1rem' }}>
        {description}
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        color="primary"
        sx={{ borderRadius: 2 }}
      >
        {cancelText}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="error"
        sx={{ borderRadius: 2 }}
      >
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;