import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, TextField, IconButton, InputAdornment,
  Snackbar, Alert, MenuItem, Tooltip, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Pagination, TableFooter
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import axiosInstance from '../../components/service/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function WarehouseManagement({ isDrawerOpen }) {
  const initialFormData = {
    branch_id: '',
    name: '',
    phone_1: '',
    phone_2: '',
    address: '',
    note: '',
    search: '',
  };

  const rowsPerPage = 5;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const [branchRes, warehouseRes] = await Promise.all([
        axiosInstance.get('/branch/index'),
        axiosInstance.get('/warehouse/index'),
      ]);
      setBranches(branchRes.data || []);
      setWarehouses(warehouseRes.data || []);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی داتا');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const errors = {};
    if (!formData.branch_id) errors.branch_id = 'لق دیاری بکە';
    if (!formData.name.trim()) errors.name = 'ناوی کۆگا پێویستە';
    if (!formData.phone_1.trim()) errors.phone_1 = 'ژمارەی یەکەم پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const response = selectedWarehouseId
        ? await axiosInstance.put(`/warehouse/update/${selectedWarehouseId}`, formData)
        : await axiosInstance.post('/warehouse/store', formData);

      if ([200, 201].includes(response.status)) {
        fetchAllData();
        setSuccess(true);
        setFormData(initialFormData);
        setSelectedWarehouseId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا');
      }
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە تۆمارکردن');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (warehouse) => {
    setSelectedWarehouseId(warehouse.id);
    setFormData({
      branch_id: warehouse.branch_id || '',
      name: warehouse.name || '',
      phone_1: warehouse.phone_1 || '',
      phone_2: warehouse.phone_2 || '',
      address: warehouse.address || '',
      note: warehouse.note || '',
      search: '',
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedWarehouseId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/warehouse/delete/${selectedWarehouseId}`);
      setWarehouses(prev => prev.filter(w => w.id !== selectedWarehouseId));
      setSuccess(true);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedWarehouseId(null);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, search: value }));

    if (!value.trim()) {
      fetchAllData();
      return;
    }

    setFetching(true);
    try {
      const response = await axiosInstance.get('/warehouse/filter', {
        params: {
          branch_name: value,
          name: value,
          phone_1: value,
          phone_2: value,
          address: value,
        },
      });
      setWarehouses(response.status === 200 ? response.data : []);
    } catch {
      setErrorMessage('هەڵە ڕوویدا لە گەڕان');
    } finally {
      setFetching(false);
    }
  };

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  const handleChangeWithErrorReset = (e) => {
    const { name, value } = e.target;
    setErrorMessage('');
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearSelectField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleClearForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedWarehouseId(null);
    setErrorMessage('');
  };

  const currentWarehouses = warehouses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedWarehouseId ? 'گۆڕینی کۆگا' : 'زیادکردنی کۆگا'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  select
                  fullWidth
                  label="لق"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.branch_id}
                  helperText={formErrors.branch_id}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: formData.branch_id && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearSelectField('branch_id')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                >
                  {branches.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  label="ناوی کۆگا"
                  name="name"
                  value={formData.name}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: formData.name && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearSelectField('name')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ژمارەی یەکەم"
                      name="phone_1"
                      value={formData.phone_1}
                      onChange={handleChangeWithErrorReset}
                      error={!!formErrors.phone_1}
                      helperText={formErrors.phone_1}
                      InputProps={{
                        endAdornment: formData.phone_1 && (
                          <InputAdornment position="end">
                            <IconButton onClick={() => clearSelectField('phone_1')}>
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ژمارەی دووەم"
                      name="phone_2"
                      value={formData.phone_2}
                      onChange={handleChangeWithErrorReset}
                      error={!!formErrors.phone_2}
                      helperText={formErrors.phone_2}
                      InputProps={{
                        endAdornment: formData.phone_2 && (
                          <InputAdornment position="end">
                            <IconButton onClick={() => clearSelectField('phone_2')}>
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="ناونیشان"
                  name="address"
                  value={formData.address}
                  onChange={handleChangeWithErrorReset}
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: formData.address && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearSelectField('address')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
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
                  InputProps={{
                    endAdornment: formData.note && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => clearSelectField('note')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={8}>
                    <RegisterButton
                      loading={loading}
                      fullWidth
                      children={selectedWarehouseId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <ClearButton
                      onClick={handleClearForm}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ m: 1, p: 2 }}>
            <TextField
              fullWidth
              label="گەڕان"
              name="search"
              value={formData.search}
              onChange={handleSearchChange}
              placeholder="لق، ناو، ژمارە، ناونیشان..."
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="هەموو داتاکان">
                      <IconButton onClick={fetchAllData}>
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>لق</TableCell>
                    <TableCell>ناوی کۆگا</TableCell>
                    <TableCell>ژمارەی یەکەم</TableCell>
                    <TableCell>ژمارەی دووەم</TableCell>
                    <TableCell>ناونیشان</TableCell>
                    <TableCell>تێبینی</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetching ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : currentWarehouses.length > 0 ? (
                    currentWarehouses.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{w.id}</TableCell>
                        <TableCell>{branches.find(b => b.id === w.branch_id)?.name || w.branch_id}</TableCell>
                        <TableCell>{w.name}</TableCell>
                        <TableCell>{w.phone_1}</TableCell>
                        <TableCell>{w.phone_2}</TableCell>
                        <TableCell>{w.address}</TableCell>
                        <TableCell>{w.note}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(w)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(w.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        {formData.search ? 'هیچ داتایەک بە گەڕانەکەت نەدۆزرایەوە' : 'هیچ داتایەک نەدۆزرایەوە'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                      ژمارەی گشتی :
                    </TableCell>
                    <TableCell colSpan={3} align="left" sx={{ fontWeight: 'bold' }}>
                      {warehouses.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            {warehouses.length > rowsPerPage && (
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={Math.ceil(warehouses.length / rowsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی کۆگا"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم کۆگایە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* Snackbars */}
      <Snackbar open={success} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity="success">جێبەجێکرا</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={handleErrorSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleErrorSnackbarClose} severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
}

export default WarehouseManagement;