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
import RegisterButton from '../../components/common/RegisterButton';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import axiosInstance from '../../components/service/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ItemUnitManagment({ isDrawerOpen }) {
  const initialFormData = {
    name: '',
    description: '',
    conversion_factor: '',
    search: '',
  };

  const rowsPerPage = 10;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get('/item-unit/index');
      setUnits(res.data || []);
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
    if (!formData.name.trim()) errors.name = 'ناوی یەکە پێویستە';
    if (formData.conversion_factor === '' || isNaN(Number(formData.conversion_factor))) {
      errors.conversion_factor = 'فاکتۆری گۆڕین پێویستە (ژمارە)';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        conversion_factor: Number(formData.conversion_factor)
      };
      let response;
      if (selectedUnitId) {
        response = await axiosInstance.put(`/item-unit/update/${selectedUnitId}`, payload);
      } else {
        response = await axiosInstance.post('/item-unit/store', payload);
      }

      if ([200, 201].includes(response.status)) {
        fetchAllData();
        setSuccess(true);
        setFormData(initialFormData);
        setSelectedUnitId(null);
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

  const handleEditClick = (unit) => {
    setSelectedUnitId(unit.id);
    setFormData({
      name: unit.name || '',
      description: unit.description || '',
      conversion_factor: unit.conversion_factor || '',
      search: '',
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedUnitId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item-unit/delete/${selectedUnitId}`);
      setUnits(prev => prev.filter(u => u.id !== selectedUnitId));
      setSuccess(true);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedUnitId(null);
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
      setUnits(prev =>
        prev.filter(
          u =>
            u.name.includes(value) ||
            (u.description && u.description.includes(value))
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

  const currentUnits = units.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedUnitId ? 'گۆڕینی یەکە' : 'زیادکردنی یەکە'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="ناوی یەکە"
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
           
              <TextField
                fullWidth
                label="عدد"
                name="conversion_factor"
                type="number"
                value={formData.conversion_factor}
                onChange={handleChangeWithErrorReset}
                error={!!formErrors.conversion_factor}
                helperText={formErrors.conversion_factor}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.conversion_factor && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('conversion_factor')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
                 <TextField
                fullWidth
                label="وەسف"
                name="description"
                value={formData.description}
                onChange={handleChangeWithErrorReset}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: formData.description && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => clearSelectField('description')}>
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
                {selectedUnitId ? 'نوێکردنەوە' : 'تۆمارکردن'}
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
              placeholder="ناو یان وەسف..."
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
                    <TableCell>ناوی یەکە</TableCell>
                     <TableCell>عدد</TableCell>
                    <TableCell>وەسف</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetching ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : currentUnits.length > 0 ? (
                    currentUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.id}</TableCell>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell>{unit.conversion_factor}</TableCell>
                         <TableCell>{unit.description}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(unit)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(unit.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {formData.search
                          ? 'هیچ یەکەیەک بە گەڕانەکەت نەدۆزرایەوە'
                          : 'هیچ یەکەیەک نەدۆزرایەوە'}
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
                        {units.length}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
              </Table>
            </TableContainer>
            {units.length > rowsPerPage && (
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={Math.ceil(units.length / rowsPerPage)}
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
        title="سڕینەوەی یەکە"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم یەکەیە؟ ئەم کردارە گەرێنەوە نییە."
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

export default ItemUnitManagment;