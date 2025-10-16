import React, { useState, useEffect } from 'react';
import { MenuItem, TextField, Grid } from '@mui/material';

const options = [
  { label: 'ئەمڕۆ', value: 'today' },
  { label: 'دوێنێ', value: 'yesterday' },
  { label: '7 ڕۆژ پێش', value: '7days' },
  { label: 'مانگ پێش', value: 'month' },
  { label: 'دیاری بکە', value: 'custom' },
];

function getRange(value) {
  const today = new Date();
  let start, end;
  switch (value) {
    case 'today':
      start = end = today;
      break;
    case 'yesterday':
      start = end = new Date(today.setDate(today.getDate() - 1));
      break;
    case '7days':
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 6);
      break;
    case 'month':
      end = new Date();
      start = new Date();
      start.setMonth(end.getMonth() - 1);
      break;
    default:
      start = end = null;
  }
  return {
    start: start ? start.toISOString().slice(0, 10) : '',
    end: end ? end.toISOString().slice(0, 10) : '',
  };
}

const DateRangeSelector = ({ value, onChange }) => {
  const [mode, setMode] = useState(value?.mode || 'today');
  const [custom, setCustom] = useState({
    start: value?.start || '',
    end: value?.end || '',
  });

  // Sync internal state with parent value
  useEffect(() => {
    setMode(value?.mode || 'today');
    setCustom({
      start: value?.start || '',
      end: value?.end || '',
    });
  }, [value]);

  const handleModeChange = (e) => {
    const val = e.target.value;
    setMode(val);
    if (val === 'custom') {
      onChange({ mode: val, start: custom.start, end: custom.end });
    } else {
      const range = getRange(val);
      onChange({ mode: val, ...range });
    }
  };

  const handleCustomChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...custom, [name]: value };
    setCustom(updated);
    onChange({ mode: 'custom', ...updated });
  };

  return (
    <>
      <TextField
        select
        label="کاتی گەڕان"
        value={mode}
        onChange={handleModeChange}
        sx={{ minWidth: 180, mb: 0 }}
        fullWidth
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
      {mode === 'custom' && (
        <Grid container spacing={1} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="لە"
              type="date"
              name="start"
              value={custom.start}
              onChange={handleCustomChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ mb: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="بۆ"
              type="date"
              name="end"
              value={custom.end}
              onChange={handleCustomChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ mb: 0 }}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default DateRangeSelector;