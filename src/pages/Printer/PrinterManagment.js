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

function PrinterManagment({ isDrawerOpen }) {
  const initialFormData = { branch_id: '0', name: '' };
  const rowsPerPage = 10;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Fetch branches and tables
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [branchRes, printerRes] = await Promise.all([
          axiosInstance.get('/branch/index'),
          axiosInstance.get('/printer/index'),
        ]);
        setBranches(branchRes.data || []);
        setTables(printerRes.data || []);
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
      const res = await axiosInstance.get('/printer/index');
      setTables(res.data || []);
    } catch (error) {
      console.error('Error refreshing tables:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    // Validate branch selection
    if (!formData.branch_id || formData.branch_id === '0') errors.branch_id = 'ناوی کۆمپانیا/بەش پێویستە دیاریکرابێت';
    // Name is required
    if (!formData.name || String(formData.name).trim() === '') errors.name = 'ناوی پرینتەر پێویستە بنووسرێت';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        branch_id: Number(formData.branch_id),
        name: String(formData.name).trim(),
      };

      let response;
      if (selectedTableId) {
        response = await axiosInstance.put(`/printer/update/${selectedTableId}`, payload);
      } else {
        response = await axiosInstance.post('/printer/store', payload);
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

  const handleEditClick = async (table) => {
    setSelectedTableId(table.id);
    setFormData({
      branch_id: String(table.branch_id || '0'),
      name: String(table.name || ''),
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedTableId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
  await axiosInstance.delete(`/printer/delete/${selectedTableId}`);
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
                {selectedTableId ? 'گۆڕینی پرینتەر' : 'زیادکردنی پرینتەر'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  select
                  fullWidth
                  label="کۆمپانیا / لق"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.branch_id}
                  helperText={formErrors.branch_id}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="0" disabled>لق هەڵبژێرە</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>

                {/* table_number removed for printer form */}

                          <TextField
                            fullWidth
                            label="ناوی پرینتەر"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChangeWithErrorReset}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
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
                    <TableCell>لق</TableCell>
                    <TableCell>ناوی پرینتەر</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                {fetching ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} align="center">
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
                          <TableCell>{branches.find((b) => b.id === t.branch_id)?.name || t.branch_id}</TableCell>
                          <TableCell>{t.name}</TableCell>
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
                        <TableCell colSpan={4} align="center">
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
        title="سڕینەوەی پرینتەر"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم پرینتەرە؟"
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

export default PrinterManagment;