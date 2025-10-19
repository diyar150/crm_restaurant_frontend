import React, { useState, useEffect } from 'react';
import axiosInstance from '../../components/service/axiosInstance';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  MenuItem,
} from '@mui/material';
import { handleChange, resetForm } from '../../components/utils/formUtils';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function CompanyDeliveryManagment({ isDrawerOpen }) {
  const initialFormData = { name: '', type: 'credit', amount: '', note: '' };
  const rowsPerPage = 10;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Fetch initial list of company deliveries
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [res] = await Promise.all([
          axiosInstance.get('/company-delivery/index'),
        ]);
        setTables(res.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const refreshTables = async () => {
    try {
      const res = await axiosInstance.get('/company-delivery/index');
      setTables(res.data || []);
    } catch (error) {
      console.error('Error refreshing company deliveries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.name || String(formData.name).trim() === '') errors.name = 'ناوی پێویستە بنووسرێت';
    if (!formData.type || String(formData.type).trim() === '') errors.type = 'جۆر پێویستە دیاریکرابێت';
    const amountNum = Number(formData.amount);
    if (formData.amount && (isNaN(amountNum) || amountNum < 0)) errors.amount = 'مقدار دروست نیە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: String(formData.name).trim(),
        type: String(formData.type).trim(),
        amount: formData.amount === '' ? null : Number(formData.amount),
        note: String(formData.note || '').trim(),
      };

      let response;
      if (selectedTableId) {
        response = await axiosInstance.put(`/company-delivery/update/${selectedTableId}`, payload);
      } else {
        response = await axiosInstance.post('/company-delivery/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        await refreshTables();
        setSuccess(true);
        resetForm(setFormData, initialFormData);
        setSelectedTableId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا');
      }
    } catch (error) {
      console.error('Error submitting table:', error);
      const backendMsg = error.response?.data?.error || error.response?.data?.message;
      if (backendMsg) {
        setErrorMessage(backendMsg);
      } else {
        setErrorMessage('هەڵە ڕوویدا لەپەیوەست بوون بەسێرفەرەوە');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (item) => {
    setSelectedTableId(item.id);
    setFormData({
      name: String(item.name || ''),
      type: String(item.type || 'credit'),
      amount: item.amount != null ? String(item.amount) : '',
      note: item.note || '',
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedTableId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
  await axiosInstance.delete(`/company-delivery/delete/${selectedTableId}`);
  setTables((prev) => prev.filter((t) => t.id !== selectedTableId));
      setOpenDialog(false);
      setSelectedTableId(null);
      setSuccess(true);
    } catch (error) {
      console.error('Error deleting table:', error);
      setErrorMessage('هەڵە ڕوویدا لەسڕینەوە');
    }
  };

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentTables = tables.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (_, value) => setCurrentPage(value);

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  const handleChangeWithErrorReset = (e) => {
    setErrorMessage('');
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    handleChange(e, setFormData);
  };

  const handleClearForm = () => {
    resetForm(setFormData, initialFormData);
    setFormErrors({});
    setSelectedTableId(null);
    setErrorMessage('');
  };

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s ease-in-out' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1 }}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTableId ? 'گۆڕینی کۆمپانیای گەیاندن' : 'زیادکردنی کۆمپانیای گەیاندن'}
              </Typography>
              <form onSubmit={handleSubmit}>
                {/* branch not required for company delivery */}

                <TextField
                  fullWidth
                  label="ناو"
                  name="name"
                  value={formData.name}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  select
                  label="جۆری مامەڵە"
                  name="type"
                  value={formData.type}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.type}
                  helperText={formErrors.type}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="ڕێژە">ڕێژە</MenuItem>
                  <MenuItem value="پارە">پارە</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="بڕ"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.amount}
                  helperText={formErrors.amount}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="تێبینی"
                  name="note"
                  value={formData.note}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.note}
                  helperText={formErrors.note}
                  sx={{ mb: 2 }}
                />



                <Grid container spacing={1}>
                  <Grid item xs={12} sm={8}>
                    <RegisterButton loading={loading} fullWidth>
                      {selectedTableId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    </RegisterButton>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <ClearButton onClick={handleClearForm} fullWidth />
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ margin: 1 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>ناوی</TableCell>
                    <TableCell>جۆری مامەڵە</TableCell>
                    <TableCell>بڕ</TableCell>
                    <TableCell>تێبینی</TableCell>
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
                    {currentTables.length > 0 ? (
                      currentTables.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.id}</TableCell>
                          <TableCell>{t.name}</TableCell>
                          <TableCell>{t.type}</TableCell>
                          <TableCell>{t.amount}</TableCell>
                          <TableCell>{t.note}</TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={() => handleEditClick(t)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="secondary" onClick={() => handleDeleteClick(t.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          هیچ داتایەک نەدۆزرایەوە
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                )}
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      ژمارەی گشتی :
                    </TableCell>
                      <TableCell colSpan={3} align="left" sx={{ fontWeight: 'bold' }}>
                      {tables.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {tables.length > 0 && (
                <Pagination
                  count={Math.ceil(tables.length / rowsPerPage)}
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
        title="سڕینەوەی میز"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم میزە؟"
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      <Snackbar open={success} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity="success">
          جێبەجێکرا
        </Alert>
      </Snackbar>

      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={handleErrorSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleErrorSnackbarClose} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CompanyDeliveryManagment;