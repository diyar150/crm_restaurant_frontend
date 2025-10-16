import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card,
  Typography,
  Box,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import RegisterButton from '../../components/common/RegisterButton';
import {resetForm } from '../../components/utils/formUtils';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- Add this import

function CurrencyRateManagment({ isDrawerOpen }) {
  // current date
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const initialFormData = {
    base_currency_id: '',
    currency_id: '',
    base_amount: '',
    target_amount: '',
    price_date: today,
  };
  const rowsPerPage = 5;

  function formatNumberWithCommas(value) {
  if (!value) return '';
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
 }

   


  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [currencyRates, setCurrencyRates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState(null);

  // Fetch currencies, rates, and base currency
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [currenciesRes, ratesRes, baseRes] = await Promise.all([
          axiosInstance.get('/currency/index'),
          axiosInstance.get('/currency-rates/index'),
          axiosInstance.get('/currency/base'),
        ]);
        if (currenciesRes.status === 200) setCurrencies(currenciesRes.data || []);
        if (ratesRes.status === 200) setCurrencyRates(ratesRes.data || []);
        if (baseRes.status === 200) setBaseCurrency(baseRes.data || null);
      } catch (error) {
        setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتای نرخ');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  // Preselect base currency in the dropdown if not set
  useEffect(() => {
    if (baseCurrency && !formData.base_currency_id) {
      setFormData((prev) => ({ ...prev, base_currency_id: baseCurrency.id }));
    }
    // eslint-disable-next-line
  }, [baseCurrency]);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validate form fields
    const errors = {};
    if (!formData.base_currency_id) errors.base_currency_id = 'دراوی بنچینەیی پێویستە هەلبژێردرێت';
    if (!formData.currency_id) errors.currency_id = 'دراوی گۆڕاو پێویستە هەلبژێردرێت';
    if (!formData.base_amount || isNaN(Number(formData.base_amount))) errors.base_amount = 'بڕی بنچینە پێویستە بنووسرێت (ژمارە)';
    if (!formData.target_amount || isNaN(Number(formData.target_amount))) errors.target_amount = 'بڕی گۆڕاو پێویستە بنووسرێت (ژمارە)';
    if (!formData.price_date) errors.price_date = 'بەرواری نرخ پێویستە بنووسرێت';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      let response;
      const payload = {
        ...formData,
        base_amount: Number(formData.base_amount.toString().replace(/,/g, '')),
        target_amount: Number(formData.target_amount.toString().replace(/,/g, '')),
      };
      if (selectedRateId) {
        response = await axiosInstance.put(`/currency-rates/update/${selectedRateId}`, payload);
      } else {
        response = await axiosInstance.post('/currency-rates/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        const updatedRates = await axiosInstance.get('/currency-rates/index');
        setCurrencyRates(updatedRates.data);
        setSuccess(true);
        resetForm(setFormData, initialFormData);
        setSelectedRateId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا لە جێبەجێکردندا');
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('هەڵە ڕوویدا لەپەیوەست بوون بەسێرفەرەوە');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit
  const handleEditClick = (rate) => {
    setSelectedRateId(rate.id);
    setFormData({
      base_currency_id: rate.base_currency_id,
      currency_id: rate.currency_id,
      base_amount: rate.base_amount,
      target_amount: rate.target_amount,
      price_date: rate.price_date ? rate.price_date.slice(0, 10) : '',
    });
    setFormErrors({});
  };

  // Handle Delete
  const handleDeleteClick = (id) => {
    setSelectedRateId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/currency-rates/delete/${selectedRateId}`);
      setCurrencyRates((prev) => prev.filter((rate) => rate.id !== selectedRateId));
      setOpenDialog(false);
      setSelectedRateId(null);
      setSuccess(true);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لەسڕینەوە');
    }
  };

  // Pagination
  const indexOfLastRate = currentPage * rowsPerPage;
  const indexOfFirstRate = indexOfLastRate - rowsPerPage;
  const currentRates = currencyRates.slice(indexOfFirstRate, indexOfLastRate);

  const handlePageChange = (_, value) => setCurrentPage(value);

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);


 const handleChangeWithErrorReset = (e, setFormData) => {
    setErrorMessage('');
    setFormErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: '' }));

    // Only allow numbers and decimals for amount fields, and remove commas
    if (['base_amount', 'target_amount'].includes(e.target.name)) {
        const rawValue = e.target.value.replace(/,/g, '');
        if (!/^\d*\.?\d*$/.test(rawValue)) return;
        setFormData((prev) => ({ ...prev, [e.target.name]: rawValue }));
    } else {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
    };


  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s ease-in-out' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1 }}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedRateId ? 'گۆڕینی نرخی دراو' : 'زیادکردنی نرخی دراو'}
              </Typography>
              {/* Show current base currency */}
              {baseCurrency && (
                <TextField
                  label="دراوی بنچینەیی"
                  value={`${baseCurrency.name} (${baseCurrency.symbol})`}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                  sx={{ marginBottom: 2 }}
                />
              )}
              <form onSubmit={handleSubmit}>
                

                <TextField
                  select
                  fullWidth
                  label="دراوی گۆڕاو"
                  name="currency_id"
                  value={formData.currency_id}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.currency_id}
                  helperText={formErrors.currency_id}
                  sx={{ marginBottom: 2 }}
                >
                  {currencies.map((cur) => (
                    <MenuItem key={cur.id} value={cur.id}>
                      {cur.name} ({cur.symbol})
                    </MenuItem>
                  ))}
                </TextField>
               <TextField
                    fullWidth
                    label="بڕی بنچینە(١٠٠)"
                    name="base_amount"
                    value={formatNumberWithCommas(formData.base_amount)}
                    onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                    error={!!formErrors.base_amount}
                    helperText={formErrors.base_amount}
                    sx={{ marginBottom: 2 }}
                    type="text"
                    />
               <TextField
                        fullWidth
                        label="بڕی گۆڕاو"
                        name="target_amount"
                        value={formatNumberWithCommas(formData.target_amount)}
                        onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                        error={!!formErrors.target_amount}
                        helperText={formErrors.target_amount}
                        sx={{ marginBottom: 2 }}
                        type="text"
                        />
                <TextField
                  fullWidth
                  label="بەرواری نرخ"
                  name="price_date"
                  type="date"
                  value={formData.price_date}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.price_date}
                  helperText={formErrors.price_date}
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
  
                <RegisterButton
                    loading={loading}
                    fullWidth
                  >
                    {selectedRateId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                  </RegisterButton>

              </form>
            </Box>
          </Card>
        </Grid>

        {/* List Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ margin: 1 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>دراوی بنچینەیی</TableCell>
                    <TableCell>دراوی گۆڕاو</TableCell>
                    <TableCell>بڕی بنچینە</TableCell>
                    <TableCell>بڕی گۆڕاو</TableCell>
                    <TableCell>نرخی گۆڕین</TableCell>
                    <TableCell>بەروار</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                   {fetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>
                    {currentRates.length > 0 ? (
                      currentRates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>{rate.id}</TableCell>
                          <TableCell>
                            {currencies.find((c) => c.id === rate.base_currency_id)?.name || rate.base_currency_id}
                          </TableCell>
                          <TableCell>
                            {currencies.find((c) => c.id === rate.currency_id)?.name || rate.currency_id}
                          </TableCell>
                          <TableCell>{formatNumberWithCommas(rate.base_amount)}</TableCell>
                          <TableCell>{formatNumberWithCommas(rate.target_amount)}</TableCell>
                          <TableCell>{formatNumberWithCommas(rate.rate_used)}</TableCell>
                          <TableCell>{rate.price_date ? rate.price_date.slice(0, 10) : ''}</TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={() => handleEditClick(rate)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="secondary" onClick={() => handleDeleteClick(rate.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          هیچ داتایەک نەدۆزرایەوە
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                )}
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {currencyRates.length > 0 && (
                <Pagination
                  count={Math.ceil(currencyRates.length / rowsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی نرخ"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم نرخە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          جێبەجێکرا
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={handleErrorSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleErrorSnackbarClose} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CurrencyRateManagment;