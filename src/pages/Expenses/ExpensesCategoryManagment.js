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
  Tooltip} from '@mui/material';
import {
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { clearTextField, handleChange, resetForm } from '../../components/utils/formUtils';
import ConfirmDialog from '../../components/utils/ConfirmDialog';
import RegisterButton from '../../components/common/RegisterButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ExpensesCategoryManagment({ isDrawerOpen }) {
  const initialFormData = { name: '', description: '' };
  const rowsPerPage = 5;

  // States
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
  const [search, setSearch] = useState('');

  // Fetch categories (with search)
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const fetchCategories = async (searchValue = '') => {
    setFetching(true);
    try {
      let response;
      if (searchValue.trim()) {
        // If you have a filter endpoint, use it. Otherwise, filter on frontend.
        response = await axiosInstance.get('/expenses-category/filter', {
          params: { name: searchValue, description: searchValue },
        });
      } else {
        response = await axiosInstance.get('/expenses-category/index');
      }
      if (response.status === 200) {
        setCategories(response.data || []);
      }
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لە بارکردنی زانیاری');
    } finally {
      setFetching(false);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (!value.trim()) {
      fetchCategories();
      return;
    }
    fetchCategories(value);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validate form fields
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'ناوی گرووپی مەسرووفات پێویستە بنووسرێت';
    }
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      let response;
      const payload = { name: formData.name, description: formData.description };
      if (selectedCategoryId) {
        response = await axiosInstance.put(`/expenses-category/update/${selectedCategoryId}`, payload);
      } else {
        response = await axiosInstance.post('/expenses-category/store', payload);
      }

      if (response.status === 200 || response.status === 201) {
        fetchCategories(search);
        setSuccess(true);
        resetForm(setFormData, initialFormData);
        setSelectedCategoryId(null);
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
  const handleEditClick = (category) => {
    setSelectedCategoryId(category.id);
    setFormData({ name: category.name, description: category.note });
    setFormErrors({});
  };

  // Handle Delete
  const handleDeleteClick = (id) => {
    setSelectedCategoryId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/expenses-category/delete/${selectedCategoryId}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategoryId));
      setOpenDialog(false);
      setSelectedCategoryId(null);
      setSuccess(true);
    } catch (error) {
      setErrorMessage('هەڵە ڕوویدا لەسڕینەوە');
    }
  };

  // Pagination
  const indexOfLastCategory = currentPage * rowsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - rowsPerPage;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

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
                {selectedCategoryId ? 'گۆڕینی گرووپ(مەسرووفات)' : 'زیادکردنی گرووپ(مەسرووفات)'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="ناوی گرووپ"
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
                  label="وەسف"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange(e, setFormData)}
                  sx={{ marginBottom: 2 }}
                />
                <RegisterButton
                      loading={loading}
                      fullWidth
                    >
                      {selectedCategoryId ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    </RegisterButton>

              </form>
            </Box>
          </Card>
        </Grid>

        {/* List Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ margin: 1, p: 2 }}>
            {/* Search Field */}
            <TextField
              fullWidth
              label="گەڕان"
              name="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="ناو ..."
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="هەموو داتاکان">
                      <IconButton onClick={() => { setSearch(''); fetchCategories(); }}>
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
                        <TableCell>{cat.note}</TableCell>
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
                        هیچ داتایەک نەدۆزرایەوە
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="center">
              {categories.length > 0 && (
                <Pagination
                  count={Math.ceil(categories.length / rowsPerPage)}
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
        title="سڕینەوەی گرووپ"
        description="ئایە دڵنیایت لە سڕینەوەی ئەم گرووپە؟ ئەم کردارە گەرێنەوە نییە."
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

export default ExpensesCategoryManagment;