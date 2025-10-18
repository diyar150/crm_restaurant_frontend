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

function TableManagment({ isDrawerOpen }) {
  const initialFormData = { branch_id: '0', table_number: '', capacity: '' };
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
        const [branchRes, tableRes] = await Promise.all([
          axiosInstance.get('/branch/index'),
          axiosInstance.get('/table/index'),
        ]);
        setBranches(branchRes.data || []);
        setTables(tableRes.data || []);
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
      const res = await axiosInstance.get('/table/index');
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
    // Table number must be provided and not "0"
    if (!formData.table_number || String(formData.table_number).trim() === '' || String(formData.table_number).trim() === '0')
      errors.table_number = 'ژمارەی میز پێویستە بنووسرێت';
    // Capacity must be a positive number
    const capacityNum = Number(formData.capacity);
    if (!formData.capacity || String(formData.capacity).trim() === '' || isNaN(capacityNum) || capacityNum <= 0)
      errors.capacity = 'توانایی(خەڵک) پێویستە ژمارەیەکی گەورەتر لە 0 بێت';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        branch_id: Number(formData.branch_id),
        table_number: String(formData.table_number).trim(),
        capacity: capacityNum,
      };

      let response;
      if (selectedTableId) {
        response = await axiosInstance.put(`/table/update/${selectedTableId}`, payload);
      } else {
        response = await axiosInstance.post('/table/store', payload);
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
      table_number: String(table.table_number || ''),
      capacity: String(table.capacity || ''),
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedTableId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/table/delete/${selectedTableId}`);
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
                {selectedTableId ? 'گۆڕینی میز' : 'زیادکردنی میز'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  select
                  fullWidth
                  label="کۆمپانیا / بەش"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.branch_id}
                  helperText={formErrors.branch_id}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="0" disabled>بەش هەڵبژێرە</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  label="ژمارەی میز"
                  name="table_number"
                  value={formData.table_number}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.table_number}
                  helperText={formErrors.table_number}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="ژمارەی کورسیەکانی"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.capacity}
                  helperText={formErrors.capacity}
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
                    <TableCell>بەش</TableCell>
                    <TableCell>ژمارەی میز</TableCell>
                    <TableCell>توانایی</TableCell>
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
                          <TableCell>{branches.find((b) => b.id === t.branch_id)?.name || t.branch_id}</TableCell>
                          <TableCell>{t.table_number}</TableCell>
                          <TableCell>{t.capacity}</TableCell>
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

export default TableManagment;