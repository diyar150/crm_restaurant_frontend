import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import {
  Card,
  Typography,
  Box,
  TextField,
  IconButton,
  InputAdornment,
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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { clearTextField, handleChange, resetForm } from '../../components/utils/formUtils';
import RegisterButton from '../../components/common/RegisterButton';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function CurrencyManagement({ isDrawerOpen }) {
  const initialFormData = {
    name: '',
    symbol: '',
    exchange_rate: '',
    is_base: false,
  };
  const rowsPerPage = 10;

  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Fetch currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      setFetching(true);
      try {
        const response = await axiosInstance.get('/currency/index');
        if (response.status === 200) {
          setCurrencies(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتای دراو');
      } finally {
        setFetching(false);
      }
    };
    fetchCurrencies();
  }, []);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validate form fields
    const errors = {};
    if (!formData.name.trim()) errors.name = 'ناوی دراو پێویستە بنووسرێت';
    if (!formData.symbol.trim()) errors.symbol = 'سیمبولی دراو پێویستە بنووسرێت';
    if (!formData.exchange_rate || isNaN(Number(formData.exchange_rate))) errors.exchange_rate = 'نرخی گۆڕین پێویستە بنووسرێت (ژمارە)';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      let response;
      const payload = {
        ...formData,
        exchange_rate: Number(formData.exchange_rate),
        is_base: formData.is_base ? 1 : 0,
      };
      if (selectedCurrencyId) {
        response = await axiosInstance.put(`/currency/update/${selectedCurrencyId}`, payload);
      } else {
        response = await axiosInstance.post('/currency/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        const updatedCurrencies = await axiosInstance.get('/currency/index');
        setCurrencies(updatedCurrencies.data);
        setSuccess(true);
        resetForm(setFormData, initialFormData);
        setSelectedCurrencyId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا لە جێبەجێکردندا');
      }
    } catch (error) {
      console.error('Error:', error);
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
  const handleEditClick = (currency) => {
    setSelectedCurrencyId(currency.id);
    setFormData({
      name: currency.name,
      symbol: currency.symbol,
      exchange_rate: currency.exchange_rate,
      is_base: !!currency.is_base,
    });
    setFormErrors({});
  };

  // Handle Delete
  const handleDeleteClick = (id) => {
    setSelectedCurrencyId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/currency/delete/${selectedCurrencyId}`);
      setCurrencies((prev) => prev.filter((currency) => currency.id !== selectedCurrencyId));
      setOpenDialog(false);
      setSelectedCurrencyId(null);
      setSuccess(true);
    } catch (error) {
      console.error('Error deleting currency:', error.response || error.message || error);
      setErrorMessage('هەڵە ڕوویدا لەسڕینەوە');
    }
  };

  // Pagination
  const indexOfLastCurrency = currentPage * rowsPerPage;
  const indexOfFirstCurrency = indexOfLastCurrency - rowsPerPage;
  const currentCurrencies = currencies.slice(indexOfFirstCurrency, indexOfLastCurrency);

  const handlePageChange = (_, value) => setCurrentPage(value);

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);
  const handleChangeWithErrorReset = (e, setFormData) => {
    setErrorMessage('');
    setFormErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: '' }));
    handleChange(e, setFormData);
  };

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s ease-in-out' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1 }}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedCurrencyId ? 'گۆڕینی دراو' : 'زیادکردنی دراو'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="ناوی دراو"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ marginBottom: 2 }}
                  InputProps={{
                    endAdornment: formData.name && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearTextField(setFormData, 'name')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="سیمبول"
                  name="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.symbol}
                  helperText={formErrors.symbol}
                  sx={{ marginBottom: 2 }}
                  InputProps={{
                    endAdornment: formData.symbol && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearTextField(setFormData, 'symbol')} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="نرخی گۆڕین"
                  name="exchange_rate"
                  value={formData.exchange_rate}
                  onChange={(e) => handleChangeWithErrorReset(e, setFormData)}
                  error={!!formErrors.exchange_rate}
                  helperText={formErrors.exchange_rate}
                  sx={{ marginBottom: 2 }}
                  type="number"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_base}
                      onChange={(e) => setFormData((prev) => ({ ...prev, is_base: e.target.checked }))}
                      name="is_base"
                      color="primary"
                    />
                  }
                  label="دراوی بنچینەیی"
                  sx={{ marginBottom: 2 }}
                />
                <RegisterButton
                  loading={loading}
                  fullWidth
                >
                  {selectedCurrencyId ? 'نوێکردنەوە' : 'تۆمارکردن'}
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
                    <TableCell>ناوی دراو</TableCell>
                    <TableCell>سیمبول</TableCell>
                    <TableCell>نرخی گۆڕین</TableCell>
                    <TableCell>بنچینەیی</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                 {fetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>
                    {currentCurrencies.length > 0 ? (
                      currentCurrencies.map((currency) => (
                        <TableRow key={currency.id}>
                          <TableCell>{currency.id}</TableCell>
                          <TableCell>{currency.name}</TableCell>
                          <TableCell>{currency.symbol}</TableCell>
                          <TableCell>{currency.exchange_rate}</TableCell>
                          <TableCell>
                            <Checkbox checked={!!currency.is_base} disabled />
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={() => handleEditClick(currency)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="secondary" onClick={() => handleDeleteClick(currency.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          هیچ داتایەک نەدۆزرایەوە
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                )}
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {currencies.length > 0 && (
                <Pagination
                  count={Math.ceil(currencies.length / rowsPerPage)}
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
        title="سڕینەوەی دراو"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم دراوە؟ ئەم کردارە گەرێنەوە نییە."
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

export default CurrencyManagement;