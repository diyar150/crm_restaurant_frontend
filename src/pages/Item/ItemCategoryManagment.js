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
import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- Add this line

function ItemCategoryManagment({ isDrawerOpen }) {
  const initialFormData = {
    name: '',
    description: '',
    search: '',
  };

  const rowsPerPage = 15;

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get('/item-category/index');
      setCategories(res.data || []);
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
    if (!formData.name.trim()) errors.name = 'ناوی پۆل پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const payload = { name: formData.name, description: formData.description };
      let response;
      if (selectedCategoryId) {
        response = await axiosInstance.put(`/item-category/update/${selectedCategoryId}`, payload);
      } else {
        response = await axiosInstance.post('/item-category/store', payload);
      }

      if ([200, 201].includes(response.status)) {
        fetchAllData();
        setSuccess(true);
        setFormData(initialFormData);
        setSelectedCategoryId(null);
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

  const handleEditClick = (cat) => {
    setSelectedCategoryId(cat.id);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      search: '',
    });
    setFormErrors({});
  };

  const handleDeleteClick = (id) => {
    setSelectedCategoryId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/item-category/delete/${selectedCategoryId}`);
      setCategories(prev => prev.filter(c => c.id !== selectedCategoryId));
      setSuccess(true);
    } catch (err) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    } finally {
      setOpenDialog(false);
      setSelectedCategoryId(null);
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
      // Simple client-side filter
      setCategories(prev =>
        prev.filter(
          c =>
            c.name.includes(value) ||
            (c.description && c.description.includes(value))
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

  const currentCategories = categories.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ m: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedCategoryId ? 'گۆڕینی گرووپ' : 'زیادکردنی گرووپ'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="ناوی گرووپ"
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
                    {selectedCategoryId ? 'نوێکردنەوە' : 'تۆمارکردن'}
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
                    <TableCell>ناوی گرووپ</TableCell>
                    <TableCell>وەسف</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetching ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : currentCategories.length > 0 ? (
                    currentCategories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.id}</TableCell>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.description}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(cat)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleDeleteClick(cat.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {formData.search
                          ? 'هیچ گرووپێک بە گەڕانەکەت نەدۆزرایەوە'
                          : 'هیچ پۆلێک نەدۆزرایەوە'}
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
                {categories.length}
              </TableCell>
            </TableRow>
          </TableFooter>
              </Table>
            </TableContainer>
            {categories.length > rowsPerPage && (
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={Math.ceil(categories.length / rowsPerPage)}
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
        title="سڕینەوەی گرووپ"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم گرووپە؟ ئەم کردارە گەرێنەوە نییە."
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

export default ItemCategoryManagment;