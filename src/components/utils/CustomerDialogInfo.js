import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';

// Column labels for customer fields (Kurdish and English for clarity)
const CUSTOMER_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'code', label: 'کۆد' },
  { key: 'name', label: 'ناو' },
  { key: 'phone_1', label: 'مۆبایل١' },
  { key: 'phone_2', label: 'مۆبایل٢' },
  { key: 'type', label: 'جۆری مامەڵە' },
  { key: 'category_id', label: 'گرووپ' },
  { key: 'zone_id', label: 'زون' },
  { key: 'city_id', label: 'شار' },
  { key: 'mandub_id', label: 'مەندووب' },
  { key: 'currency_id', label: 'دراو' },
  { key: 'price_type_id', label: 'جۆری نرخ' },
  { key: 'loan', label: 'قەرز' },
  { key: 'limit_loan_price', label: 'سنوری قەرز' },
  { key: 'limit_loan_day', label: 'مۆڵەتی قەرز' },
  { key: 'cobon', label: 'کۆبۆن' },
  { key: 'kafyl_name', label: 'ناوی کەفیل' },
  { key: 'kafyl_phone', label: 'مۆبایلی کەفیل' },
  { key: 'address', label: 'ناونیشان' },
  { key: 'note', label: 'تێبینی' },
  { key: 'state', label: 'حاڵەت' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'created_at', label: 'دروستکراوە' },
  { key: 'updated_at', label: 'نوێکرایەوە' },
];

// Helper to get display value for IDs
const getDisplayValue = (key, value, props) => {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'category_id') {
    return props.categories?.find(c => c.id === value)?.name || value;
  }
  if (key === 'zone_id') {
    return props.zones?.find(z => z.id === value)?.name || value;
  }
  if (key === 'currency_id') {
    return props.currencies?.find(c => c.id === value)?.name || value;
  }
  if (key === 'city_id') {
    return props.cities?.find(c => c.id === value)?.name || value;
  }
  if (key === 'mandub_id') {
    return props.mandub?.find(m => m.id === value)?.name || value;
  }
  if (key === 'price_type_id') {
    return props.priceTypes?.find(p => String(p.id) === String(value))?.name || value;
  }
  if (key === 'loan' || key === 'limit_loan_price') {
    return (
      <Typography
        sx={{
          color: Number(value) > 0 ? 'green' : Number(value) < 0 ? 'red' : 'inherit',
          fontWeight: 'bold',
        }}
      >
        {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Typography>
    );
  }
  if (key === 'state') {
    return (
      <Chip
        label={value}
        color={value === 'چالاک' ? 'success' : 'default'}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  }
  return String(value);
};

const CustomerDialogInfo = ({
  open,
  onClose,
  customer,
  loading,
  title = 'زانیارییەکانی کڕیار',
  categories = [],
  zones = [],
  currencies = [],
  cities = [],
  mandub = [],
  priceTypes = [],
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: '#fff' }}>
      {title}
    </DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : customer ? (
        <Grid container spacing={2}>
          {CUSTOMER_FIELDS.map(({ key, label }) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Box
                sx={{
                  bgcolor: '#f9f9f9',
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  boxShadow: 0,
                  minHeight: 60,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {getDisplayValue(key, customer[key], { categories, zones, currencies, cities, mandub, priceTypes })}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="error">زانیارییەک نەدۆزرایەوە.</Typography>
      )}
      <Divider sx={{ my: 2 }} />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary" variant="contained">
        داخستن
      </Button>
    </DialogActions>
  </Dialog>
);

export default CustomerDialogInfo;