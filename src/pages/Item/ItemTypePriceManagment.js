import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, TextField, IconButton, InputAdornment,
  Snackbar, Alert, Table, TableHead, TableRow,
  TableCell, TableBody, TableFooter, TableContainer, Paper, Pagination
} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import axiosInstance from '../../components/service/axiosInstance';
import RegisterButton from '../../components/common/RegisterButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ItemTypePriceManagment({ isDrawerOpen }) {
  const initialFormData = {
    name: '',
    search: '',
  };

  const rowsPerPage = 10;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get('/item-price-type/index');
      setTypes(res.data || []);
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
    if (!formData.name.trim()) errors.name = 'ناوی جۆری نرخ پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = { name: formData.name };
      let response;
      if (selectedTypeId) {
        response = await axiosInstance.put(`/item-price-type/update/${selectedTypeId}`, payload);
      } else {
        response = await axiosInstance.post('/item-price-type/store', payload);
      }

      if ([200, 201].includes(response.status)) {
        fetchAllData();
        setSuccess(true);
        setFormData(initialFormData);
        setSelectedTypeId(null);
        setFormErrors({});
      } else {
        setErrorMessage(response.data.message || 'هەڵە ڕوویدا');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (type) => {
    setSelectedTypeId(type.id);
    setFormData({
      name: type.name || '',
      search: '',
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedTypeId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item-price-type/delete/${selectedTypeId}`);
      setTypes(prev => prev.filter(t => t.id !== selectedTypeId));
      setSuccess(true);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedTypeId(null);
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
      setTypes(prev =>
        prev.filter(
          t => t.name.includes(value)
        )
      );
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

  const currentTypes = types.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedTypeId ? 'گۆڕینی جۆری نرخ' : 'زیادکردنی جۆری نرخ'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="ناوی جۆری نرخ"
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
             <RegisterButton
                loading={loading}
                fullWidth
              >
                {selectedTypeId ? 'نوێکردنەوە' : 'تۆمارکردن'}
              </RegisterButton>
            </form>
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
              placeholder="ناو..."
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.search && (
                      <IconButton onClick={() => {
                        setFormData(prev => ({ ...prev, search: '' }));
                        fetchAllData();
                      }}>
                        <ClearIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={fetchAllData}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>ناوی جۆری نرخ</TableCell>
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
                  ) : currentTypes.length > 0 ? (
                    currentTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>{type.id}</TableCell>
                        <TableCell>{type.name}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(type)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(type.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        {formData.search
                          ? 'هیچ جۆرێک بە گەڕانەکەت نەدۆزرایەوە'
                          : 'هیچ جۆرێک نەدۆزرایەوە'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                 <TableFooter>
            <TableRow>
              <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                ژمارەی گشتی :
              </TableCell>
              <TableCell colSpan={2} align="left" sx={{ fontWeight: 'bold' }}>
                {types.length}
              </TableCell>
            </TableRow>
          </TableFooter>
              </Table>
            </TableContainer>
            {types.length > rowsPerPage && (
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={Math.ceil(types.length / rowsPerPage)}
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
        title="سڕینەوەی جۆری نرخ"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم جۆرە؟ ئەم کردارە گەرێنەوە نییە."
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

export default ItemTypePriceManagment;