import React, { useEffect, useState } from 'react';
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
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import TableSortLabel from '@mui/material/TableSortLabel';
import RegisterButton from '../../components/common/RegisterButton';
import ClearButton from '../../components/common/ClearButton';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- Add this line

function CustomerCategoryManagment({ isDrawerOpen }) {
  const rowsPerPage = 50;

  const initialFormData = {
    name: '',
  };

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
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);

  // Fetch categories
  const fetchCategories = async (
    page = currentPage,
    pageSize = rowsPerPage,
    sortField = sortBy,
    sortDirection = sortOrder,
  ) => {
    setFetching(true);
    setErrorMessage('');
    try {
      const params = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortDirection,
      };
      const response = await axiosInstance.get('/customer-category/index', { params });
      setCategories(response.data || []);
      setTotalCount(response.data.length || 0);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error ||
        error.message ||
        'هەڵە لە بارکردنی زانیاری'
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, rowsPerPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [sortBy, sortOrder, currentPage]);

  // Handlers
  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const handleChangeWithErrorReset = (e) => {
    setErrorMessage('');
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearSelectField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const errors = {};
    if (!formData.name) errors.name = 'ناو پێویستە';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      let response;
      if (selectedCategoryId) {
        response = await axiosInstance.put(`/customer-category/update/${selectedCategoryId}`, { name: formData.name });
      } else {
        response = await axiosInstance.post('/customer-category/store', { name: formData.name });
      }

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setErrorMessage('');
        setFormData(initialFormData);
        setSelectedCategoryId(null);
        setFormErrors({});
        setCurrentPage(1);
        fetchCategories(1, rowsPerPage, sortBy, sortOrder);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || 'هەڵە ڕوویدا لە تۆمارکردن'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (category) => {
    setSelectedCategoryId(category.id);
    setFormErrors({});
    setFormData({
      name: category.name || '',
    });
  };

  const handleDeleteClick = (id) => {
    setSelectedCategoryId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/customer-category/delete/${selectedCategoryId}`);
      if ([200, 201, 204].includes(response.status)) {
        setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategoryId));
        setOpenDialog(false);
        setSuccess(true);
        setErrorMessage('');
        setFormData(initialFormData);
        setSelectedCategoryId(null);
        setFormErrors({});
        fetchCategories(currentPage, rowsPerPage, sortBy, sortOrder);
      }
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە سڕینەوە');
    }
  };

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
  };

  const handleSnackbarClose = () => setSuccess(false);
  const handleErrorSnackbarClose = () => setErrorMessage('');
  const handleDialogClose = () => setOpenDialog(false);

  return (
    <Box sx={{ marginRight: isDrawerOpen ? '250px' : '0', transition: 'margin-right 0.3s' }}>
      <Grid container spacing={2}>
        {/* Form Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ margin: 1, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedCategoryId ? 'گۆڕینی پۆلی کڕیار' : 'زیادکردنی پۆلی کڕیار'}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="ناو"
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
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={8}>
                  <RegisterButton
                    loading={loading}
                    fullWidth
                    children={selectedCategoryId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                  />
                </Grid>
                <Grid item xs={4}>
                  <ClearButton
                    onClick={() => {
                      setFormData(initialFormData);
                      setFormErrors({});
                      setSelectedCategoryId(null);
                      setErrorMessage('');
                      setCurrentPage(1);
                      fetchCategories(1, rowsPerPage, sortBy, sortOrder);
                    }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </form>
          </Card>
        </Grid>

        {/* Table Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ margin: 1, padding: 2 }}>


            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'id'}
                        direction={sortBy === 'id' ? sortOrder : 'asc'}
                        onClick={() => handleSort('id')}
                      >
                        #
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        ناو
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>ئیش</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetching ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <LoadingSpinner size={32} message="چاوەڕوان بن..." />
                      </TableCell>
                    </TableRow>
                  ) : categories.length > 0 ? (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.id}</TableCell>
                        <TableCell>{cat.name}</TableCell>
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
                      <TableCell colSpan={3} align="center">
                        هیچ پۆلێک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold' }}>
                      کۆی گشتی: {categories.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {categories.length > 0 && (
                <Pagination
                  count={Math.ceil(totalCount / rowsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={openDialog}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی پۆل"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم پۆلە؟ ئەم کردارە گەرێنەوە نییە."
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
      />

      {/* Snackbars */}
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

export default CustomerCategoryManagment;