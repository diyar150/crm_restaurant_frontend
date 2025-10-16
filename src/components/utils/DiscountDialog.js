import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, InputAdornment, IconButton
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { formatNumberWithCommas } from '../utils/format';

const discountTypes = [
  { value: 'ڕێژە', label: 'ڕێژە (%)' },
  { value: 'پارە', label: 'پارە' }
];

function calculateDiscountResult(type, value, total) {
  if (!type || !value || !total) return 0;
  if (type === 'ڕێژە') {
    return Math.round((Number(total) * Number(value)) / 100);
  }
  if (type === 'پارە') {
    return Number(value);
  }
  return 0;
}

const DiscountDialog = ({
  open,
  onClose,
  onSave,
  invoiceTotal = 0,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  discountResult,
  setDiscountResult
}) => {
  const [error, setError] = useState('');

  useEffect(() => {
    const result = calculateDiscountResult(discountType, discountValue, invoiceTotal);
    setDiscountResult(result);

    // Validation: discount cannot be greater than invoiceTotal
    if (result > invoiceTotal) {
      setError('ناتوانێت داشکاندن لە کۆی گشتی زیاتر بێت');
    } else {
      setError('');
    }
  }, [discountType, discountValue, invoiceTotal, setDiscountResult]);

  const handleTypeChange = (e) => {
    setDiscountType(e.target.value);
  };

  const handleValueChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^[0-9.]*$/.test(raw)) {
      setDiscountValue(raw);
    }
  };

  const handleClearValue = () => {
    setDiscountValue('');
  };

  const handleSave = () => {
    if (discountResult > invoiceTotal) {
      setError('ناتوانێت داشکاندن لە کۆی گشتی زیاتر بێت');
      return;
    }
    onSave();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>داشکاندن</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              label="جۆری داشکاندن"
              value={discountType}
              onChange={handleTypeChange}
              fullWidth
            >
              {discountTypes.map(dt => (
                <MenuItem key={dt.value} value={dt.value}>{dt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={discountType === 'ڕێژە' ? 'ڕێژە (%)' : 'پارە'}
              value={formatNumberWithCommas(discountValue)}
              onChange={handleValueChange}
              fullWidth
              error={!!error}
              helperText={error}
              InputProps={{
                inputProps: { min: 0 },
                endAdornment: discountValue && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearValue} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">
          کۆی داشکاندن: {formatNumberWithCommas(Number(discountResult || 0).toFixed(2))}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          کۆی گشتی پێش داشکاندن: {formatNumberWithCommas(Number(invoiceTotal || 0).toFixed(2))}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          کۆی گشتی دوای داشکاندن: {formatNumberWithCommas(Number((invoiceTotal - (Number(discountResult) || 0)).toFixed(2)))}
        </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">پاشگەزبوونەوە</Button>
        <Button
          onClick={handleSave}
          color="success"
          variant="contained"
          disabled={!!error}
        >
          زیادکردن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountDialog;