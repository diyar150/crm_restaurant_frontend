import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, MenuItem, InputAdornment, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import axiosInstance from '../../components/service/axiosInstance';
import { formatNumberWithCommas } from '../../components/utils/format';

const TransportLaborDialog = ({
  open,
  onClose,
  onSave,
  driverId,
  setDriverId,
  amountTransport,
  setAmountTransport,
  amountLabor,
  setAmountLabor
}) => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    if (open) {
      axiosInstance
        .get('/driver/index')
        .then(res => setDrivers(res.data))
        .catch(() => setDrivers([]));
    }
  }, [open]);

  const allowedChars = /^[0-9+-]*$/;

  const handleTransportChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (allowedChars.test(rawValue)) {
      setAmountTransport(rawValue);
    }
  };

  const handleLaborChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (allowedChars.test(rawValue)) {
      setAmountLabor(rawValue);
    }
  };

  const handleClearField = (setter) => {
    setter('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>زانیاری گواستنەوە و بارکردن</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              select
              label="ناوی شۆفێر"
              value={driverId || ''}
              onChange={e => setDriverId(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: driverId && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setDriverId('')} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">-- هەڵبژێرە --</MenuItem>
              {drivers.map(driver => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="نرخی گواستنەوە"
              type="text"
              value={formatNumberWithCommas(amountTransport)}
              onChange={e => setAmountTransport(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: amountTransport && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClearField(setAmountTransport)} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="نرخی بارکردن"
              type="text"
              value={formatNumberWithCommas(amountLabor)}
             onChange={e => setAmountLabor(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: amountLabor && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleClearField(setAmountLabor)} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          پاشگەزبوونەوە
        </Button>
        <Button onClick={onSave} color="success" variant="contained">
          زیادکردن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransportLaborDialog;